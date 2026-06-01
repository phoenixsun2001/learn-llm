# AI Learning Platform — Phase 3: 内容管道 实施计划

> **For agentic workers:** Use superpowers:subagent-driven-development

**Goal:** 构建内容采集→AI加工→审核管理的完整管道系统，以及知识管理后台。

**Prerequisites:** Phase 1+2 前端完成

---

## 文件结构总览

```
pipeline/
├── requirements.txt
├── config.py                  # 配置管理（API keys、路径、RSS源列表）
├── fetchers/
│   ├── __init__.py
│   ├── rss_fetcher.py         # RSS 订阅抓取
│   ├── web_fetcher.py         # 通用网页抓取（X、公众号等通过RSS桥接）
│   └── github_fetcher.py      # GitHub PR 内容抓取
├── processors/
│   ├── __init__.py
│   ├── dedup.py               # 文本去重（sentence-transformers embedding + cosine similarity）
│   ├── summarizer.py          # LLM 摘要生成
│   ├── classifier.py          # LLM 分类 + 难度评估
│   └── linker.py              # 关联匹配 + 交叉引用
├── output/
│   ├── __init__.py
│   └── writer.py              # 统一输出为 Markdown + JSON 元数据
├── admin_dashboard/
│   ├── main.py                # FastAPI 入口
│   ├── models.py              # SQLite 数据模型
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── review.py          # 审核队列 API
│   │   ├── materials.py       # 素材库 CRUD API
│   │   └── sources.py         # RSS 源管理 API
│   ├── templates/
│   │   ├── base.html          # 基础布局模板
│   │   ├── dashboard.html     # 仪表盘首页
│   │   ├── review_queue.html  # 审核队列页
│   │   ├── material_edit.html # 素材编辑页
│   │   ├── materials.html     # 素材库浏览页
│   │   └── sources.html       # RSS 源管理页
│   └── static/
│       └── style.css          # 后台样式
└── tests/
    ├── __init__.py
    ├── test_dedup.py
    ├── test_summarizer.py
    └── test_classifier.py
```

---

### Task 3.1: Python 项目初始化 + 配置管理

**Files:**
- Create: `pipeline/requirements.txt`
- Create: `pipeline/config.py`
- Create: `pipeline/__init__.py`
- Create: `pipeline/fetchers/__init__.py`
- Create: `pipeline/processors/__init__.py`
- Create: `pipeline/output/__init__.py`

**Requirements:**

requirements.txt:
```
feedparser==6.0.11
httpx==0.27.0
fastapi==0.115.0
uvicorn[standard]==0.30.0
jinja2==3.1.4
sentence-transformers==3.0.1
chromadb==0.5.0
anthropic==0.34.0
python-dotenv==1.0.1
pydantic==2.8.0
```

config.py — 使用 pydantic BaseSettings 管理配置：
- RSS_FEEDS: 默认 RSS 源列表（dict，key为源名，value为URL）
- ANTHROPIC_API_KEY: 可选，AI加工用（不设置则跳过AI加工步骤）
- OLLAMA_BASE_URL: 可选，本地Ollama地址（默认 http://localhost:11434）
- PIPELINE_OUTPUT_DIR: 输出目录（默认 ../content/materials/）
- SQLITE_DB_PATH: 知识后台数据库路径（默认 data/admin.db）
- DEDUP_THRESHOLD: 去重相似度阈值（默认 0.85）
- MAX_ITEMS_PER_FETCH: 每次抓取最大条目数（默认 20）

RSS_FEEDS 默认值包含：
```python
{
    "anthropic_blog": "https://www.anthropic.com/blog/rss.xml",
    "openai_blog": "https://openai.com/blog/rss.xml",
    "langchain_blog": "https://blog.langchain.dev/rss/",
    "dify_blog": "https://dify.ai/blog/rss",
}
```

---

### Task 3.2: RSS 抓取器

**Files:**
- Create: `pipeline/fetchers/rss_fetcher.py`
- Create: `pipeline/tests/test_rss_fetcher.py`

**Requirements:**

rss_fetcher.py — `fetch_rss_feed(url, name, max_items)` 函数：
- 使用 `feedparser` 解析 RSS feed
- 返回结构化条目列表，每项包含：title, link, summary, author, published_at, source_name, source_type="rss", raw_html（条目的原始HTML内容）
- 处理超时和网络错误（返回空列表 + 日志警告）
- 支持从 config.RSS_FEEDS 读取源列表
- `fetch_all_feeds()` 函数遍历所有源并合并结果

---

### Task 3.3: 网页抓取器 + GitHub 抓取器

**Files:**
- Create: `pipeline/fetchers/web_fetcher.py`
- Create: `pipeline/fetchers/github_fetcher.py`

**Requirements:**

web_fetcher.py — `fetch_web_page(url)` 函数：
- 使用 httpx 获取网页内容
- 提取 `<article>` 或 `<main>` 内的文本，fallback 到 body
- 使用简单的 HTML→文本转换（移除 script/style 标签）
- 返回（标题，正文文本）

github_fetcher.py — `fetch_github_md(file_path)` 函数：
- 读取本地 Git 仓库中的 Markdown 文件（content/ 目录下的社区PR内容）
- 解析 YAML frontmatter（如果有）提取元数据
- 返回（元数据，正文Markdown）

---

### Task 3.4: 去重处理器

**Files:**
- Create: `pipeline/processors/dedup.py`

**Requirements:**

dedup.py — `DedupProcessor` 类：
- 使用 `sentence-transformers` 模型（paraphrase-multilingual-MiniLM-L12-v2）生成 embedding
- `deduplicate(items, existing_embeddings)` 方法：
  - 为每个新条目生成 embedding
  - 与已有 embedding 计算 cosine similarity
  - 相似度 > DEDUP_THRESHOLD 的标记为重复，不删除
  - 返回（去重后条目列表，更新后的embedding列表）
- `load_existing_embeddings(materials_dir)` 从已有素材加载 embedding
- 支持 ChromaDB 作为持久化向量存储（可选）

---

### Task 3.5: AI 摘要 + 分类处理器

**Files:**
- Create: `pipeline/processors/summarizer.py`
- Create: `pipeline/processors/classifier.py`

**Requirements:**

summarizer.py — `generate_summary(text, model)` 函数：
- 调用 LLM（优先 Anthropic API，fallback Ollama）生成 150-200 字中文摘要
- 输入：原始标题 + 正文（截断至 3000 字符）
- Prompt 模板指定输出为纯中文摘要
- 处理 API 错误：返回截断原文前200字作为 fallback

classifier.py — `classify_and_rate(item)` 函数：
- 调用 LLM 进行分类 + 难度评估
- 分类选项：principle, model, harness, workflow, development, practice
- 难度选项：beginner, intermediate, advanced
- 返回结构化的分类结果 JSON
- 同样支持 API → Ollama fallback

---

### Task 3.6: 输出写入器

**Files:**
- Create: `pipeline/output/writer.py`

**Requirements:**

writer.py — `MaterialWriter` 类：
- `write_material(item, output_dir)` 方法：
  - 生成唯一 ID（mat-YYYY-MM-NNN 格式）
  - 写出 Markdown 文件到 output_dir/{category}/
  - 写出 JSON 元数据文件到同目录
  - Markdown 格式包含：YAML frontmatter（title, source, date, summary, category, difficulty, tags）
- `update_search_index(materials_dir, frontend_data_dir)` 更新前端的 search-index.json
- 去重检查：不覆盖已有同名文件

---

### Task 3.7: 知识管理后台（FastAPI）

**Files:**
- Create: `pipeline/admin_dashboard/main.py`
- Create: `pipeline/admin_dashboard/models.py`
- Create: `pipeline/admin_dashboard/routes/__init__.py`
- Create: `pipeline/admin_dashboard/routes/review.py`
- Create: `pipeline/admin_dashboard/routes/materials.py`
- Create: `pipeline/admin_dashboard/routes/sources.py`
- Create: `pipeline/admin_dashboard/templates/base.html`
- Create: `pipeline/admin_dashboard/templates/dashboard.html`
- Create: `pipeline/admin_dashboard/templates/review_queue.html`
- Create: `pipeline/admin_dashboard/templates/material_edit.html`
- Create: `pipeline/admin_dashboard/templates/materials.html`
- Create: `pipeline/admin_dashboard/templates/sources.html`
- Create: `pipeline/admin_dashboard/static/style.css`

**Requirements:**

main.py — FastAPI 应用：
- 挂载 review, materials, sources 三个 router
- 静态文件服务（static/）
- Jinja2 模板引擎配置
- 启动时自动创建 SQLite 表
- 绑定 localhost:8400
- 简单的 HTTP Basic Auth 或 token 认证（环境变量 ADMIN_TOKEN）

models.py — SQLAlchemy/sqlite3 模型：
- ReviewQueue 表：id, title, source_url, source_type, raw_content, ai_summary, ai_category, ai_difficulty, status(pending/approved/rejected), created_at
- Material 表：id, title, content, category, difficulty, tags, source_url, status, created_at
- RSSSource 表：id, name, url, category, enabled, last_fetched_at, error_count

**模板页面（Jinja2 + htmx）：**

base.html — 基础布局：
- 侧边导航栏（审核队列、素材库、源管理、管道调度）
- 主内容区
- 最小 CSS（无框架依赖，inline 或 static/style.css）

dashboard.html — 仪表盘：
- 统计卡片：待审核数、本月素材数、活跃RSS源数、最近抓取时间
- 最近待审核条目列表（前5条）

review_queue.html — 审核队列：
- 表格列出所有 pending 条目
- 每行：标题、来源、AI分类/难度、时间、操作按钮（通过/驳回/编辑）
- 点击行展开预览（原始 vs AI加工对比）
- 批量操作：全选 + 批量通过/驳回
- htmx 属性实现无刷新操作

material_edit.html — 素材编辑：
- 双栏布局：左侧 Markdown 源码编辑，右侧实时预览
- 元数据表单：分类下拉、难度下拉、标签输入
- 保存 + 发布按钮

materials.html — 素材库浏览：
- 筛选栏：分类、难度、状态、搜索
- 卡片/表格视图切换
- 点击进入编辑页

sources.html — RSS源管理：
- 源列表表格：名称、URL、分类、状态、最后抓取时间
- 添加/编辑源表单（modal或内联）
- 启用/禁用开关
- 手动触发抓取按钮

static/style.css — 管理后台样式：
- 干净的管理后台风格（类 Ant Design 简洁风）
- 侧边栏固定，主区域滚动
- 表格、表单、按钮、badge 样式

---

### Task 3.8: 管道 CLI + 集成测试

**Files:**
- Create: `pipeline/run_pipeline.py`
- Create: `pipeline/tests/test_pipeline.py`

**Requirements:**

run_pipeline.py — CLI 入口：
```bash
# 完整管道运行
python run_pipeline.py --full

# 仅抓取
python run_pipeline.py --fetch-only

# 仅加工（处理已抓取内容）
python run_pipeline.py --process-only

# 指定RSS源
python run_pipeline.py --source anthropic_blog
```
- 使用 argparse
- 每步输出进度日志
- 错误不中断，记录并继续

test_pipeline.py — 集成测试：
- 测试 RSS 抓取（使用本地测试XML文件）
- 测试去重逻辑
- 测试输出写入
- 不测试LLM调用（需要API key）

---

### Task 3.9: 最终集成验证

- 构建并启动知识管理后台
- 测试管道完整流程（抓取→加工→审核→发布）
- 确认素材输出到正确的 content/materials/ 目录
- 更新项目 README 添加管道使用说明
