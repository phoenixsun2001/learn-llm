# AI Learning Platform — 设计说明书

> **日期**: 2026-05-30
> **状态**: 设计草稿，待评审
> **项目代号**: Learn_LLM

---

## 1. 项目概述

### 1.1 目标

构建一个开源的、引导式 AI 学习平台，帮助用户从入门到精通地使用各类 AI 专业工具，覆盖 Harness 工具（Claude Code、Codex、Trae、Hermas Agent）、Workflow 工具（Dify、Coze、n8n）、以及开发框架（LangChain/LangGraph、RAG、MCP/CLI 开发）。

### 1.2 核心原则

| 原则 | 说明 |
|------|------|
| **开源驱动** | 内容托管在 GitHub，社区 PR 贡献，免费访问 |
| **引导式学习** | 三条入口（学习路径 / 场景检索 / 工具向导）降低各类工具配置和使用门槛 |
| **内容聚合 + AI 加工** | 多源内容（RSS、X、公众号、社区）经 AI 管道处理，人工审核后融入教程 |
| **静态优先** | 前端纯静态托管，动态功能按需接入 Supabase |
| **两层管理隔离** | 知识管理后台（私有，审核内容）与教程编排管理（平台内，组装教程）分离 |

### 1.3 内容边界

**涵盖范围：**
- **LLM 基础与模型**（深入浅出讲解 Transformer 架构、注意力机制、训练流程、推理优化等核心技术，系统介绍主流模型产品：GPT-5/4o、Claude 4.x/5.x、Gemini、DeepSeek、Qwen、Llama 等，涵盖选型对比、部署方案、成本分析）
- Harness 工程（Claude Code、Codex、Trae、Hermas Agent 及流行 Skills）
- Workflow 工具（Dify、Coze、n8n）
- 开发框架（LangChain/LangGraph、RAG 搭建与调优、MCP/CLI 开发）
- 多模态模型与工具（视觉理解、语音交互等）
- 各类工具软件的安装与使用
- 各类场景的最佳实践

**暂不涉及：** 纯生图工具（Midjourney、Stable Diffusion）、生视频工具（Sora、Runway）

### 1.4 目标用户

- **入门层**：技术背景较浅的产品/业务人员，需要快速上手 AI 工具提效
- **进阶层**：有编程基础的开发者，需要掌握 Harness 配置、插件开发、工作流编排

---

## 2. 系统总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     内容管道层 (离线/批处理)                      │
│                                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐  ┌─────────┐  │
│  │ RSS  │  │  X   │  │ 公众号 │  │ GitHub PR │  │ 社区投稿 │  │
│  │ 订阅  │  │ 抓取  │  │ 采集  │  │  (Markdown)│  │ (表单)  │  │
│  └──┬───┘  └──┬───┘  └──┬───┘  └────┬─────┘  └────┬────┘  │
│     └─────────┴─────────┴───────────┴──────────────┘        │
│                          │ 原始内容                           │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │    AI 加工管道 (Python) │                       │
│              │  · 去重 · 摘要 · 分类   │                       │
│              │  · 结构化 · 难度标注   │                       │
│              │  · 关联已有教程 · 翻译  │                       │
│              └───────────┬───────────┘                       │
│                          │ 加工后内容                          │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │   知识管理后台 (隔离)   │  ← 管理员本地/私有操作  │
│              │  · 审核队列             │                       │
│              │  · 编辑/合并/补充      │                       │
│              │  · 通过 → 内容素材库    │                       │
│              │  · 驳回/标记            │                       │
│              └───────────┬───────────┘                       │
│                          │ 审核通过的素材                       │
│                          ▼                                   │
│              ┌───────────────────────┐                       │
│              │    内容素材库           │  GitHub Repo          │
│              │   (Markdown + JSON)   │  `/materials/`        │
│              └───────────┬───────────┘                       │
└──────────────────────────┼──────────────────────────────────┘
                           │ 素材 → 教程编排
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   学习平台 (React SPA + 管理端)                  │
│                                                             │
│  ┌─────────────────────────────────────────┐                │
│  │           教程编排管理 (管理员)             │                │
│  │  · 从素材库选取 → 组装教程                  │                │
│  │  · 创建/编辑/版本管理 教程                  │                │
│  │  · 编排学习路径 (入门→进阶链)               │                │
│  │  · 场景-工具-教程 关联映射                  │                │
│  │  · 发布/下架/归档                          │                │
│  └───────────────┬─────────────────────────┘                │
│                  │ 结构化教程                                   │
│                  ▼                                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐     │
│  │  学习路径    │  │  场景检索    │  │   工具向导           │     │
│  │  入门→精通  │  │  问题驱动    │  │   安装→配置→实践       │     │
│  └─────┬──────┘  └─────┬──────┘  └────────┬───────────┘     │
│        └────────────────┼─────────────────┘                 │
│                         ▼                                   │
│              ┌───────────────────────┐                       │
│              │    教程渲染引擎         │                       │
│              │  · Markdown + 代码高亮  │                       │
│              │  · 步骤进度跟踪         │                       │
│              │  · 交互式代码块 (沙箱)   │                       │
│              └───────────────────────┘                       │
│                                                             │
│  ┌─────────────────────────────────────────┐                │
│  │           用户系统 (Supabase)             │                │
│  │  · 认证 (GitHub OAuth)                   │                │
│  │  · 学习进度 · 收藏 · 历史                  │                │
│  │  · 管理员角色权限                          │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 两层管理职能对比

| | 知识管理后台 (私密) | 教程编排管理 (平台内) |
|------|------|------|
| **谁用** | 内容审核员 | 教程编辑/运营 |
| **输入** | AI 加工后的原始片段 | 素材库中已审核内容 |
| **操作** | 审核、去噪、补充、标记 | 组装教程、编排路径、发布 |
| **产出** | 素材库条目（原子内容） | 结构化教程（面向用户） |
| **访问** | 本地/私有，不暴露公网 | 平台内管理员登录可见 |
| **类比** | 报社编辑筛选投稿 | 主编编排成一份报纸 |

### 2.2 数据流

```
多源内容 → 抓取脚本 → 原始 Markdown → AI 加工 → 待审队列
→ 知识后台(人工审核) → 素材库(materials/) → 教程编排(组装)
→ 学习路径/场景/工具向导 → 用户
```

---

## 3. 内容管道设计

### 3.1 内容源与抓取策略

| 内容源 | 抓取方式 | 频率 | 输出格式 |
|--------|---------|------|---------|
| RSS 订阅 | Python `feedparser` | 每小时 | YAML 元数据 + 原始 HTML |
| X (Twitter) | 第三方 RSS 桥接 / API | 每小时 | YAML + 文本 |
| 微信公众号 | 第三方采集服务 | 每日 | YAML + 文本 |
| GitHub PR | GitHub Webhook + API | 实时 | Markdown 文件 |
| 社区投稿 | 平台内表单 + Supabase | 实时 | JSON + Markdown |

**RSS 订阅源管理：** 知识管理后台提供 RSS 源配置界面，支持添加/移除/分组订阅源。

### 3.2 AI 加工管道 (Python CLI)

```
原始内容 → [去重] → [摘要生成] → [分类标注] → [难度评估] → [关联匹配] → 输出 Markdown + JSON
```

**加工步骤：**

| 步骤 | 功能 | 实现 |
|------|------|------|
| 去重 | 基于文本相似度（embedding cosine）检测重复内容，标记而非删除 | `sentence-transformers` |
| 摘要生成 | 调用 LLM 生成 200 字中文摘要 | Claude API / 本地 Ollama |
| 分类标注 | 归类到预定义分类体系（技术原理/模型/Harness/工具/实践） | LLM few-shot 分类 |
| 难度评估 | 标记为 beginner / intermediate / advanced | LLM 评估 + 关键词规则 |
| 关联匹配 | 在现有素材库中检索相关条目，建立交叉引用 | 向量检索（chromadb / pgvector）|
| 结构化输出 | 生成统一格式的 Markdown + JSON 元数据 | Python 模板 |

### 3.3 内容元数据结构

```json
{
  "id": "mat-2026-001",
  "title": "Claude Code Hooks 实战指南",
  "source": {
    "type": "rss",
    "url": "https://example.com/hooks-guide",
    "author": "原作者名",
    "published_at": "2026-05-20T10:00:00Z"
  },
  "ai_processed": {
    "summary": "本文介绍 Claude Code 的 Hooks 机制...",
    "category": "harness",
    "subcategory": "claude-code",
    "difficulty": "intermediate",
    "related_materials": ["mat-2026-045", "mat-2026-102"],
    "quality_score": 0.85
  },
  "review_status": "pending",
  "created_at": "2026-05-30T08:00:00Z"
}
```

---

## 4. 知识管理后台设计

### 4.1 功能模块

```
知识管理后台
├── 📥 审核队列
│   ├── 待审核列表（来源标记、AI 加工摘要预览）
│   ├── 快速预览（原始 vs AI 加工对比）
│   └── 批量操作（通过/驳回/标记重复）
├── ✏️ 内容编辑
│   ├── Markdown 编辑器（双栏：源码+预览）
│   ├── 元数据编辑（分类、难度、标签）
│   └── 手动补充/重写
├── 📚 素材库浏览
│   ├── 按分类/难度/来源/时间筛选
│   ├── 全文搜索
│   └── 素材状态管理（已发布/待用/归档）
├── 📡 源管理
│   ├── RSS 源配置（添加/移除/分组）
│   ├── 抓取状态监控
│   └── 抓取历史日志
└── 🔧 管道调度
    ├── 手动触发加工
    ├── 定时任务配置
    └── 加工日志查看
```

### 4.2 技术方案

- **框架**：Python FastAPI（本地运行，绑定 localhost）
- **UI**：Jinja2 模板 + htmx（轻量交互，无需 SPA）
- **存储**：本地 SQLite（知识后台数据库）+ GitHub Repo（素材库）
- **认证**：简单密码 / API Key（本地访问，无需复杂认证体系）

### 4.3 访问控制

知识管理后台仅在本地 localhost 运行，不部署到公网。管理员通过本地浏览器访问 `http://localhost:8400/admin`。

---

## 5. 前端学习平台设计

### 5.1 页面树

```
/                           → 首页（平台介绍 + 三条入口 + 热门教程推荐）
/tutorials                  → 教程列表（可筛选分类/难度/工具）
/tutorials/[slug]           → 教程详情（渲染引擎）
/pathways                   → 学习路径列表
/pathways/[slug]            → 学习路径详情（可视化进度线）
/scenarios                  → 场景检索页
/scenarios/[slug]           → 场景详情（推荐工具链+教程）
/tools                      → 工具列表
/tools/[slug]               → 工具向导（安装→配置→实践）
/search                     → 全局搜索
/admin/*                    → 教程编排管理（仅管理员可见）
/admin/materials            → 素材库选取
/admin/tutorials            → 教程 CRUD
/admin/pathways             → 路径编排
/admin/publish              → 发布管理
```

### 5.2 三条核心入口

#### 5.2.1 学习路径

按照层级递进组织教程，用户按预设路径逐课学习。

```
🌱 入门
  ├── AI 发展简史：从规则到生成式
  ├── 什么是 LLM：语言模型的核心概念
  └── 你的第一个 AI 对话
      ↓
🌿 基础
  ├── 🧠 模型基础（核心模块）
  │   ├── Transformer 架构深入浅出
  │   ├── Token、Embedding、上下文窗口
  │   ├── 主流模型家族：GPT / Claude / Gemini / DeepSeek / Qwen / Llama
  │   ├── 模型能力对比与选型指南
  │   └── API 调用基础（OpenAI / Anthropic SDK）
  ├── 🔧 Harness 工具入门
  │   ├── Claude Code 入门
  │   ├── Codex 快速上手
  │   └── Trae 使用指南
  ├── 🔄 Workflow 工具入门
  │   ├── Dify 工作流基础
  │   └── Coze 快速搭建
  └── 💻 开发基础
      ├── LangChain 入门
      └── RAG 概念与实践
      ↓
🌳 进阶
  ├── 🧠 模型进阶
  │   ├── 训练流程：预训练 → SFT → RLHF → DPO
  │   ├── Prompt Engineering 系统化方法
  │   ├── 推理优化（量化、蒸馏、缓存）
  │   ├── 多模态模型原理与实践
  │   └── 模型部署方案（Ollama、vLLM、云端推理）
  ├── 🔧 Harness 工程深入
  │   ├── Hermas Agent 配置与调优
  │   └── Skills 开发与发布
  ├── 🔄 Workflow 编排
  │   ├── n8n 高级工作流
  │   └── 多工具协同编排
  └── 💻 开发进阶
      ├── LangGraph 状态管理
      ├── RAG 调优策略
      └── MCP 协议实践
      ↓
🎯 精通
  ├── 模型微调与对齐（LoRA / QLoRA）
  ├── Agent 架构设计（多 Agent 协作 / 工具调用）
  ├── MCP Server 开发
  ├── CLI 工具开发
  ├── 生产级 RAG 系统搭建
  └── 团队 AI 工程化实践
```

**每条路径：**
- 显示课程数量、预计学习时长
- 用户进度追踪（已完成/进行中/未开始）
- 关卡式解锁（可选：完成前置课程才能进入下一课）

#### 5.2.2 场景检索

用户描述目标，系统匹配推荐工具链和教程。

**交互流程：**
1. 用户输入目标（如"我想自动化代码审查"）
2. 系统搜索匹配场景库
3. 返回场景卡片：推荐工具 + 关联教程 + 工作流示意
4. 用户点击进入场景详情，逐步学习

**场景库示例：**
- "使用 AI 进行代码审查"
- "构建文档自动生成流水线"
- "搭建企业内部知识库问答"
- "多语言内容翻译与本地化"

#### 5.2.3 工具向导

每个工具提供类型 Setup Wizard 的引导式体验。

**向导步骤模板：**
```
步骤 1: 环境准备 → 步骤 2: 安装配置 → 步骤 3: 第一个用例
→ 步骤 4: 核心功能 → 步骤 5: 最佳实践 → 步骤 6: 进阶技巧
```

**首批支持的工具（按三大类别）：**

| 类别 | 工具 | 向导重点 |
|------|------|---------|
| **Harness 工具** | Claude Code、Codex、Trae、Hermas Agent | 安装配置、Skills 使用与开发、日常工作流 |
| **Workflow 工具** | Dify、Coze、n8n | 可视化编排、节点配置、多工具协同 |
| **开发框架** | LangChain/LangGraph、RAG 搭建与调优、MCP/CLI 开发 | 框架使用、调优策略、自定义开发 |

#### 5.2.4 模型学习模块

作为整个平台的知识地基，模型学习模块以"深入浅出"为核心理念，用可视化、类比和交互方式讲解 LLM 技术。

**四层递进结构：**

```
L1: 概念认知
  ├── AI 发展简史：从规则系统到生成式 AI
  ├── LLM 是什么：类比 + 交互式对话演示
  └── 模型能做什么：能力地图 + 局限认知
      ↓
L2: 技术理解
  ├── Transformer 架构图解（自注意力可视化）
  ├── Tokenization：文字如何变成数字
  ├── 上下文窗口与长文本处理
  ├── 训练流程全景：预训练 → SFT → RLHF → DPO
  └── 推理 vs 训练：计算资源需求对比
      ↓
L3: 模型产品
  ├── 闭源模型：GPT-5/4o、Claude 4.x/5.x、Gemini 3.x
  │   └── 每款模型的能力边界、定价、适用场景
  ├── 开源模型：DeepSeek-V3/R1、Qwen 3.x、Llama 4
  │   └── 开源生态、社区资源、部署选择
  ├── 模型对比矩阵：多维度横向测评
  └── 选型决策树：按任务/预算/延迟选择模型
      ↓
L4: 实战应用
  ├── Prompt Engineering 系统化方法论
  │   ├── 角色设定 · Few-shot · CoT · 结构化输出
  │   └── 不同模型的 Prompt 差异与适配
  ├── API 编程基础（Chat Completions / Streaming / Tool Use）
  ├── 模型部署实践
  │   ├── 本地部署：Ollama + Open WebUI
  │   ├── 云端推理 API：OpenAI / Anthropic / 各云厂商
  │   └── 成本分析与优化策略
  └── 模型微调入门
      ├── LoRA / QLoRA 原理与实操
      └── 数据准备与评估
```

**内容呈现特色：**

| 特色 | 说明 |
|------|------|
| **交互式可视化** | 自注意力热力图、Tokenization 实时预览、embedding 投影图 |
| **类比教学** | 用生活化比喻解释复杂概念（如"注意力像图书馆检索"） |
| **模型 Playground** | 同一 Prompt 同时调用多个模型，对比输出差异 |
| **成本计算器** | 交互式计算不同模型/方案的使用成本 |
| **路线图导航** | 根据用户角色（产品/开发/运维）推荐不同的模型学习路径 |

### 5.3 教程渲染引擎

统一渲染所有教程内容：

- **Markdown 解析**：react-markdown（支持 GFM、表格、任务列表）
- **代码高亮**：react-syntax-highlighter（支持 100+ 语言）
- **步骤进度**：教程内步骤级进度条，支持浏览器 localStorage 持久化
- **交互式代码块**：可复制、可在线运行（CodeSandbox / StackBlitz 嵌入）
- **关联内容**：侧边栏展示相关教程、场景、工具链接

### 5.4 教程编排管理（平台内）

管理员登录后可见的管理功能：

```
教程编排
├── 📝 教程管理
│   ├── 创建新教程（从素材库选取组装 / 从零编写）
│   ├── 编辑教程（分章节编辑器）
│   ├── 版本管理（草稿 → 发布 → 修订）
│   └── 下架/归档
├── 🗂️ 路径编排
│   ├── 创建学习路径
│   ├── 拖拽排序教程
│   ├── 设置前置依赖关系
│   └── 路径发布
├── 🔗 关联映射
│   ├── 场景-工具-教程 关联配置
│   └── 交叉引用管理
└── 📊 发布管理
    ├── 发布预览
    ├── 一键部署（触发 Vercel 重新构建）
    └── 发布历史记录
```

### 5.5 全局组件

| 组件 | 说明 |
|------|------|
| 导航栏 | Logo + 三条入口 + 搜索 + 用户头像 |
| 搜索 | 客户端全文搜索（预生成索引 JSON），支持按分类/难度过滤 |
| 主题切换 | 亮色/暗色模式，尊重系统偏好，支持手动切换 |
| 响应式布局 | 桌面端完整布局，移动端适配（汉堡菜单 + 堆叠布局） |
| AI 助手浮窗 | 可选：页面右下角嵌入 AI Chatbot（Ollama / API），回答当前教程相关问题 |

---

## 6. 数据模型

### 6.1 内容素材（Material）

```sql
CREATE TABLE materials (
    id          TEXT PRIMARY KEY,        -- mat-2026-001
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,           -- Markdown 正文
    source_type TEXT NOT NULL,           -- rss / x / wechat / github / community
    source_url  TEXT,
    source_author TEXT,
    source_published_at TIMESTAMP,
    ai_summary  TEXT,
    category    TEXT NOT NULL,           -- principle / model / harness / tool / practice
    subcategory TEXT,                    -- claude-code / cursor / dify / ...
    difficulty  TEXT NOT NULL,           -- beginner / intermediate / advanced
    tags        JSONB DEFAULT '[]',
    related_ids JSONB DEFAULT '[]',
    quality_score REAL,
    review_status TEXT DEFAULT 'pending', -- pending / approved / rejected / archived
    reviewed_by TEXT,
    reviewed_at  TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### 6.2 教程（Tutorial）

```sql
CREATE TABLE tutorials (
    id          TEXT PRIMARY KEY,        -- tut-2026-001
    slug        TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    category    TEXT NOT NULL,
    subcategory TEXT,
    difficulty  TEXT NOT NULL,
    chapters    JSONB NOT NULL DEFAULT '[]', -- 章节列表：[{title, content, materials_refs}]
    prerequisites JSONB DEFAULT '[]',
    estimated_time INTEGER,              -- 预计完成时间（分钟）
    status      TEXT DEFAULT 'draft',    -- draft / published / archived
    version     INTEGER DEFAULT 1,
    published_at TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### 6.3 学习路径（Pathway）

```sql
CREATE TABLE pathways (
    id          TEXT PRIMARY KEY,        -- pwy-2026-001
    slug        TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    level       TEXT NOT NULL,           -- beginner / intermediate / advanced / expert
    steps       JSONB NOT NULL DEFAULT '[]', -- [{tutorial_id, order, required}]
    icon        TEXT,
    status      TEXT DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### 6.4 场景（Scenario）

```sql
CREATE TABLE scenarios (
    id          TEXT PRIMARY KEY,        -- scn-2026-001
    slug        TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    goal        TEXT NOT NULL,           -- 用户目标描述
    tools       JSONB DEFAULT '[]',      -- 推荐工具列表
    tutorials   JSONB DEFAULT '[]',      -- 关联教程 ID 列表
    workflow    TEXT,                    -- Mermaid 工作流定义
    status      TEXT DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### 6.5 工具（Tool）

```sql
CREATE TABLE tools (
    id          TEXT PRIMARY KEY,        -- tol-2026-001
    slug        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    description TEXT,
    category    TEXT NOT NULL,           -- editor / harness / platform / framework / protocol
    wizard_steps JSONB DEFAULT '[]',      -- [{step, title, tutorial_id}]
    official_url TEXT,
    logo_url    TEXT,
    status      TEXT DEFAULT 'draft',
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### 6.6 用户进度（User Progress）

```sql
CREATE TABLE user_progress (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id),
    tutorial_id TEXT REFERENCES tutorials(id),
    chapter_index INTEGER DEFAULT 0,
    step_index  INTEGER DEFAULT 0,
    completed   BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tutorial_id)
);
```

---

## 7. 技术栈

| 层 | 技术 | 说明 |
|------|------|------|
| **前端框架** | React 18 + Vite | SPA 构建，Vite 快速 HMR |
| **路由** | React Router v6 | 客户端路由 |
| **样式** | 普通 CSS + CSS 变量 | 遵循项目约定，无 Tailwind |
| **UI 组件** | 自研 + Ant Design | 表格/表单等复杂 UI 用 Ant Design |
| **Markdown 渲染** | react-markdown + rehype/remark 插件 | 教程内容渲染 |
| **代码高亮** | react-syntax-highlighter | 代码块语法高亮 |
| **后端 API** | FastAPI (Python) | 知识管理后台 + AI 管道 |
| **数据库** | PostgreSQL (Supabase) | 用户数据、教程编排数据 |
| **向量检索** | pgvector (Supabase) 或 chromadb | 内容去重和关联匹配 |
| **认证** | Supabase Auth (GitHub OAuth) | 用户登录 |
| **托管** | Vercel (前端) + Supabase (后端) | 免费层启动 |
| **CI/CD** | GitHub Actions | 内容管道 + 前端构建部署 |
| **AI 加工** | Claude API / Ollama (本地) | 内容摘要、分类、标注 |
| **内容仓库** | GitHub | Markdown + JSON 内容存储 |

---

## 8. Git 仓库结构

```
learn-llm/
├── frontend/                    # React SPA (Vite)
│   ├── src/
│   │   ├── components/          # 可复用组件
│   │   │   ├── TutorialRenderer/
│   │   │   ├── PathwayTimeline/
│   │   │   ├── ToolWizard/
│   │   │   ├── SearchBar/
│   │   │   ├── Navbar/
│   │   │   └── AIAssistant/
│   │   ├── pages/               # 页面组件
│   │   │   ├── Home/
│   │   │   ├── Tutorials/
│   │   │   ├── Pathways/
│   │   │   ├── Scenarios/
│   │   │   ├── Tools/
│   │   │   └── Admin/
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── services/            # Supabase 客户端等
│   │   ├── utils/               # 工具函数
│   │   ├── icons/               # 自定义 SVG 图标
│   │   ├── data/                # 预生成索引 JSON
│   │   ├── index.jsx
│   │   ├── index.css            # CSS 变量定义
│   │   └── App.jsx
│   ├── public/
│   └── package.json
├── pipeline/                    # AI 内容管道 (Python)
│   ├── fetchers/                # 各源抓取器
│   │   ├── rss_fetcher.py
│   │   ├── x_fetcher.py
│   │   └── wechat_fetcher.py
│   ├── processors/              # AI 加工模块
│   │   ├── dedup.py
│   │   ├── summarizer.py
│   │   ├── classifier.py
│   │   └── linker.py
│   ├── admin_dashboard/         # 知识管理后台
│   │   ├── main.py              # FastAPI 入口
│   │   ├── templates/           # Jinja2 模板
│   │   └── static/              # 静态资源
│   └── requirements.txt
├── content/                     # 内容仓库
│   ├── materials/               # 审核通过的素材
│   │   └── [category]/
│   │       └── mat-2026-XXX.md
│   ├── tutorials/               # 结构化教程
│   │   └── [category]/
│   │       └── [slug].md
│   ├── pathways/                # 学习路径定义
│   ├── scenarios/               # 场景定义
│   └── meta/                    # 元数据索引
│       ├── tutorials-index.json
│       ├── scenarios-index.json
│       └── search-index.json
├── docs/                        # 项目文档
│   └── superpowers/
│       └── specs/
└── README.md
```

---

## 9. 部署架构

```
┌──────────────────────────────────────────────────────┐
│                    GitHub Repository                    │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────────┐  │
│  │ content/ │  │ frontend/│  │  pipeline/           │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
└───────┼──────────────┼──────────────────┼──────────────┘
        │              │                  │
        ▼              ▼                  ▼
┌──────────────┐ ┌──────────┐ ┌──────────────────┐
│ GitHub Pages │ │ Vercel   │ │ GitHub Actions    │
│ (内容存储)    │ │ (前端托管) │ │ (管道 + 索引构建)  │
└──────────────┘ └────┬─────┘ └──────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │  Supabase     │
              │  · Auth       │
              │  · PostgreSQL │
              │  · pgvector   │
              └──────────────┘
```

---

## 10. 实施阶段

### Phase 1: MVP — 内容骨架 + 单一工具

| 任务 | 产出 |
|------|------|
| 初始化 React + Vite 项目 | 前端骨架 |
| 构建教程渲染引擎 | Markdown → 教程页面 |
| 实现工具向导模板 | 以 Claude Code 为第一个工具 |
| 创建 GitHub 内容仓库 | `content/tutorials/` 首批 5 篇教程 |
| Vercel 部署 | 上线可访问 |

### Phase 2: 三条入口

| 任务 | 产出 |
|------|------|
| 学习路径页面 | 路径列表 + 进度可视化 |
| 场景检索页面 | 场景列表 + 搜索 + 场景详情 |
| 工具列表页面 | 工具卡片 + 向导入口 |
| 首页 | 三条入口 + 热门推荐 |

### Phase 3: 内容管道

| 任务 | 产出 |
|------|------|
| Python 管道脚本 | RSS 抓取 + AI 加工 |
| 知识管理后台 | FastAPI + 审核工作流 |
| GitHub Actions | 定时管道运行 + 前端自动部署 |

### Phase 4: 用户系统 + 教程编排

| 任务 | 产出 |
|------|------|
| Supabase 集成 | Auth + 数据库 |
| 用户进度追踪 | 完成状态 + 持久化 |
| 教程编排管理 | 后台 CRUD + 素材选取 |

### Phase 5: 完善与社区

| 任务 | 产出 |
|------|------|
| 搜索索引构建 | 客户端全文搜索 |
| AI 助手浮窗 | 可选 Chatbot |
| 社区贡献指南 | CONTRIBUTING.md |
| RSS 订阅功能 | 用户订阅更新通知 |

---

## 11. 开放决策点

以下决策建议在实现阶段根据实际情况确定：

1. **搜索方案**：客户端预生成索引 JSON（轻量）vs Algolia（功能强但有免费额度限制）
2. **代码沙箱**：StackBlitz Embed（现成方案）vs 自建 WebContainer（可控但复杂）
3. **AI 加工模型**：优先用本地 Ollama 降低成本，质量不够再切换 Claude API
4. **多语言**：初期仅中文，架构预留 i18n 扩展点
5. **评论系统**：Phase 4 后再评估是否需要（可用 GitHub Discussions 替代）

---

> **下一步**：设计评审通过后，使用 writing-plans 技能创建详细实施计划。
