# 贡献指南

感谢你对 Learn AI 的关注！本文档将帮助你了解如何参与项目贡献。

## 贡献方式

### 1. 贡献教程内容（最推荐）

适合所有人，无需编程技能。

**流程：**

1. **Fork 本仓库** 并克隆到本地
2. 在 `content/tutorials/{category}/` 下创建新的 `.md` 文件
3. 使用 YAML frontmatter 添加元数据：

```markdown
---
title: "你的教程标题"
source: "原始文章来源（可选）"
source_name: "来源名称"
category: "harness"
difficulty: "beginner"
tags: ["claude-code", "入门"]
---

# 你的教程标题

## 第一节

教程内容...
```

4. 提交 PR 到 `main` 分支
5. 团队成员审核后合并，自动部署上线

**教程质量标准：**
- 使用清晰的 ## 标题组织结构
- 代码块标注语言（```bash, ```javascript 等）
- 中文撰写，专业术语可用英文
- 每个教程 300-2000 字
- 包含至少一个实践示例

**分类选项：** `principle`, `model`, `harness`, `workflow`, `development`, `practice`

**难度选项：** `beginner`, `intermediate`, `advanced`

### 2. 贡献前端代码

适合有 React/JavaScript 经验的开发者。

**技术栈：** React 18 + Vite + CSS 变量

**开发流程：**
```bash
cd frontend
npm install
npm run dev
```

**代码规范：**
- CSS 类名使用 kebab-case
- 组件文件使用 PascalCase
- 所有颜色使用 `var(--token)` 引用，**不硬编码**
- 添加 `aria-label` 等无障碍属性
- 响应式设计断点：`@media (max-width: 768px)`

### 3. 贡献内容管道

适合有 Python 经验的开发者。

**开发流程：**
```bash
cd pipeline
pip install -r requirements.txt
PYTHONPATH="." python tests/test_rss_fetcher.py
```

**新增内容源：**
- 实现 `fetchers/` 下的抓取器
- 添加测试
- 在 `config.py` 中注册

### 4. 报告问题

在 GitHub Issues 中提交 Bug 报告或功能请求，请包含：
- 问题描述
- 复现步骤
- 期望行为
- 截图（如有）

## 项目结构

```
learn-llm/
├── frontend/          # React SPA
│   └── src/
│       ├── components/  # 可复用组件
│       ├── pages/       # 页面组件
│       └── data/        # 内容索引 JSON
├── pipeline/          # Python 内容管道
│   ├── fetchers/        # 内容采集
│   ├── processors/      # AI 加工
│   └── admin_dashboard/ # 管理后台
├── content/           # 教程 Markdown
└── docs/              # 设计文档
```

## 行为准则

- 尊重所有贡献者
- 建设性讨论，不人身攻击
- 关注内容质量，不追求数量
- 帮助新人上手

## 许可证

贡献内容采用 MIT License。提交 PR 即表示你同意此许可。
