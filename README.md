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

## 快速开始

### Docker 部署（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Supabase URL 和 Anon Key

# 2. 一键启动
docker compose up -d --build

# 3. 访问
# 前端:      http://localhost
# 管理后台:  http://localhost:8400/admin (默认 Token: learn-llm-admin)
```

### 本地开发

```bash
# 前端
cd frontend && npm install && npm run dev

# 管道管理后台
cd pipeline && pip install -r requirements.txt
python -m admin_dashboard.main
```

## 项目结构

```
learn-llm/
├── frontend/              # React SPA
│   ├── Dockerfile           # 多阶段构建 (Node → Nginx)
│   ├── nginx.conf           # SPA 路由 + 缓存策略
│   └── src/
│       ├── components/      # 可复用组件
│       ├── pages/           # 页面组件
│       ├── data/            # 内容索引 JSON
│       ├── services/        # 内容加载器 + Supabase
│       └── hooks/           # 自定义 Hooks
├── pipeline/              # 内容管道（采集、处理、输出）
│   ├── Dockerfile           # Python 3.12 容器
│   ├── fetchers/            # 内容采集器 (RSS, Web, GitHub)
│   ├── processors/          # 处理器 (去重、摘要、分类)
│   ├── output/              # 输出写入器
│   ├── admin_dashboard/     # 管理后台 (FastAPI + Jinja2)
│   └── run_pipeline.py      # CLI 入口
├── content/               # 教程 Markdown 文件
├── supabase/              # 数据库迁移脚本
├── docker-compose.yml     # Docker 编排
├── .env.example           # 环境变量模板
└── docs/                  # 设计文档
```

## 内容管道 (Pipeline)

内容管道自动从多个来源采集 AI 相关内容，经过去重、AI 摘要生成和分类后，输出为结构化的教程素材。

### 使用方法

```bash
# Docker 环境
docker compose exec backend python run_pipeline.py --full

# 本地环境
cd pipeline
python run_pipeline.py --full              # 运行完整管道
python run_pipeline.py --fetch-only        # 仅采集 RSS 源
python run_pipeline.py --source langchain_blog  # 采集指定来源
python run_pipeline.py --list-sources       # 列出可用 RSS 源
python run_pipeline.py --update-index       # 仅更新搜索索引
```

### 管道步骤

1. **采集 (Fetch)**: 从 RSS 源抓取文章
2. **去重 (Dedup)**: 基于语义向量相似度去重
3. **摘要 (Summarize)**: 使用 AI 生成中文摘要
4. **分类 (Classify)**: 自动分类和难度评级
5. **输出 (Write)**: 写入 Markdown + JSON metadata

### 管理后台

```bash
# Docker 环境（已自动启动）
# 访问 http://localhost:8400/admin

# 本地环境
cd pipeline
python -m admin_dashboard.main
# 访问 http://127.0.0.1:8400/admin
# 默认 Token: learn-llm-admin (可通过 ADMIN_TOKEN 环境变量修改)
```

### 运行测试

```bash
cd pipeline
PYTHONPATH="." python tests/test_rss_fetcher.py
PYTHONPATH="." python tests/test_dedup.py
PYTHONPATH="." python tests/test_writer.py
PYTHONPATH="." python tests/test_pipeline.py
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名公钥 | - |
| `ANTHROPIC_API_KEY` | Claude API 密钥（可选） | - |
| `OLLAMA_BASE_URL` | Ollama 服务地址 | `http://localhost:11434` |
| `ADMIN_TOKEN` | 管理后台登录 Token | `learn-llm-admin` |

## Docker 服务架构

```
┌──────────────────────────────────────────┐
│              Docker Compose               │
│                                          │
│  ┌──────────┐    ┌───────────────────┐   │
│  │ frontend  │    │     backend       │   │
│  │ nginx:80  │    │  FastAPI :8400    │   │
│  │ (React)   │    │  (Pipeline+Admin) │   │
│  └──────────┘    └───────────────────┘   │
│       │                  │               │
│       ▼                  ▼               │
│  ┌─────────────┐  ┌───────────────┐     │
│  │ Supabase     │  │ SQLite +      │     │
│  │ (Auth + DB)  │  │ content/ mount│     │
│  │ Cloud SaaS   │  │ (Local)       │     │
│  └─────────────┘  └───────────────┘     │
└──────────────────────────────────────────┘
```

## 贡献

欢迎贡献教程内容！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

MIT License
