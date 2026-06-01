# 🧠 Learn AI — AI 学习平台

一个开源、引导式的 AI 学习平台，帮助用户从入门到精通地使用各类 AI 专业工具。

## 核心理念

- **引导式学习**：三条入口（学习路径 / 场景检索 / 工具向导）降低上手门槛
- **开源驱动**：内容托管在 GitHub，社区 PR 贡献
- **内容聚合**：多源内容经 AI 加工，人工审核后融入教程

## 技术栈

- **前端**：React 18 + Vite + react-router-dom v6
- **样式**：CSS 变量 + 普通 CSS（无 Tailwind）
- **渲染**：react-markdown + react-syntax-highlighter
- **后端**：Python FastAPI + Supabase (PostgreSQL)
- **AI 管道**：sentence-transformers + Claude API / Ollama
- **部署**：Docker Compose (Nginx + FastAPI)

---

## 快速部署

### 前置要求

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24+)
- [Supabase](https://supabase.com) 账号（免费层即可）

### 1. 配置 Supabase

1. 在 [Supabase Dashboard](https://supabase.com/dashboard) 创建项目
2. SQL Editor → 运行 `supabase/migrations/001_init.sql`
3. Authentication → Providers → 启用 GitHub
4. Settings → API → 复制 **Project URL** 和 **anon public key**

### 2. 启动服务

```bash
# 克隆仓库
git clone https://github.com/phoenixsun2001/learn-llm.git
cd learn-llm

# 配置环境
cp .env.example .env
# 编辑 .env，填入 Supabase URL 和 Anon Key

# 一键部署
./deploy.sh
```

访问：
- 前端：**http://localhost**
- 管理后台：**http://localhost:8400/admin**
- 后台 Token：`learn-llm-admin`（可在 .env 中修改）

### 3. 常用命令

```bash
./deploy.sh              # 启动/重启
./deploy.sh --status     # 查看状态
./deploy.sh --logs       # 查看日志
./deploy.sh --down       # 停止

# 运行内容管道
./deploy.sh --pipeline --full
./deploy.sh --pipeline --source langchain_blog
./deploy.sh --pipeline --list-sources
```

---

## 本地开发

```bash
# 前端
cd frontend && npm install && npm run dev

# 管道管理后台
cd pipeline && pip install -r requirements.txt
python -m admin_dashboard.main
```

---

## 项目结构

```
learn-llm/
├── frontend/              # React SPA
│   ├── Dockerfile           # 多阶段构建 (Node → Nginx)
│   ├── nginx.conf           # SPA 路由 + 缓存策略
│   └── src/
├── pipeline/              # 内容管道
│   ├── Dockerfile           # Python 3.12 容器
│   ├── fetchers/            # 内容采集器
│   ├── processors/          # AI 处理器
│   ├── output/              # 输出写入器
│   ├── admin_dashboard/     # 管理后台 (FastAPI)
│   └── run_pipeline.py      # CLI 入口
├── content/               # 教程 Markdown
├── supabase/              # 数据库迁移
├── docker-compose.yml     # Docker 编排
├── deploy.sh              # 部署脚本
└── docs/                  # 设计文档
```

---

## Docker 服务架构

```
docker compose up
    ├── frontend (nginx:80)     ← React SPA
    │     └── Supabase (Cloud)  ← Auth + PostgreSQL
    └── backend  (FastAPI:8400) ← 管道管理 + 审核后台
          ├── SQLite (容器内)
          └── content/ (挂载卷)
```

---

## 内容管道

5 步处理流程：**采集 → 去重 → 摘要 → 分类 → 输出**

```bash
# 完整管道
docker compose exec backend python run_pipeline.py --full

# 查看可用 RSS 源
docker compose exec backend python run_pipeline.py --list-sources

# 更新前端搜索索引
docker compose exec backend python run_pipeline.py --update-index
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | 必填 |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名公钥 | 必填 |
| `ADMIN_TOKEN` | 管理后台登录 Token | `learn-llm-admin` |
| `ANTHROPIC_API_KEY` | Claude API 密钥（可选，启用 AI 摘要） | - |
| `OLLAMA_BASE_URL` | Ollama 服务地址 | `http://localhost:11434` |

---

## 故障排查

### 登录后台报 500 错误
```bash
# 重建后端镜像
docker compose build backend --no-cache
docker compose up -d backend
```

### 前端未显示登录按钮
```bash
# 检查 .env 是否配置正确
cat .env | grep VITE_SUPABASE
docker compose restart frontend
```

### 镜像拉取慢
编辑 `~/.docker/daemon.json`，移除失效的 `registry-mirrors` 配置项。

### 端口冲突
编辑 `docker-compose.yml` 修改端口映射：
```yaml
ports:
  - "8080:80"    # 前端改为 8080
  - "8410:8400"  # 后台改为 8410
```

---

## 贡献

欢迎贡献教程内容！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

MIT License
