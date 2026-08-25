想象这个场景：一台内网 Windows 服务器上跑着你的 Docker 服务，运维只肯给你**一条到 Docker daemon 的隧道**——没有 SSH、没有 git 凭据、看不到文件系统。"把最新版本发上去"，就是全部要求。

这不是假设。本平台的一次真实发版正是这么完成的：全程只通过 `DOCKER_HOST` 指向远端 daemon，完成了**重建镜像、传输、内容同步、容器重建与验证**的完整链路。这篇教程把整个过程（包括踩过的两个经典坑）整理成可复用的方法，并说明"AI 辅助"在其中真正的分工。

## 你将学到

- 远程 Docker 部署的思维模型：什么必须重建镜像、什么只需同步卷
- 用 `docker inspect` 侦察目标环境（compose 项目、挂载、环境变量）
- 镜像跨 daemon 传输的标准姿势：`docker save | docker load`
- **两个高频坑**：`docker cp` 目录嵌套、Windows 卷挂载删除不生效——及各自的可靠解法
- 用"重建的 compose 描述"让远端容器安全滚动更新
- AI 辅助部署中，人该提供什么、该在哪些点保持在场

## 第零步：思维模型——先分清"镜像里"与"挂载上"

远程部署前先回答一个问题：**这次变更动了什么？**

| 变更类型 | 落点 | 更新方式 |
|----------|------|----------|
| 前端源码/打包进 bundle 的资源 | **镜像内部**（编译产物） | 必须重建镜像 |
| 后端代码、依赖 | 镜像内部 | 必须重建镜像 |
| 运行时读取的内容（Markdown、上传文件、JSON 数据） | **bind mount 的宿主目录** | 同步卷即可，无需重建 |

本平台结构是典型样本：前端 bundle 与后端 Python 代码在镜像里；`content/`（教程正文）与 `frontend/src/data/` 走宿主机 bind mount 运行时读取。所以一次"内容+前端"更新 = **重建前端镜像 + 同步两个卷**，后端镜像零变更可跳过——这个判断直接决定了整个部署只动一半的东西。

## 第一步：建立安全通道

Docker daemon 的 TCP 端口（2375）**默认无认证**，绝不能直接暴露在网络上。正确姿势是 SSH 隧道：

```bash
# 在你的机器上建立隧道，把远端 daemon 转发到本地 2375
ssh -N -L 2375:127.0.0.1:2375 user@服务器IP
```

然后所有 docker 命令加前缀（或 export）：

```bash
export DOCKER_HOST=tcp://127.0.0.1:2375
docker ps        # 现在列的是远端服务器的容器
```

安全三原则：2375 只绑远端 localhost、对外只走 SSH 隧道、隧道用完即断。生产环境更规范的做法是 2376+TLS 或 docker context over ssh，但"隧道 + 一次性授权"对小团队足够且门槛最低。

## 第二步：侦察目标环境

不看清楚就动手是远程部署大忌。四条命令把目标摸透：

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker inspect 容器名   # 重点看三处 ↓
```

- **Compose 标签**：`com.docker.compose.project` / `project.working_dir` → 容器由哪套 compose 管理、宿主路径长什么样（例如本例是 `C:\Users\Administrator\...\learnllm-master`，一眼确认宿主是 Windows）。
- **Mounts**：`Source -> Destination` → 哪些是 bind mount（挂载点即宿主目录），这些目录就是"不重建镜像也能更新内容"的通道。
- **Config.Env 与 PortBindings**：重建容器时要原样复刻的参数。

侦察还会带来战术判断：比如发现"前端容器与后端容器挂了同一个宿主目录"，则同步一次即可两边生效。

## 第三步：本地构建（并先验证再传输）

在本地用**与远端一致的镜像名**构建：

```bash
docker build -t learnllm-master-frontend ./frontend
```

两个关键习惯：

1. **只重建有变更的镜像**。后端代码没动就跳过——少一次构建、少 60MB 传输、少一次容器重启。
2. **传输前先验证镜像内容**。起一个一次性容器检查关键产物，把问题挡在本地：

```bash
docker run --rm --entrypoint sh learnllm-master-frontend \
  -c "grep -l '新功能标识' /usr/share/nginx/html/assets/*.js"
```

## 第四步：跨 daemon 传输镜像

本地与远端是两个 daemon，`docker push/pull` 需要 registry，而 `save | load` 不需要：

```bash
docker save -o fe.tar learnllm-master-frontend          # 本地导出
DOCKER_HOST=tcp://127.0.0.1:2375 docker load -i fe.tar  # 远端导入
```

传输后核对远端镜像 ID 已变化（这是后续回滚点的依据）：

```bash
DOCKER_HOST=tcp://127.0.0.1:2375 docker images learnllm-master-frontend
```

## 第五步：内容卷同步——两个坑与正确姿势

**通过容器写挂载点 = 直接写宿主机**，这是我们同步内容的唯一通道。但有两个坑，第一次做几乎必踩：

### 坑一：`docker cp` 目录嵌套

```bash
# 目标目录已存在时——错，会变成 /目标/tutorials/tutorials/...（嵌套一层）
docker cp ./content/tutorials 容器:/app/content/tutorials
```

`docker cp` 的语义是"把源**放进**目标"，目标已存在就嵌套。结果是新文件落在 `/tutorials/tutorials/` 里，线上依旧 404，且表面看"命令成功了"。

### 坑二：Windows 卷挂载的删除不生效

Docker Desktop + Windows 宿主下，容器内对 bind mount 执行 `rm -rf` 经常**不落地**（写入、复制正常，删除静默失败）。"先删目录再重拷"的方案会当场翻车：目录删不掉，重拷又嵌套。

### 可靠姿势：临时路径 + `cp -a` 覆盖

```bash
# 1) 拷到容器"自己的可写层"（不在挂载点内），全新路径不会嵌套
docker cp ./content/tutorials 容器:/app/.tut-sync

# 2) 容器内用 cp -a 把内容覆盖到挂载点（复制对 Windows 挂载可靠）
docker exec 容器 sh -c "cp -a /app/.tut-sync/. /app/content/tutorials/ && rm -rf /app/.tut-sync"
```

两个细节：`src/.` 表示"目录内容"而非目录本身；临时目录建在挂载点之外，删它不受坑二影响。若变更涉及**删除**文件（本例没有），复制覆盖不会删除多余文件，需要逐个 `rm -f` 具体文件（单文件删除通常可靠）。

**不确定两个容器是否共享同一宿主目录时**，用标记文件验证：容器 A 写入挂载点，容器 B 读取，读到即同源。

## 第六步：重建容器——重建一份 compose 描述

镜像换了 tag 指向，容器不会自动用新镜像，需要重建。最稳妥的方式不是手拼 `docker run`（几十个参数极易错漏，还会丢 compose 标签），而是**按侦察结果重写一份 compose 文件**，对远端 daemon 执行：

```yaml
name: learnllm-master          # 与远端 compose 项目同名 → 接管而非新建
services:
  frontend:
    image: learnllm-master-frontend:latest
    container_name: learn-llm-frontend
    ports: ["8001:80"]
    volumes:
      - "C:/Users/Administrator/.../content:/usr/share/nginx/html/content"  # 绝对路径用宿主的
    restart: unless-stopped
```

```bash
docker compose -f 描述文件.yml --project-name learnllm-master up -d
```

要点：**挂载路径必须是远端宿主的绝对路径**（本例是 Windows 路径，正斜杠写法最稳）；项目名与远端一致，compose 会识别既有容器并**只重建有变化的**（本例仅 frontend 被重建，backend 全程未动、零多余停机）；网络、环境变量按 inspect 结果原样复刻。

## 第七步：验证清单

容器内验证（注意用 `127.0.0.1` 而非 `localhost`——容器内 localhost 可能解析为 IPv6，得到误导性的"连接拒绝"）：

```bash
docker exec learn-llm-frontend sh -c "wget -qO- http://127.0.0.1/content/新增文件.md | head -1"
docker exec learn-llm-backend  python -c "import urllib.request as u; print(u.urlopen('http://localhost:8400/openapi.json').status)"
```

再从**外部**访问一次公网/内网地址，确认用户视角正常；比对首页引用的 bundle 文件名与新构建一致，确认线上跑的确实是新版本。

## 回滚预案

- **同步前备份**：`docker cp 容器:/挂载路径 ./backup` 把远端数据拉回本地留存。
- **镜像回滚点**：部署前记录旧镜像 ID（`docker images` 输出），出问题用旧 ID 重新 tag 并重建容器即可，分钟级恢复。
- 这两件事都应该在**动手改远端之前**完成，而不是出事之后。

## AI 辅助的分工：人提供通道与确认，AI 执行流程

这次部署里 AI（编码智能体）与人的实际分工值得参考：

- **人做的**：提供 SSH 隧道（唯一凭证类操作）、在关键节点说"继续"。人是授权边界。
- **AI 做的**：侦察环境并推断部署结构、判断"只重建前端"、写构建/同步/重建命令并执行、踩坑后定位原因（嵌套、删除不生效）并改用可靠方案、逐层验证并如实报告。
- **关键设计**：每一步先验证再前进（镜像内容本地验证 → 同步后核对文件 → 重建后容器内外验证），错了当场回退，而不是"跑完脚本再总验收"。

这也是"AI 辅助部署"的合理边界：**凡涉及凭证、授权、不可逆动作（删数据、公网变更），人必须在环；重复性、可验证的流程执行，交给 AI**。

## 典型场景

- **场景 A：运维只给 daemon 隧道的内网环境。** 全流程照搬：隧道 → 侦察 → save/load → 卷同步 → compose 重建 → 验证。
- **场景 B：有 SSH 的常规环境。** 不必绕 Docker：服务器上 `git pull && docker compose up -d --build` 三行更干净。本文流程的价值在于**没有这个前提时依然能发版**。
- **场景 C：多环境批量更新。** 把"侦察→构建→传输→同步→重建→验证"固化成脚本/CI 任务，AI 负责生成与维护脚本，人负责审批执行。

## 小结

只有 Docker daemon 权限的远程发版，本质是四件事：**侦察定策略（镜像 vs 卷）→ 本地构建并预验证 → save/load 传输 + 临时路径同步卷 → 同名 compose 滚动重建**。两个必踩的坑（docker cp 嵌套、Windows 挂载删除不落地）都有确定解法。而 AI 的正确用法，是把这套流程从"某人的手艺"变成"可对话、可验证、可复盘的工程过程"——人守授权与确认，AI 守执行与验证。

## 延伸阅读

- 本路径前置篇：《容器化实战》《部署上线》《CI/CD 入门》《持续迭代》
- [Docker CLI 文档：docker cp / save / load](https://docs.docker.com/reference/cli/docker/)
- [Docker Compose 参考](https://docs.docker.com/compose/compose-file/)
- [Docker daemon 安全：TLS 与远程访问](https://docs.docker.com/engine/security/)
