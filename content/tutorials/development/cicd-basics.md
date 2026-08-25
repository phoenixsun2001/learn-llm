到上篇为止，每次发版都要人工执行一遍：拉代码 → 构建镜像 → 传服务器 → 重启容器 → 验证。三次之后你就会开始漏步骤、传错文件、忘记备份。**CI/CD 把这套流程写成代码，让机器替你执行**——推一个 commit，测试、构建、发布自动完成。

这是全链路路径中"杠杆率"最高的一环：配置一次，之后每一次迭代都自动享受质量保障。

## 你将学到

- CI 与 CD 各自解决什么问题
- 用 GitHub Actions 写一条"测试→构建镜像→推送仓库"的流水线
- GitLab CI 的对应写法与选型
- 密钥管理（CI 里的密码怎么放）
- 触发策略：什么情况触发什么动作

## 概念先分清

- **CI（持续集成）**：每次提交自动跑**测试、lint、构建**，尽早暴露"这次改动把什么弄坏了"。
- **CD（持续交付/部署）**：CI 通过后，自动把产物（镜像/包）发布到仓库，甚至自动部署到服务器。

最小可用原则：**先 CI 后 CD**。测试都没有就上自动部署，等于给生产线装了自动驾驶但没有刹车。

## GitHub Actions：一条完整流水线

在仓库放 `.github/workflows/ci.yml`：

```yaml
name: ci
on:
  push:
    branches: [master]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: frontend/package-lock.json }
      - run: npm ci
        working-directory: frontend
      - run: npm run build          # 构建即验证：编译不过=失败

  publish:
    needs: test                     # 测试过了才发布
    if: github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}   # 内置令牌，零配置
      - uses: docker/build-push-action@v6
        with:
          context: ./frontend
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/frontend:latest
            ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}
```

读这条流水线学到四个模式：

1. **PR 只跑测试，master 才发布**——`if` 控制触发面。
2. **`needs` 建立 job 依赖**——测试是发布的闸门。
3. **镜像双标签**：`latest`（追踪最新）+ commit SHA（可追溯、可回滚）。
4. **`secrets.GITHUB_TOKEN`** 是 Actions 内置令牌，推 ghcr 不需要额外配置密钥。

## GitLab CI 的对应写法

自建 GitLab（如本平台的内网 GitLab）用根目录 `.gitlab-ci.yml`：

```yaml
stages: [test, publish]

test:
  stage: test
  image: node:20-alpine
  script:
    - cd frontend && npm ci && npm run build

publish:
  stage: publish
  image: docker:27
  services: [docker:27-dind]
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA ./frontend
    - docker push $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA
  only: [master]
```

GitLab 自带容器仓库（`$CI_REGISTRY_IMAGE`）与流水线密钥（Settings → CI/CD → Variables），内网闭环非常顺手。

## CD 的"最后一公里"：怎么到服务器

镜像进了仓库，服务器怎么更新？三档方案按需选：

| 方案 | 做法 | 适合 |
|------|------|------|
| **手动拉取**（推荐起步） | 服务器 `docker compose pull && docker compose up -d`，两行命令 | 小团队、低频发布 |
| **SSH 触发** | CI 里 `ssh user@server "cd /app && ./deploy.sh"` | 中频发布 |
| **Pull/Agent 型** | Watchtower / ArgonCD / Portainer 自动追踪新镜像 | 多服务、高频发布 |

新手建议从第一档开始：**CI 保证产物质量，部署动作保持手动但只有两行**——既消灭重复劳动，又保留人的确认点。

## 密钥管理铁律

- 密钥只存在 CI 的 Secrets/Variables 里，日志里自动打码。
- 最小权限：`GITHUB_TOKEN` 的 `permissions` 按需收窄（如上例只给 `packages: write`）。
- SSH 私钥做成部署专用 key，服务器上限制该 key 只能执行部署脚本（`command=` 前缀）。
- 任何出现在 workflow 明文里的 token 都视为已泄露，立即轮换。

## 触发策略速查

- `push`（分支过滤）：主干每次提交跑 CI——基本盘。
- `pull_request`：协作开发的守门员，合并前必须绿。
- `tags v*`：打版本号才发布正式包——发布与提交解耦。
- `workflow_dispatch`：留一个手动按钮，随时可手动触发。

## 典型场景

- **场景 A：个人 AI 项目。** 一条 workflow：push → lint + build + 推 ghcr 镜像；服务器两行命令拉取更新。总成本半小时配置，之后终身受益。
- **场景 B：团队协作。** 分支保护规则：PR 必须过 CI 才能合并；master 的每次合并自动产出带 SHA 的镜像，出问题能秒回滚。
- **场景 C：本平台这类双远端项目。** GitHub Actions 出镜像（ghcr），内网 GitLab CI 也可复用同一 Dockerfile——流水线不同，构建定义共享。

## 小结

CI/CD 的本质是**把发版流程从"人的记忆"搬进"仓库里的代码"**：测试挡住坏提交，镜像仓库沉淀可回滚的产物版本，部署简化成两行命令。下一篇我们把视角拉高，看多环境、负载与数据的部署架构设计。

## 延伸阅读

- 下一篇：《部署架构设计：环境、负载与数据管理》
- [GitHub Actions 文档](https://docs.github.com/actions)
- [GitLab CI 文档](https://docs.gitlab.com/ee/ci/)
- [docker/build-push-action](https://github.com/docker/build-push-action)
