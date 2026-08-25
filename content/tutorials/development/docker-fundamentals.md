上一章我们把项目整理成"可构建的产物"，但产物仍然要在目标机器上配环境：Python 版本、系统依赖、Nginx 配置……**容器（Docker）把这一切连同运行环境一起打包**，让产物变成"在哪都能跑"的镜像。

本平台的部署本身就是活教材：`frontend/Dockerfile` + `pipeline/Dockerfile` + `docker-compose.yml` 就是一个完整的前后端容器化案例，本文会直接拆解它。

## 你将学到

- 镜像与容器的概念关系（类与实例）
- Dockerfile 的核心指令与多阶段构建
- 数据卷：容器里"会丢"的和"要留下"的
- docker compose：把多容器服务编排成一键部署
- 新手最常见的容器化误区

## 镜像与容器：类与实例

- **镜像（Image）**：一个分层只读的"安装包"，包含运行所需的全部（代码 + 运行时 + 依赖 + 配置）。由 Dockerfile 构建，可版本化、可推送仓库。
- **容器（Container）**：镜像的一次**运行实例**。同一个镜像可以起 N 个容器；容器删除后，其可写层的数据默认丢弃。

一句话：**镜像保证一致性，容器提供隔离性**。"在我机器上能跑"的问题，被"镜像里都带着"终结。

## Dockerfile：核心指令速成

以本平台前端为例（真实文件，多阶段构建）：

```dockerfile
# ---- 阶段 1：构建（node 环境） ----
FROM node:20-alpine AS builder      # 基础镜像：带版本，别用 latest
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false       # 先只拷依赖清单 → 命中缓存
COPY . .
RUN npm run build                   # 产出 dist/

# ---- 阶段 2：运行（只要 nginx，不带 node） ----
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

逐条要点：

- `FROM ... AS` + `COPY --from=`：**多阶段构建**——构建阶段的 node_modules、源码全部丢弃，最终镜像只有静态文件和 nginx（本平台前端镜像仅 77MB）。
- **依赖清单先 COPY 再 install**：代码变动不会击穿依赖层缓存，构建提速一个量级。
- `.dockerignore` 排除 `node_modules/`、`.git/` 等，否则 `COPY . .` 会把垃圾带进构建上下文。
- `EXPOSE` 是声明；真正映射端口靠运行时 `-p` 或 compose。
- `CMD` 是默认启动命令，写成 JSON 数组形式。

## 数据卷：容器里"会丢"的与"要留下"的

容器删了就重建，但数据库、上传的文件、生成的素材必须活过容器生命周期——用**卷（Volume）挂载**把宿主机目录"贴"进容器：

```yaml
volumes:
  - ./content:/usr/share/nginx/html/content   # bind mount：宿主目录直通容器
  - pgdata:/var/lib/postgresql/data           # named volume：docker 托管
```

本平台的实践：`content/`（教程内容）、`pipeline/data/`（SQLite）都走 bind mount——**容器随时可重建，数据留在宿主机**。这带来一个部署便利：更新内容有时不需要重建镜像。

> 踩坑预警：Windows 宿主 + Docker Desktop 的 bind mount 在容器内做**递归删除**可能不生效（写入正常、删除滞后）。同步大量文件时用"复制覆盖"而不是"先删后拷"。

## docker compose：一键编排

单容器靠 `docker run` 一长串参数，多容器服务用 compose 声明成文件（本平台节选）：

```yaml
services:
  frontend:
    build: ./frontend            # 或 image: xxx 直接用现成镜像
    ports: ["8001:80"]
    volumes: ["./content:/usr/share/nginx/html/content"]
    restart: unless-stopped      # 开机自启、崩溃自动拉起
    depends_on: [backend]
  backend:
    build: ./pipeline
    ports: ["8400:8400"]
    environment:
      - ADMIN_TOKEN=${ADMIN_TOKEN}   # 从 .env 读，秘密不进文件
    volumes: ["./content:/app/content", "./pipeline/data:/app/data"]
```

常用命令：

```bash
docker compose up -d          # 后台启动全部服务
docker compose up -d --build  # 代码更新后重建镜像并滚动更新
docker compose logs -f        # 跟踪日志
docker compose down           # 停止并移除容器（卷数据保留）
```

## 新手四大误区

1. **用 `latest` 标签**：今天拉的 latest 和明天不一样，不可复现。基础镜像、依赖版本全部钉死。
2. **把数据写在容器层**：容器一删全没。凡是需要留下的，先问"它在不在卷里"。
3. **在容器里手改文件当部署**：`docker exec` 进去改代码，镜像没变，下次重建全还原。要改就改源码重新构建。
4. **镜像里塞秘密**：`ENV API_KEY=xxx` 会被 `docker history` 永久记录。秘密走运行时环境变量或 secret 管理。

## 典型场景

- **场景 A：前后端分离的 AI 应用。** 前端多阶段构建出 nginx 镜像，后端 FastAPI 打成 python 镜像，compose 编排 + 共享网络 + 卷挂载数据——本平台同款结构。
- **场景 B：GPU 推理服务。** 基础镜像换 `nvidia/cuda` 系，运行时 `--gpus all`，模型权重走卷挂载避免打进镜像（一个 6GB 的模型让镜像仓库痛不欲生）。
- **场景 C：本地开发环境统一。** 数据库、Redis 不再各自安装，`docker compose up -d postgres redis`，团队每人一键起同样的环境。

## 小结

容器化的心法：**多阶段构建出小镜像、依赖层缓存提速度、卷保数据、compose 管编排、秘密不入镜像**。到这里，你的产物已经是"带着运行环境的产物"了。下一篇把它真正放到服务器上：域名、HTTPS、反向代理。

## 延伸阅读

- 下一篇：《部署上线：Nginx 反向代理、域名与 HTTPS》
- [Dockerfile 官方最佳实践](https://docs.docker.com/build/building/best-practices/)
- [Compose 文件参考](https://docs.docker.com/compose/compose-file/)
- 本平台仓库内：`frontend/Dockerfile`、`pipeline/Dockerfile`、`docker-compose.yml`
