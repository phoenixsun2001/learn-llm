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
- **托管**：Vercel

## 快速开始

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:3000`

## 项目结构

```
learn-llm/
├── frontend/          # React SPA
│   └── src/
│       ├── components/  # 可复用组件
│       ├── pages/       # 页面组件
│       ├── data/        # 内容索引 JSON
│       ├── services/    # 内容加载器
│       └── hooks/       # 自定义 Hooks
├── content/           # 教程 Markdown 文件
└── docs/              # 设计文档
```

## 贡献

欢迎贡献教程内容！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)（即将推出）。

## 许可证

MIT License
