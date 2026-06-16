# Learn AI / Learn-LLM

Learn AI 是一个中文 AI 学习平台，面向开发者和知识工作者，提供教程库、学习路径、场景检索、工具向导、提示词库和技能包等学习入口。

当前默认 GitLab 仓库：

```bash
git remote set-url gitlab http://192.168.120.62/personal/phoenix/learnllm.git
```

## 当前能力

- 教程库：按分类、难度、发布状态管理 Markdown 教程内容。
- 学习路径：把教程组织成连续课程，支持路径详情和章节化学习。
- 工具向导：按工具提供分步学习入口，例如 Claude Code、Codex、Trae、Coze 等。
- 场景检索：从真实工作目标出发，推荐相关工具链和教程。
- 提示词库：沉淀可复用提示词模板。
- 技能包：管理可组合的 AI 工作技能和技能集合。
- 我的学习：登录用户可收藏教程、查看学习历史和进度，统一在 `/my-learning` 管理。
- 素材与采集后台：通过 8400 端口管理 RSS/素材/审核/内容生成管道。

## 重要边界

项目里有两个“管理”概念，职责不同：

1. 前端 `/admin/*`

   这是前端用户可见内容的管理入口。`/admin/tutorials` 的发布、下架、编辑只控制前端用户能看到的教程和正文覆盖，不再同步到 8400 后端。

   主要本地存储键：

   - `learn-llm-imported-tutorials`
   - `learn-llm-edited-content`
   - `learn-llm-tutorial-statuses`
   - `learn-llm-custom-pathways`

2. 后端 `http://localhost:8400/admin`

   这是内容采集、素材库、审核队列、RSS 源维护后台。它服务内容生产和素材管理，不是前台教程发布链路。

前台公共页面默认只展示 `published` 教程；草稿可通过管理页预览链接访问。

### 用户与学习数据

平台支持两种登录方式，登录后的收藏、历史、进度等学习数据走 8400 后端持久化：

- **GitHub OAuth**（Supabase）：面向公开站点，配置 Supabase 凭据即用。
- **自托管 JWT**（邮箱注册/登录）：面向企业内部部署，无需第三方服务。由 `auth_utils.py` 签发 JWT，用户表存储在 SQLite（`pipeline/data/admin.db`）。登录态由前端 `useAuth` hook 管理，`/admin/users` 提供用户管理。

未登录或未配置任何认证时，学习数据退化为浏览器 localStorage，前台功能不受影响。

## 技术栈

- 前端：React 18、Vite 5、react-router-dom v6
- UI：Ant Design 5、CSS custom properties、普通 CSS
- Markdown：react-markdown、remark-gfm、react-syntax-highlighter
- 认证：两种可选模式 —— GitHub OAuth（Supabase）或自托管 JWT（邮箱注册/登录）。未配置时前台仍可运行（学习数据退化为 localStorage）。
- 后端：FastAPI、Jinja2、SQLite
- 内容管道：RSS/GitHub/Web fetcher、去重、摘要、分类、写入器
- LLM 后端优先级：ZhipuAI -> Anthropic -> Ollama -> fallback
- 部署：Docker Compose，前端 Nginx + 后端 FastAPI

## 快速开始

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

### 前端生产预览

```bash
cd frontend
npm run build
npm run preview
```

默认访问：

```text
http://localhost:4173
```

### 后端素材/管道后台

```bash
cd pipeline
pip install -r requirements.txt
python -m admin_dashboard.main
```

默认访问：

```text
http://localhost:8400/admin
```

后台 token 由 `ADMIN_TOKEN` 控制，默认开发值为：

```text
learn-llm-admin
```

## Docker 部署

```bash
./deploy.sh
./deploy.sh --build
./deploy.sh --status
./deploy.sh --logs
./deploy.sh --down
```

Docker 服务：

- `frontend`：Nginx 80 端口，挂载 `./content` 到静态内容目录。
- `backend`：FastAPI 8400 端口，挂载 `./content`、`./pipeline/data` 和 `./frontend/src/data`。

`docker-compose.yml` 中后端通过 `FRONTEND_DATA_DIR=/app/frontend-data/` 维护部分前端 JSON 数据源。

## 内容结构

```text
content/
  tutorials/
    index.json
    harness/
    practice/
    workflow/
    principle/
    model/
    development/
  materials/
  skills/

frontend/src/data/
  tutorials-index.json
  pathways-index.json
  tools-index.json
  scenarios-index.json
  prompts-index.json
  skills-index.json
  skills-packages-index.json
  search-index.json
```

教程正文使用 Markdown 文件，教程索引和其他模块使用 JSON 数据。前端运行时会合并静态 JSON、`/content/tutorials/index.json`、localStorage 中的导入教程、正文覆盖和状态覆盖。

## 路由

公共路由：

- `/`
- `/tutorials`
- `/tutorials/:slug`
- `/tools`
- `/tools/:slug`
- `/pathways`
- `/pathways/:slug`
- `/scenarios`
- `/scenarios/:slug`
- `/prompts`
- `/prompts/:slug`
- `/skills`
- `/skills/:package`
- `/skills/:package/:slug`
- `/my-learning`
- `/search`

前端管理路由：

- `/admin/tutorials`
- `/admin/pathways`
- `/admin/materials`
- `/admin/users`

后端管理路由（仅内容采集与素材生产）：

- `/admin`
- `/admin/review`
- `/admin/materials`
- `/admin/sources`

> 场景、提示词、工具、技能等实体的 CRUD 由前端 `/admin/*` 管理（localStorage），不再走 8400 后端。

## 内容管道

```bash
cd pipeline
python run_pipeline.py --full
python run_pipeline.py --source <name>
python run_pipeline.py --list-sources
python run_pipeline.py --update-index
python run_pipeline.py --process-only    # 对已有素材重跑 去重→摘要→分类→写入 + 重建索引
```

测试命令：

```bash
cd pipeline
$env:PYTHONPATH='.'
python tests/test_rss_fetcher.py
python tests/test_dedup.py
python tests/test_writer.py
python tests/test_pipeline.py
python tests/test_summarizer.py
python tests/test_classifier.py
python tests/test_llm_client.py
python tests/test_auth.py
python tests/test_library.py
```

## 环境变量

| 变量 | 说明 | 是否必需 |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | 可选 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | 可选 |
| `ADMIN_TOKEN` | 8400 后端管理后台登录 token | 后端管理必需 |
| `JWT_SECRET` | 自托管认证的 HS256 签名密钥（企业部署建议设置） | 可选 |
| `ALLOW_PUBLIC_REGISTER` | 自托管注册开关，`true` 开放注册（默认），`false` 仅限管理员创建账号 | 可选 |
| `VITE_ADMIN_TOKEN` | 前端访问素材库后端时的 token | 可选 |
| `ZHIPU_API_KEY` | 智谱 API key | 可选 |
| `ZHIPU_API_BASE` | 智谱 API base URL | 可选 |
| `ZHIPU_MODEL` | 智谱模型名 | 可选 |
| `ANTHROPIC_API_KEY` | Anthropic API key | 可选 |
| `OLLAMA_BASE_URL` | Ollama 服务地址 | 可选 |
| `PIPELINE_OUTPUT_DIR` | 管道素材输出目录 | 可选 |
| `CONTENT_ROOT` | 后端读取内容根目录 | 可选 |
| `FRONTEND_DATA_DIR` | 后端维护前端 JSON 数据目录 | 可选 |

## 常用 Git

默认 GitLab remote 应指向：

```bash
gitlab  http://192.168.120.62/personal/phoenix/learnllm.git
```

推送当前分支：

```bash
git fetch gitlab
git push gitlab master
```

如需同步 GitHub 镜像：

```bash
git push origin master
```

## 维护提示

- 不要把 `.claude/`、`.playwright-mcp/`、`__pycache__/`、SQLite 数据库和本地截图混入业务提交。
- 前端教程发布状态由前端管理页和 localStorage 控制，不需要调用 8400 后端发布接口。
- 修改前台展示逻辑时，注意所有公共入口都应过滤 `status: published`。
- 修改 CSS 时优先使用 `src/index.css` 中的设计变量。

## License

MIT
