# v0.0.1 — 首个发布版本

> 发布日期：2026-06-03

---

## 项目简介

Learn-LLM 是一个开源的 AI 学习平台，帮助开发者系统掌握 AI 编程工具。提供教程库、工具向导、技能库三大核心模块，内容覆盖 Claude Code、Codex、Superpowers、OpenSpec、ECC 等主流 AI 开发工具与框架。

**技术栈**：React 18 + Vite / FastAPI / Supabase / Docker Compose

---

## 核心功能

### 📖 教程库（14 篇）

| 工具 | 教程数 | 内容 |
|------|--------|------|
| Claude Code | 5 | 入门指南、安装配置、第一个项目、日常工作流、Hooks 实战 |
| Codex | 5 | 入门、安装、命令系统、Skills 与 MCP、高级用法 |
| CC Switch | 1 | 统一管理工具指南 |
| Kilo Code | 1 | 开源 AI 编程代理指南 |
| ECC | 1 | Everything Claude Code 完全指南 |
| Superpowers | 1 | AI 工程化编程全流程实战 |

### 🛠️ 工具向导（10 个）

- **Harness 工具**：Claude Code, Codex, Trae, ECC, Kilo Code, CC Switch
- **Workflow 工具**：Dify, Coze, n8n
- **开发框架**：LangChain

### 🧩 技能库（2 包 / 24 技能）

| 技能包 | 技能数 | 层级 |
|--------|--------|------|
| Superpowers | 14 | 4 层（入口→计划→执行→收尾） |
| OpenSpec | 10 | 4 层（概述→规划→执行→收尾） |

### 🗺️ 学习路径 & 🎯 场景检索

- 2 条预设学习路径
- 3 个实战场景（AI 代码审查、文档自动生成、工程化全流程）
- 全站搜索（教程+工具+场景+技能）

### 🔧 Admin 管理后台

- 教程管理：新建、编辑（Markdown 分屏编辑器）、发布/下架/归档、删除
- 路径编排：新建路径、章节管理
- 素材库导入：从 Pipeline 单向导入素材

### 🐳 部署

```bash
docker-compose up -d
```

---

## 数据规模

| 数据类型 | 数量 |
|----------|------|
| 教程 | 14 篇 |
| 工具 | 10 个 |
| 技能 | 24 个 |
| 搜索索引 | 48 条 |

---

## 安装

```bash
git clone http://192.168.120.62/personal/phoenix/learn-llm.git
cd learn-llm
cp .env.example .env
docker-compose up -d
```

访问 `http://localhost`。
