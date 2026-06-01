# AI Learning Platform (Learn_LLM) — Phase 1 MVP 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 AI 学习平台 MVP：一个可部署的 React SPA，具备教程渲染引擎和首个工具向导（Claude Code），包含 5 篇初始教程内容。

**Architecture:** React 18 + Vite SPA，纯静态前端托管 Vercel。教程内容以 Markdown 文件存储在 `content/` 目录，构建时转换为 JSON 索引供前端消费。CSS 变量管理设计令牌，react-markdown 渲染教程，react-router-v6 管理路由。

**Tech Stack:** React 18, Vite, react-router-dom v6, react-markdown, react-syntax-highlighter, Ant Design, 普通 CSS + CSS 变量

**Design Spec:** `docs/superpowers/specs/2026-05-30-ai-learning-platform-design.md`

---

## 文件结构总览

```
learn-llm/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── index.jsx              # React 入口
│       ├── index.css              # CSS 变量 + 全局样式
│       ├── App.jsx                # 路由配置 + 布局
│       ├── components/
│       │   ├── Navbar/
│       │   │   ├── Navbar.jsx
│       │   │   └── Navbar.css
│       │   ├── TutorialRenderer/
│       │   │   ├── TutorialRenderer.jsx
│       │   │   └── TutorialRenderer.css
│       │   ├── ToolWizard/
│       │   │   ├── ToolWizard.jsx
│       │   │   └── ToolWizard.css
│       │   ├── SearchBar/
│       │   │   ├── SearchBar.jsx
│       │   │   └── SearchBar.css
│       │   ├── Footer/
│       │   │   ├── Footer.jsx
│       │   │   └── Footer.css
│       │   └── StepProgress/
│       │       ├── StepProgress.jsx
│       │       └── StepProgress.css
│       ├── pages/
│       │   ├── Home/
│       │   │   ├── Home.jsx
│       │   │   └── Home.css
│       │   ├── Tutorials/
│       │   │   ├── TutorialList.jsx
│       │   │   ├── TutorialList.css
│       │   │   ├── TutorialDetail.jsx
│       │   │   └── TutorialDetail.css
│       │   ├── Tools/
│       │   │   ├── ToolList.jsx
│       │   │   ├── ToolList.css
│       │   │   ├── ToolDetail.jsx
│       │   │   └── ToolDetail.css
│       │   ├── Pathways/
│       │   │   ├── PathwayList.jsx
│       │   │   └── PathwayList.css
│       │   └── Scenarios/
│       │       ├── ScenarioList.jsx
│       │       └── ScenarioList.css
│       ├── data/
│       │   ├── tutorials-index.json    # 教程索引
│       │   ├── tools-index.json        # 工具索引
│       │   ├── pathways-index.json     # 学习路径索引
│       │   └── scenarios-index.json    # 场景索引
│       ├── hooks/
│       │   └── useProgress.js          # 学习进度 Hook
│       ├── services/
│       │   └── contentLoader.js        # Markdown 内容加载器
│       └── utils/
│           └── constants.js            # 常量定义
├── content/
│   └── tutorials/
│       └── harness/
│           ├── claude-code-intro.md
│           ├── claude-code-install.md
│           ├── claude-code-first-use.md
│           ├── claude-code-daily.md
│           └── claude-code-hooks.md
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-30-ai-learning-platform-design.md
```

---

### Task 1: 初始化 Vite + React 项目

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/index.jsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/App.jsx`
- Create: `frontend/public/favicon.svg`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "learn-llm",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "react-markdown": "^9.0.1",
    "react-syntax-highlighter": "^15.5.0",
    "remark-gfm": "^4.0.0",
    "antd": "^5.20.0",
    "@ant-design/icons": "^5.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run: `cd frontend && npm install`
Expected: 无错误，`node_modules/` 生成

- [ ] **Step 3: 创建 vite.config.js**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 4: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AI Learning Platform - 从入门到精通，系统学习 AI 工具与最佳实践" />
    <title>Learn AI - AI 学习平台</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 src/index.jsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 6: 创建 src/index.css（CSS 变量 + 全局样式）**

```css
/* ═══════════════════════════════════════════════════
   CSS Design Tokens — 全局设计令牌
   ═══════════════════════════════════════════════════ */
:root {
  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-code: #1e293b;

  /* 文字颜色 */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --text-inverse: #ffffff;

  /* 边框 */
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;

  /* 强调色 */
  --accent-color: #2563eb;
  --accent-hover: #1d4ed8;
  --accent-light: #eff6ff;
  --accent-text: #1d4ed8;

  /* 状态色 */
  --error-color: #ef4444;
  --error-light: #fef2f2;
  --success-color: #22c55e;
  --success-light: #f0fdf4;
  --warning-color: #f59e0b;
  --warning-light: #fffbeb;

  /* 排版 */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", "Cascadia Code", "Fira Code", "SF Mono",
    Consolas, "Liberation Mono", Menlo, monospace;
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 17px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;

  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 布局 */
  --max-width: 1200px;
  --content-max-width: 800px;
  --sidebar-width: 280px;
  --navbar-height: 64px;
}

/* ═══════════════════════════════════════════════════
   Global Reset & Base
   ═══════════════════════════════════════════════════ */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: 1.7;
  color: var(--text-primary);
  background-color: var(--bg-primary);
}

a {
  color: var(--accent-color);
  text-decoration: none;
}

a:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

img {
  max-width: 100%;
  height: auto;
}

/* Code */
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
}

:not(pre) > code {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: #e11d48;
}

pre {
  background: var(--bg-code);
  color: #e2e8f0;
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  overflow-x: auto;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  margin: var(--spacing-md) 0;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Selection */
::selection {
  background: var(--accent-light);
  color: var(--accent-text);
}

/* Focus visible */
:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

/* Responsive */
@media (max-width: 768px) {
  :root {
    --navbar-height: 56px;
    --font-size-base: 14px;
  }
}
```

- [ ] **Step 7: 创建 src/App.jsx（路由骨架）**

```jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import TutorialList from './pages/Tutorials/TutorialList';
import TutorialDetail from './pages/Tutorials/TutorialDetail';
import ToolList from './pages/Tools/ToolList';
import ToolDetail from './pages/Tools/ToolDetail';
import PathwayList from './pages/Pathways/PathwayList';
import ScenarioList from './pages/Scenarios/ScenarioList';

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutorials" element={<TutorialList />} />
          <Route path="/tutorials/:slug" element={<TutorialDetail />} />
          <Route path="/tools" element={<ToolList />} />
          <Route path="/tools/:slug" element={<ToolDetail />} />
          <Route path="/pathways" element={<PathwayList />} />
          <Route path="/scenarios" element={<ScenarioList />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
```

- [ ] **Step 8: 创建 favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#2563eb"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="white">AI</text>
</svg>
```

- [ ] **Step 9: 验证项目启动**

Run: `cd frontend && npm run dev`
Expected: Dev server 启动在 `http://localhost:3000`，页面显示空白（路由未实现页面组件），控制台无报错

- [ ] **Step 10: Commit**

```bash
cd frontend
git init
git add .
git commit -m "feat: initialize Vite + React project with CSS design tokens and routing skeleton

- Vite 5 + React 18 with react-router-dom v6
- CSS variables design token system in index.css
- App shell with Navbar, Routes, Footer placeholders
- Project follows naming conventions: PascalCase components, kebab-case CSS classes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 构建全局布局组件（Navbar + Footer）

**Files:**
- Create: `frontend/src/components/Navbar/Navbar.jsx`
- Create: `frontend/src/components/Navbar/Navbar.css`
- Create: `frontend/src/components/Footer/Footer.jsx`
- Create: `frontend/src/components/Footer/Footer.css`

- [ ] **Step 1: 创建 Navbar.jsx**

```jsx
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

const navItems = [
  { path: '/pathways', label: '学习路径', icon: '🌱' },
  { path: '/scenarios', label: '场景检索', icon: '🎯' },
  { path: '/tools', label: '工具向导', icon: '🔧' },
  { path: '/tutorials', label: '教程库', icon: '📚' },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" aria-label="回到首页">
          <span className="navbar-logo-icon">🧠</span>
          <span className="navbar-logo-text">Learn AI</span>
        </Link>

        <nav className={`navbar-nav ${menuOpen ? 'navbar-nav--open' : ''}`} aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'navbar-link--active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className="navbar-link-icon">{item.icon}</span>
              <span className="navbar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <form className="navbar-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            className="navbar-search-input"
            placeholder="搜索教程、工具、场景..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label="搜索"
          />
        </form>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={menuOpen}
        >
          <span className={`navbar-toggle-bar ${menuOpen ? 'open' : ''}`} />
          <span className={`navbar-toggle-bar ${menuOpen ? 'open' : ''}`} />
          <span className={`navbar-toggle-bar ${menuOpen ? 'open' : ''}`} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
```

- [ ] **Step 2: 创建 Navbar.css**

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  height: var(--navbar-height);
  backdrop-filter: blur(8px);
}

.navbar-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  height: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

/* Logo */
.navbar-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
  font-weight: 700;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}
.navbar-logo:hover {
  text-decoration: none;
}
.navbar-logo-icon {
  font-size: 24px;
}

/* Nav Links */
.navbar-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
}

.navbar-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all 0.15s;
  white-space: nowrap;
}
.navbar-link:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
  text-decoration: none;
}
.navbar-link--active {
  color: var(--accent-color);
  background: var(--accent-light);
}
.navbar-link-icon {
  font-size: 14px;
}

/* Search */
.navbar-search {
  flex-shrink: 1;
  min-width: 0;
  max-width: 300px;
}
.navbar-search-input {
  width: 100%;
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
}
.navbar-search-input:focus {
  border-color: var(--accent-color);
  background: var(--bg-primary);
}
.navbar-search-input::placeholder {
  color: var(--text-tertiary);
}

/* Mobile Toggle */
.navbar-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}
.navbar-toggle-bar {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: transform 0.2s;
}
.navbar-toggle-bar.open:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.navbar-toggle-bar.open:nth-child(2) {
  opacity: 0;
}
.navbar-toggle-bar.open:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

@media (max-width: 768px) {
  .navbar-nav {
    display: none;
    position: absolute;
    top: var(--navbar-height);
    left: 0;
    right: 0;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    flex-direction: column;
    padding: var(--spacing-md);
    gap: var(--spacing-xs);
  }
  .navbar-nav--open {
    display: flex;
  }
  .navbar-toggle {
    display: flex;
  }
  .navbar-search {
    flex: 1;
    max-width: none;
    order: -1;
  }
}
```

- [ ] **Step 3: 创建 Footer.jsx**

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">🧠 Learn AI</span>
          <p className="footer-tagline">
            开源、引导式的 AI 学习平台。从入门到精通，掌握 AI 工具与最佳实践。
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4 className="footer-column-title">学习</h4>
            <Link to="/pathways" className="footer-link">学习路径</Link>
            <Link to="/tutorials" className="footer-link">教程库</Link>
            <Link to="/scenarios" className="footer-link">场景检索</Link>
          </div>
          <div className="footer-column">
            <h4 className="footer-column-title">工具</h4>
            <Link to="/tools" className="footer-link">工具向导</Link>
            <Link to="/tools/claude-code" className="footer-link">Claude Code</Link>
            <Link to="/tools/dify" className="footer-link">Dify</Link>
          </div>
          <div className="footer-column">
            <h4 className="footer-column-title">关于</h4>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
            <a href="/CONTRIBUTING.md" className="footer-link">贡献指南</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} Learn AI. Open source under MIT License.</p>
      </div>
    </footer>
  );
};

export default Footer;
```

- [ ] **Step 4: 创建 Footer.css**

```css
.footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.footer-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-lg) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-2xl);
  flex-wrap: wrap;
}

.footer-brand {
  max-width: 300px;
}
.footer-logo {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
}
.footer-tagline {
  margin-top: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.footer-links {
  display: flex;
  gap: var(--spacing-2xl);
  flex-wrap: wrap;
}

.footer-column-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.footer-link {
  display: block;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  padding: 2px 0;
  transition: color 0.15s;
}
.footer-link:hover {
  color: var(--accent-color);
  text-decoration: none;
}

.footer-bottom {
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: center;
}
.footer-bottom p {
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

@media (max-width: 768px) {
  .footer-inner {
    flex-direction: column;
    gap: var(--spacing-xl);
  }
  .footer-links {
    gap: var(--spacing-xl);
  }
}
```

- [ ] **Step 5: 验证布局**

Run: `cd frontend && npm run dev`
Check: 浏览器打开 `http://localhost:3000`，Navbar 和 Footer 正确显示，移动端汉堡菜单可用

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Navbar/ frontend/src/components/Footer/
git commit -m "feat: add global layout components (Navbar + Footer)

- Sticky Navbar with logo, nav links, search bar, mobile hamburger menu
- Footer with brand info, link columns, copyright
- CSS variables used throughout, no hardcoded colors
- Responsive: mobile breakpoint at 768px

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 创建首页（Home Page）

**Files:**
- Create: `frontend/src/pages/Home/Home.jsx`
- Create: `frontend/src/pages/Home/Home.css`

- [ ] **Step 1: 创建 Home.jsx**

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const entries = [
  {
    path: '/pathways',
    icon: '🌱',
    title: '学习路径',
    description: '从入门到精通，按层级递进系统学习。每条路径包含课程数量、预计时长和进度追踪。',
    action: '探索路径',
  },
  {
    path: '/scenarios',
    icon: '🎯',
    title: '场景检索',
    description: '描述你的目标，系统智能匹配推荐工具链和教程。问题驱动，即学即用。',
    action: '查找场景',
  },
  {
    path: '/tools',
    icon: '🔧',
    title: '工具向导',
    description: '每个工具提供安装→配置→实践的引导式向导，降低上手门槛。',
    action: '开始向导',
  },
];

const featuredTutorials = [
  { slug: 'claude-code-intro', title: 'Claude Code 入门指南', category: 'Harness 工具', difficulty: '入门' },
  { slug: 'claude-code-install', title: 'Claude Code 安装与配置', category: 'Harness 工具', difficulty: '入门' },
  { slug: 'claude-code-first-use', title: 'Claude Code 第一个项目', category: 'Harness 工具', difficulty: '基础' },
];

const Home = () => {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">
          从入门到精通，
          <span className="hero-highlight">系统学习 AI</span>
        </h1>
        <p className="hero-subtitle">
          一个开源、引导式的 AI 学习平台。覆盖 Harness 工具、Workflow 编排、开发框架，
          用最佳实践降低每一款 AI 工具的上手门槛。
        </p>
        <div className="hero-actions">
          <Link to="/pathways" className="hero-btn hero-btn--primary">
            开始学习 →
          </Link>
          <Link to="/tools" className="hero-btn hero-btn--secondary">
            浏览工具
          </Link>
        </div>
      </section>

      {/* Three Entries */}
      <section className="entries-section">
        <h2 className="section-title">三种学习方式</h2>
        <p className="section-desc">无论你想系统进阶、解决具体问题还是快速上手工具，都能找到适合的入口。</p>
        <div className="entries-grid">
          {entries.map((entry) => (
            <Link to={entry.path} key={entry.path} className="entry-card">
              <span className="entry-icon">{entry.icon}</span>
              <h3 className="entry-title">{entry.title}</h3>
              <p className="entry-desc">{entry.description}</p>
              <span className="entry-action">{entry.action} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Tutorials */}
      <section className="featured-section">
        <h2 className="section-title">热门教程</h2>
        <div className="featured-grid">
          {featuredTutorials.map((tutorial) => (
            <Link to={`/tutorials/${tutorial.slug}`} key={tutorial.slug} className="featured-card">
              <div className="featured-card-meta">
                <span className="tag">{tutorial.category}</span>
                <span className={`difficulty-badge difficulty-badge--${tutorial.difficulty}`}>
                  {tutorial.difficulty}
                </span>
              </div>
              <h3 className="featured-card-title">{tutorial.title}</h3>
            </Link>
          ))}
        </div>
        <div className="section-footer">
          <Link to="/tutorials" className="view-all">查看全部教程 →</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
```

- [ ] **Step 2: 创建 Home.css**

```css
/* Hero */
.hero {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  max-width: 720px;
  margin: 0 auto;
}

.hero-title {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.5px;
  color: #0f172a;
}
.hero-highlight {
  color: var(--accent-color);
}

.hero-subtitle {
  margin-top: var(--spacing-md);
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  line-height: 1.7;
}

.hero-actions {
  margin-top: var(--spacing-xl);
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.hero-btn {
  padding: 12px 28px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  transition: all 0.15s;
}
.hero-btn--primary {
  background: var(--accent-color);
  color: var(--text-inverse);
}
.hero-btn--primary:hover {
  background: var(--accent-hover);
  color: var(--text-inverse);
  text-decoration: none;
}
.hero-btn--secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.hero-btn--secondary:hover {
  background: var(--border-color);
  color: var(--text-primary);
  text-decoration: none;
}

/* Section */
.section-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-sm);
}
.section-desc {
  text-align: center;
  color: var(--text-secondary);
  max-width: 560px;
  margin: 0 auto var(--spacing-xl);
}

/* Entries Grid */
.entries-section {
  padding: var(--spacing-2xl) var(--spacing-lg);
  max-width: var(--max-width);
  margin: 0 auto;
}

.entries-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.entry-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xl);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  transition: all 0.2s;
  color: var(--text-primary);
}
.entry-card:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-md);
  text-decoration: none;
  transform: translateY(-2px);
}
.entry-icon {
  font-size: 32px;
  margin-bottom: var(--spacing-md);
}
.entry-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}
.entry-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  flex: 1;
}
.entry-action {
  display: inline-block;
  margin-top: var(--spacing-md);
  color: var(--accent-color);
  font-weight: 500;
  font-size: var(--font-size-sm);
}

/* Featured */
.featured-section {
  padding: var(--spacing-2xl) var(--spacing-lg);
  max-width: var(--max-width);
  margin: 0 auto;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.featured-card {
  display: block;
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: all 0.15s;
  color: var(--text-primary);
}
.featured-card:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
}

.featured-card-meta {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.tag {
  display: inline-block;
  padding: 1px 8px;
  background: var(--accent-light);
  color: var(--accent-text);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.difficulty-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
}
.difficulty-badge--入门 {
  background: var(--success-light);
  color: var(--success-color);
}
.difficulty-badge--基础 {
  background: var(--warning-light);
  color: var(--warning-color);
}

.featured-card-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  line-height: 1.5;
}

.section-footer {
  text-align: center;
  margin-top: var(--spacing-lg);
}
.view-all {
  color: var(--accent-color);
  font-weight: 500;
  font-size: var(--font-size-sm);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: var(--font-size-2xl);
  }
  .entries-grid,
  .featured-grid {
    grid-template-columns: 1fr;
  }
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
}
```

- [ ] **Step 3: 验证首页**

Run: `cd frontend && npm run dev`
Check: 首页显示 Hero + 三个入口卡片 + 热门教程，卡片 hover 有效果，响应式正常

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Home/
git commit -m "feat: add home page with hero, three entry cards, and featured tutorials

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 创建内容索引数据 + 内容加载服务

**Files:**
- Create: `frontend/src/data/tutorials-index.json`
- Create: `frontend/src/data/tools-index.json`
- Create: `frontend/src/data/pathways-index.json`
- Create: `frontend/src/data/scenarios-index.json`
- Create: `frontend/src/services/contentLoader.js`
- Create: `frontend/src/utils/constants.js`

- [ ] **Step 1: 创建 constants.js**

```javascript
// 分类常量
export const CATEGORIES = {
  MODEL: 'model',
  HARNESS: 'harness',
  WORKFLOW: 'workflow',
  DEV: 'development',
  PRACTICE: 'practice',
};

export const CATEGORY_LABELS = {
  [CATEGORIES.MODEL]: '模型基础',
  [CATEGORIES.HARNESS]: 'Harness 工具',
  [CATEGORIES.WORKFLOW]: 'Workflow 工具',
  [CATEGORIES.DEV]: '开发框架',
  [CATEGORIES.PRACTICE]: '最佳实践',
};

export const DIFFICULTY_LABELS = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '精通',
};

// 工具类别常量
export const TOOL_CATEGORIES = {
  HARNESS: 'harness',
  WORKFLOW: 'workflow',
  DEV: 'development',
};

export const TOOL_CATEGORY_LABELS = {
  [TOOL_CATEGORIES.HARNESS]: 'Harness 工具',
  [TOOL_CATEGORIES.WORKFLOW]: 'Workflow 工具',
  [TOOL_CATEGORIES.DEV]: '开发框架',
};
```

- [ ] **Step 2: 创建 tutorials-index.json**

```json
[
  {
    "id": "tut-claude-code-intro",
    "slug": "claude-code-intro",
    "title": "Claude Code 入门指南",
    "description": "了解 Claude Code 的核心概念、工作原理和基本用法，为后续深入学习打下基础。",
    "category": "harness",
    "subcategory": "claude-code",
    "difficulty": "beginner",
    "estimatedTime": 15,
    "tags": ["claude-code", "入门"],
    "prerequisites": [],
    "file": "/content/tutorials/harness/claude-code-intro.md"
  },
  {
    "id": "tut-claude-code-install",
    "slug": "claude-code-install",
    "title": "Claude Code 安装与配置",
    "description": "手把手教你安装 Claude Code CLI，配置 API Key，完成首次运行。",
    "category": "harness",
    "subcategory": "claude-code",
    "difficulty": "beginner",
    "estimatedTime": 20,
    "tags": ["claude-code", "安装"],
    "prerequisites": ["claude-code-intro"],
    "file": "/content/tutorials/harness/claude-code-install.md"
  },
  {
    "id": "tut-claude-code-first-use",
    "slug": "claude-code-first-use",
    "title": "Claude Code 第一个项目",
    "description": "使用 Claude Code 完成第一个实际项目：从需求描述到代码生成，体验完整的 AI 辅助开发流程。",
    "category": "harness",
    "subcategory": "claude-code",
    "difficulty": "beginner",
    "estimatedTime": 30,
    "tags": ["claude-code", "实践"],
    "prerequisites": ["claude-code-install"],
    "file": "/content/tutorials/harness/claude-code-first-use.md"
  },
  {
    "id": "tut-claude-code-daily",
    "slug": "claude-code-daily",
    "title": "Claude Code 日常工作流",
    "description": "掌握 Claude Code 的日常使用技巧：代码审查、重构、调试、文档生成等高频场景。",
    "category": "harness",
    "subcategory": "claude-code",
    "difficulty": "intermediate",
    "estimatedTime": 25,
    "tags": ["claude-code", "工作流"],
    "prerequisites": ["claude-code-first-use"],
    "file": "/content/tutorials/harness/claude-code-daily.md"
  },
  {
    "id": "tut-claude-code-hooks",
    "slug": "claude-code-hooks",
    "title": "Claude Code Hooks 实战",
    "description": "深入学习 Claude Code 的 Hooks 机制，自动化你的开发工作流。",
    "category": "harness",
    "subcategory": "claude-code",
    "difficulty": "intermediate",
    "estimatedTime": 30,
    "tags": ["claude-code", "hooks", "进阶"],
    "prerequisites": ["claude-code-daily"],
    "file": "/content/tutorials/harness/claude-code-hooks.md"
  }
]
```

- [ ] **Step 3: 创建 tools-index.json**

```json
[
  {
    "id": "tool-claude-code",
    "slug": "claude-code",
    "name": "Claude Code",
    "description": "Anthropic 官方 CLI 编码助手，在终端中直接与 Claude 协作，支持代码生成、审查、重构等全流程。",
    "category": "harness",
    "officialUrl": "https://docs.anthropic.com/en/docs/claude-code/overview",
    "wizardSteps": [
      { "step": 1, "title": "环境准备", "tutorialSlug": "claude-code-install" },
      { "step": 2, "title": "安装配置", "tutorialSlug": "claude-code-install" },
      { "step": 3, "title": "第一个用例", "tutorialSlug": "claude-code-first-use" },
      { "step": 4, "title": "核心功能", "tutorialSlug": "claude-code-daily" },
      { "step": 5, "title": "最佳实践", "tutorialSlug": "claude-code-hooks" },
      { "step": 6, "title": "进阶技巧", "tutorialSlug": "claude-code-hooks" }
    ],
    "tags": ["CLI", "编码助手", "Anthropic"]
  },
  {
    "id": "tool-codex",
    "slug": "codex",
    "name": "Codex",
    "description": "OpenAI 推出的 CLI 编码助手，在终端中提供 AI 辅助编程能力。",
    "category": "harness",
    "officialUrl": "https://github.com/openai/codex",
    "wizardSteps": [],
    "tags": ["CLI", "编码助手", "OpenAI"]
  },
  {
    "id": "tool-trae",
    "slug": "trae",
    "name": "Trae",
    "description": "新一代 AI 编码助手，提供智能代码补全和项目管理功能。",
    "category": "harness",
    "officialUrl": "",
    "wizardSteps": [],
    "tags": ["IDE", "编码助手"]
  },
  {
    "id": "tool-dify",
    "slug": "dify",
    "name": "Dify",
    "description": "开源 LLM 应用开发平台，可视化编排 AI 工作流，支持 RAG、Agent、模型管理等。",
    "category": "workflow",
    "officialUrl": "https://dify.ai",
    "wizardSteps": [],
    "tags": ["工作流", "RAG", "低代码"]
  },
  {
    "id": "tool-coze",
    "slug": "coze",
    "name": "Coze",
    "description": "字节跳动推出的 AI Bot 开发平台，支持可视化编排和工作流设计。",
    "category": "workflow",
    "officialUrl": "https://www.coze.com",
    "wizardSteps": [],
    "tags": ["Bot", "工作流", "低代码"]
  },
  {
    "id": "tool-n8n",
    "slug": "n8n",
    "name": "n8n",
    "description": "开源的工作流自动化平台，可集成 AI 能力构建复杂的自动化流程。",
    "category": "workflow",
    "officialUrl": "https://n8n.io",
    "wizardSteps": [],
    "tags": ["自动化", "工作流", "开源"]
  },
  {
    "id": "tool-langchain",
    "slug": "langchain",
    "name": "LangChain",
    "description": "最流行的 LLM 应用开发框架，提供链式调用、Agent、工具集成等核心能力。",
    "category": "development",
    "officialUrl": "https://www.langchain.com",
    "wizardSteps": [],
    "tags": ["框架", "Agent", "Python/JS"]
  }
]
```

- [ ] **Step 4: 创建 pathways-index.json**

```json
[
  {
    "id": "pwy-beginner",
    "slug": "beginner",
    "title": "🌱 AI 入门之路",
    "description": "面向 AI 初学者，从基础概念到第一个 AI 工具实战。",
    "level": "beginner",
    "steps": [
      { "tutorialId": "tut-claude-code-intro", "order": 1, "required": false },
      { "tutorialId": "tut-claude-code-install", "order": 2, "required": false },
      { "tutorialId": "tut-claude-code-first-use", "order": 3, "required": false }
    ],
    "icon": "🌱"
  },
  {
    "id": "pwy-intermediate",
    "slug": "intermediate",
    "title": "🌿 Harness 工具进阶",
    "description": "掌握 Claude Code 的日常使用技巧和 Hooks 机制。",
    "level": "intermediate",
    "steps": [
      { "tutorialId": "tut-claude-code-daily", "order": 1, "required": false },
      { "tutorialId": "tut-claude-code-hooks", "order": 2, "required": false }
    ],
    "icon": "🌿"
  }
]
```

- [ ] **Step 5: 创建 scenarios-index.json**

```json
[
  {
    "id": "scn-code-review",
    "slug": "ai-code-review",
    "title": "使用 AI 进行代码审查",
    "description": "自动化代码审查流程，提升代码质量和团队协作效率。",
    "goal": "我想自动化代码审查",
    "tools": ["claude-code"],
    "tutorials": ["claude-code-daily"],
    "workflow": "开发者提交 PR → Claude Code 自动审查 → 生成 Review 意见 → 开发者修改"
  },
  {
    "id": "scn-doc-generation",
    "slug": "doc-auto-generation",
    "title": "构建文档自动生成流水线",
    "description": "利用 AI 工具自动生成和维护项目文档，保持文档与代码同步。",
    "goal": "我想自动生成项目文档",
    "tools": ["claude-code"],
    "tutorials": ["claude-code-daily", "claude-code-hooks"],
    "workflow": "代码提交 → 触发 Hooks → AI 分析变更 → 更新对应文档"
  }
]
```

- [ ] **Step 6: 创建 contentLoader.js**

```javascript
import tutorialsIndex from '../data/tutorials-index.json';
import toolsIndex from '../data/tools-index.json';
import pathwaysIndex from '../data/pathways-index.json';
import scenariosIndex from '../data/scenarios-index.json';

/**
 * 根据 slug 获取教程元数据
 */
export function getTutorialBySlug(slug) {
  return tutorialsIndex.find((t) => t.slug === slug) || null;
}

/**
 * 获取所有教程列表
 */
export function getAllTutorials(filters = {}) {
  let result = [...tutorialsIndex];

  if (filters.category) {
    result = result.filter((t) => t.category === filters.category);
  }
  if (filters.difficulty) {
    result = result.filter((t) => t.difficulty === filters.difficulty);
  }
  if (filters.subcategory) {
    result = result.filter((t) => t.subcategory === filters.subcategory);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  return result;
}

/**
 * 获取教程 Markdown 内容（从 public 或远程加载）
 */
export async function loadTutorialContent(slug) {
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) return null;

  try {
    // MVP 阶段：从 public/content/ 加载 Markdown
    const response = await fetch(`/content/tutorials/${tutorial.subcategory}/${slug}.md`);
    if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error(`Failed to load tutorial content for ${slug}:`, error);
    return null;
  }
}

/**
 * 根据 slug 获取工具信息
 */
export function getToolBySlug(slug) {
  return toolsIndex.find((t) => t.slug === slug) || null;
}

/**
 * 获取所有工具列表
 */
export function getAllTools(category) {
  if (category) {
    return toolsIndex.filter((t) => t.category === category);
  }
  return toolsIndex;
}

/**
 * 根据 slug 获取学习路径
 */
export function getPathwayBySlug(slug) {
  return pathwaysIndex.find((p) => p.slug === slug) || null;
}

/**
 * 获取所有学习路径
 */
export function getAllPathways() {
  return pathwaysIndex;
}

/**
 * 根据 slug 获取场景
 */
export function getScenarioBySlug(slug) {
  return scenariosIndex.find((s) => s.slug === slug) || null;
}

/**
 * 获取所有场景
 */
export function getAllScenarios() {
  return scenariosIndex;
}
```

- [ ] **Step 7: 验证数据加载**

Run: `cd frontend && npm run dev`
Check: 浏览器控制台无报错（数据文件被正确 import）

- [ ] **Step 8: Commit**

```bash
git add frontend/src/data/ frontend/src/services/ frontend/src/utils/
git commit -m "feat: add content index data and loader service

- tutorials/tools/pathways/scenarios JSON indexes with initial data
- contentLoader.js with full CRUD-like query functions
- constants.js with category/difficulty label mappings
- MVP focuses on Claude Code tool and harness category

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: 构建教程渲染引擎（TutorialRenderer）

**Files:**
- Create: `frontend/src/components/TutorialRenderer/TutorialRenderer.jsx`
- Create: `frontend/src/components/TutorialRenderer/TutorialRenderer.css`
- Create: `frontend/src/components/StepProgress/StepProgress.jsx`
- Create: `frontend/src/components/StepProgress/StepProgress.css`

- [ ] **Step 1: 创建 StepProgress.jsx**

```jsx
import React from 'react';
import './StepProgress.css';

/**
 * 步骤进度条组件
 * 追踪教程内步骤的完成状态，使用 localStorage 持久化
 */
const StepProgress = ({ tutorialSlug, totalSteps, currentStep, onStepClick }) => {
  const storageKey = `progress-${tutorialSlug}`;

  const getCompletedSteps = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : 0;
    } catch {
      return 0;
    }
  };

  const [completed, setCompleted] = React.useState(getCompletedSteps);

  const markStepComplete = (step) => {
    if (step > completed) {
      const newCompleted = step;
      setCompleted(newCompleted);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newCompleted));
      } catch {
        // localStorage 不可用时静默失败
      }
    }
  };

  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="step-progress" role="progressbar" aria-label="教程进度"
         aria-valuenow={completed} aria-valuemin={0} aria-valuemax={totalSteps}>
      <div className="step-progress-bar">
        <div
          className="step-progress-fill"
          style={{ width: `${totalSteps > 0 ? (completed / totalSteps) * 100 : 0}%` }}
        />
      </div>
      <div className="step-progress-dots">
        {steps.map((step) => (
          <button
            key={step}
            className={`step-dot ${step <= completed ? 'step-dot--done' : ''} ${step === currentStep ? 'step-dot--current' : ''}`}
            onClick={() => {
              onStepClick?.(step);
              markStepComplete(step);
            }}
            aria-label={`步骤 ${step}${step <= completed ? '（已完成）' : ''}`}
            title={`步骤 ${step}`}
          >
            {step <= completed ? '✓' : step}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StepProgress;
```

- [ ] **Step 2: 创建 StepProgress.css**

```css
.step-progress {
  margin-bottom: var(--spacing-lg);
}

.step-progress-bar {
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.step-progress-fill {
  height: 100%;
  background: var(--accent-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.step-progress-dots {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-sm);
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.step-dot:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.step-dot--done {
  background: var(--success-color);
  border-color: var(--success-color);
  color: var(--text-inverse);
}

.step-dot--current {
  border-color: var(--accent-color);
  color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.step-dot--done.step-dot--current {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}
```

- [ ] **Step 3: 创建 TutorialRenderer.jsx**

```jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import StepProgress from '../StepProgress/StepProgress';
import './TutorialRenderer.css';

/**
 * 教程内容渲染引擎
 * 将 Markdown 内容渲染为结构化教程页面，包含代码高亮和步骤进度追踪
 */
const TutorialRenderer = ({ tutorial, content, loading }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  // 从 Markdown 中提取 ## 标题作为步骤
  const steps = content
    ? content.match(/^##\s+.+$/gm)?.map((h) => h.replace(/^##\s+/, '')) || []
    : [];

  const totalSteps = steps.length;
  const [currentStep, setCurrentStep] = useState(1);

  // 检测当前阅读到的步骤（基于滚动位置）
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('.tutorial-content h2');
      let activeIndex = 1;
      headings.forEach((heading, index) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          activeIndex = index + 1;
        }
      });
      setCurrentStep(activeIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [content]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="tutorial-loading">
        <div className="tutorial-loading-spinner" />
        <p>加载教程中...</p>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="tutorial-error">
        <p>教程未找到</p>
      </div>
    );
  }

  return (
    <article className="tutorial-renderer">
      {/* Header */}
      <header className="tutorial-header">
        <div className="tutorial-header-meta">
          <span className="tag">{tutorial.category}</span>
          <span className={`difficulty-badge difficulty-badge--${tutorial.difficulty}`}>
            {tutorial.difficulty}
          </span>
          {tutorial.estimatedTime && (
            <span className="tutorial-time">⏱ {tutorial.estimatedTime} 分钟</span>
          )}
        </div>
        <h1 className="tutorial-title">{tutorial.title}</h1>
        {tutorial.description && (
          <p className="tutorial-description">{tutorial.description}</p>
        )}
      </header>

      {/* Step Progress */}
      {totalSteps > 1 && (
        <StepProgress
          tutorialSlug={tutorial.slug}
          totalSteps={totalSteps}
          currentStep={currentStep}
        />
      )}

      {/* Content */}
      <div className="tutorial-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');

              if (!inline && match) {
                return (
                  <div className="code-block-wrapper">
                    <div className="code-block-header">
                      <span className="code-block-lang">{match[1]}</span>
                      <button
                        className="code-block-copy"
                        onClick={() => handleCopy(codeString)}
                        aria-label="复制代码"
                      >
                        {copiedCode === codeString ? '✓ 已复制' : '📋 复制'}
                      </button>
                    </div>
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ margin: 0, borderRadius: '0 0 8px 8px' }}
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              if (!inline) {
                return (
                  <div className="code-block-wrapper">
                    <div className="code-block-header">
                      <span className="code-block-lang">plain text</span>
                      <button
                        className="code-block-copy"
                        onClick={() => handleCopy(codeString)}
                        aria-label="复制代码"
                      >
                        {copiedCode === codeString ? '✓ 已复制' : '📋 复制'}
                      </button>
                    </div>
                    <pre className="code-block-plain" {...props}>
                      {children}
                    </pre>
                  </div>
                );
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            // 外部链接在新窗口打开
            a({ href, children, ...props }) {
              const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
              return (
                <a
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  {...props}
                >
                  {children}
                </a>
              );
            },
            // 表格样式
            table({ children }) {
              return <div className="table-wrapper"><table>{children}</table></div>;
            },
          }}
        >
          {content || ''}
        </ReactMarkdown>
      </div>

      {/* Related */}
      {tutorial.prerequisites?.length > 0 && (
        <aside className="tutorial-related" aria-label="前置教程">
          <h3>前置教程</h3>
          <ul>
            {tutorial.prerequisites.map((slug) => (
              <li key={slug}>
                <a href={`/tutorials/${slug}`}>{slug}</a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
};

export default TutorialRenderer;
```

- [ ] **Step 4: 创建 TutorialRenderer.css**

```css
.tutorial-renderer {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

/* Header */
.tutorial-header {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.tutorial-header-meta {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
  align-items: center;
}

.tutorial-time {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.tutorial-title {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.3;
  color: #0f172a;
}

.tutorial-description {
  margin-top: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  line-height: 1.6;
}

/* Content */
.tutorial-content {
  font-size: var(--font-size-base);
  line-height: 1.8;
}

.tutorial-content h2 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-top: var(--spacing-2xl);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--border-light);
  color: #0f172a;
}

.tutorial-content h3 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.tutorial-content h4 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.tutorial-content p {
  margin: var(--spacing-md) 0;
}

.tutorial-content ul,
.tutorial-content ol {
  margin: var(--spacing-sm) 0 var(--spacing-sm) var(--spacing-lg);
  padding: 0;
}

.tutorial-content li {
  margin: var(--spacing-xs) 0;
}

.tutorial-content blockquote {
  border-left: 3px solid var(--accent-color);
  padding: var(--spacing-sm) var(--spacing-md);
  margin: var(--spacing-md) 0;
  background: var(--accent-light);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text-secondary);
}

/* Code Blocks */
.code-block-wrapper {
  margin: var(--spacing-md) 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid #334155;
}

.code-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #334155;
  color: #cbd5e1;
  font-size: var(--font-size-xs);
}

.code-block-lang {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.code-block-copy {
  background: none;
  border: 1px solid #64748b;
  color: #cbd5e1;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-xs);
  transition: all 0.15s;
}
.code-block-copy:hover {
  background: #475569;
  border-color: #94a3b8;
}

.code-block-plain {
  margin: 0;
  padding: var(--spacing-md);
  background: var(--bg-code);
  color: #e2e8f0;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
  margin: var(--spacing-md) 0;
}

.tutorial-content table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.tutorial-content th,
.tutorial-content td {
  padding: 10px 14px;
  text-align: left;
  border: 1px solid var(--border-color);
}

.tutorial-content th {
  background: var(--bg-secondary);
  font-weight: 600;
}

.tutorial-content tr:nth-child(even) {
  background: var(--bg-secondary);
}

/* Loading & Error */
.tutorial-loading,
.tutorial-error {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
}

.tutorial-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Related */
.tutorial-related {
  margin-top: var(--spacing-2xl);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.tutorial-related h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.tutorial-related ul {
  list-style: none;
  margin: 0;
}

.tutorial-related li {
  margin: 4px 0;
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/TutorialRenderer/ frontend/src/components/StepProgress/
git commit -m "feat: build tutorial rendering engine with markdown support

- TutorialRenderer: react-markdown + syntax highlighting + copy button
- StepProgress: scroll-aware step tracking with localStorage persistence
- External links open in new tab, tables are scrollable on mobile
- Loading spinner and error state handled

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: 创建教程列表页和详情页

**Files:**
- Create: `frontend/src/pages/Tutorials/TutorialList.jsx`
- Create: `frontend/src/pages/Tutorials/TutorialList.css`
- Create: `frontend/src/pages/Tutorials/TutorialDetail.jsx`
- Create: `frontend/src/pages/Tutorials/TutorialDetail.css`

- [ ] **Step 1: 创建 TutorialList.jsx**

```jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllTutorials } from '../../services/contentLoader';
import { CATEGORIES, CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import './TutorialList.css';

const TutorialList = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = useMemo(() => {
    const f = {};
    if (selectedCategory !== 'all') f.category = selectedCategory;
    if (selectedDifficulty !== 'all') f.difficulty = selectedDifficulty;
    if (searchQuery.trim()) f.search = searchQuery.trim();
    return f;
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const tutorials = useMemo(() => getAllTutorials(filters), [filters]);

  const categories = ['all', ...Object.values(CATEGORIES)];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  return (
    <div className="tutorial-list-page">
      <div className="tutorial-list-header">
        <h1>教程库</h1>
        <p>浏览所有 AI 学习教程，按分类和难度筛选。</p>
      </div>

      {/* Filters */}
      <div className="tutorial-filters">
        <input
          type="search"
          className="filter-search"
          placeholder="搜索教程..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="搜索教程"
        />

        <div className="filter-group" role="radiogroup" aria-label="分类筛选">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${selectedCategory === cat ? 'filter-chip--active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
            >
              {cat === 'all' ? '全部' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        <div className="filter-group" role="radiogroup" aria-label="难度筛选">
          {difficulties.map((diff) => (
            <button
              key={diff}
              className={`filter-chip ${selectedDifficulty === diff ? 'filter-chip--active' : ''}`}
              onClick={() => setSelectedDifficulty(diff)}
              aria-pressed={selectedDifficulty === diff}
            >
              {diff === 'all' ? '全部难度' : DIFFICULTY_LABELS[diff] || diff}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="tutorial-count">{tutorials.length} 篇教程</div>

      {tutorials.length === 0 ? (
        <div className="tutorial-empty">
          <p>没有找到匹配的教程。</p>
        </div>
      ) : (
        <div className="tutorial-grid">
          {tutorials.map((tutorial) => (
            <Link
              to={`/tutorials/${tutorial.slug}`}
              key={tutorial.id}
              className="tutorial-card"
            >
              <div className="tutorial-card-meta">
                <span className="tag">{CATEGORY_LABELS[tutorial.category] || tutorial.category}</span>
                <span className={`difficulty-badge difficulty-badge--${DIFFICULTY_LABELS[tutorial.difficulty]}`}>
                  {DIFFICULTY_LABELS[tutorial.difficulty]}
                </span>
              </div>
              <h3 className="tutorial-card-title">{tutorial.title}</h3>
              <p className="tutorial-card-desc">{tutorial.description}</p>
              <div className="tutorial-card-footer">
                <span className="tutorial-card-time">⏱ {tutorial.estimatedTime} 分钟</span>
                {tutorial.tags?.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorialList;
```

- [ ] **Step 2: 创建 TutorialList.css**

```css
.tutorial-list-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.tutorial-list-header {
  margin-bottom: var(--spacing-lg);
}
.tutorial-list-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: 800;
}
.tutorial-list-header p {
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

/* Filters */
.tutorial-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.filter-search {
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  min-width: 200px;
  background: var(--bg-primary);
}
.filter-search:focus {
  border-color: var(--accent-color);
  outline: none;
}

.filter-group {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.filter-chip {
  padding: 4px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  background: var(--bg-primary);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.filter-chip:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}
.filter-chip--active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: var(--text-inverse);
}

.tutorial-count {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

/* Grid */
.tutorial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

.tutorial-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  transition: all 0.15s;
  color: var(--text-primary);
}
.tutorial-card:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-md);
  text-decoration: none;
  transform: translateY(-2px);
}

.tutorial-card-meta {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.tutorial-card-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.tutorial-card-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  flex: 1;
}

.tutorial-card-footer {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  flex-wrap: wrap;
  align-items: center;
}

.tutorial-card-time {
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

.tutorial-empty {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .tutorial-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 创建 TutorialDetail.jsx**

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTutorialBySlug, loadTutorialContent } from '../../services/contentLoader';
import TutorialRenderer from '../../components/TutorialRenderer/TutorialRenderer';
import './TutorialDetail.css';

const TutorialDetail = () => {
  const { slug } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tutorial = getTutorialBySlug(slug);

  useEffect(() => {
    if (!tutorial) {
      setLoading(false);
      setError('教程未找到');
      return;
    }

    setLoading(true);
    setError(null);

    loadTutorialContent(slug)
      .then((md) => {
        setContent(md);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load tutorial:', err);
        setError('教程内容加载失败，请稍后重试。');
        setLoading(false);
      });
  }, [slug, tutorial]);

  if (error && !tutorial) {
    return (
      <div className="tutorial-detail-error">
        <h2>教程未找到</h2>
        <p>该教程可能已被移除或地址有误。</p>
        <Link to="/tutorials" className="back-link">← 返回教程列表</Link>
      </div>
    );
  }

  return (
    <div className="tutorial-detail-page">
      <nav className="tutorial-breadcrumb" aria-label="面包屑导航">
        <Link to="/">首页</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/tutorials">教程库</Link>
        {tutorial && (
          <>
            <span className="breadcrumb-sep">/</span>
            <span>{tutorial.title}</span>
          </>
        )}
      </nav>

      <TutorialRenderer tutorial={tutorial} content={content} loading={loading} />
    </div>
  );
};

export default TutorialDetail;
```

- [ ] **Step 4: 创建 TutorialDetail.css**

```css
.tutorial-detail-page {
  min-height: calc(100vh - var(--navbar-height) - 200px);
}

.tutorial-breadcrumb {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-lg) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.breadcrumb-sep {
  color: var(--text-tertiary);
}

.tutorial-detail-error {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-secondary);
}
.tutorial-detail-error h2 {
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}
.back-link {
  display: inline-block;
  margin-top: var(--spacing-md);
  color: var(--accent-color);
  font-weight: 500;
}
```

- [ ] **Step 5: 创建初始 Markdown 教程文件**

Create: `frontend/public/content/tutorials/harness/claude-code-intro.md`

```markdown
# Claude Code 入门指南

## 什么是 Claude Code

Claude Code 是 Anthropic 官方推出的命令行编码助手工具。它让你可以在终端中直接与 Claude 协作，完成代码生成、审查、重构等开发任务。

与传统的 IDE 插件不同，Claude Code 运行在终端中，这意味着它可以直接访问你的文件系统、执行命令、操作 Git，成为你开发工作流的核心。

## Claude Code 能做什么

- **代码生成**：从自然语言描述生成代码
- **代码审查**：自动审查 PR，发现潜在问题
- **重构**：安全地重构代码，保持功能不变
- **调试**：分析错误日志，定位问题根因
- **文档生成**：自动生成代码注释和项目文档
- **Shell 命令**：执行和管理 Shell 命令

## 工作原理

Claude Code 通过以下方式工作：

1. **上下文感知**：读取你的项目文件和代码结构
2. **工具调用**：可以执行 Shell 命令、读写文件、搜索代码
3. **对话式交互**：在终端中进行多轮对话，逐步细化需求
4. **权限控制**：在执行敏感操作前需要你的确认

## 与 IDE 插件的区别

| 特性 | Claude Code | IDE 插件 |
|------|------------|---------|
| 运行环境 | 终端 | IDE 内 |
| 文件访问 | 全项目 | 当前文件 |
| 命令执行 | ✅ 可执行 Shell | ❌ 通常不支持 |
| Git 操作 | ✅ 原生支持 | ⚠️ 有限支持 |
| 自动化 | ✅ 脚本化 | ❌ 手动触发 |

## 下一步

准备好了吗？下一篇教程将带你完成 Claude Code 的安装与配置。
```

Create: `frontend/public/content/tutorials/harness/claude-code-install.md`

```markdown
# Claude Code 安装与配置

## 环境准备

在安装 Claude Code 之前，确保你的系统满足以下要求：

- **操作系统**：macOS、Linux 或 Windows (WSL2)
- **Node.js**：v18.0.0 或更高版本
- **终端**：推荐使用 iTerm2 (macOS)、Windows Terminal 或 kitty
- **网络**：稳定的网络连接（Claude Code 需要调用 Anthropic API）

## 安装步骤

### 1. 检查 Node.js 版本

```bash
node --version
# 应该输出 v18.0.0 或更高版本
```

如果版本过低，使用 nvm 安装最新 LTS 版本：

```bash
nvm install --lts
nvm use --lts
```

### 2. 安装 Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

验证安装：

```bash
claude --version
```

### 3. 配置 API Key

获取 Anthropic API Key：

1. 访问 [Anthropic Console](https://console.anthropic.com)
2. 注册或登录账号
3. 进入 API Keys 页面，创建新 Key

配置环境变量：

```bash
# 将以下内容添加到 ~/.bashrc 或 ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-..."

# 使配置生效
source ~/.bashrc  # 或 source ~/.zshrc
```

### 4. 验证配置

```bash
# 启动 Claude Code
claude

# 输入简单测试
> 你好，请用中文介绍一下你自己
```

如果收到 Claude 的回复，说明配置成功！

## 常见安装问题

### 权限错误 (EACCES)

```bash
# 使用 nvm 管理的 Node.js 可避免此问题
# 如果使用系统 Node.js，可能需要 sudo
sudo npm install -g @anthropic-ai/claude-code
```

### API Key 未生效

```bash
# 检查环境变量是否设置
echo $ANTHROPIC_API_KEY

# 如果为空，重新执行 source 命令
source ~/.bashrc
```

## 下一步

安装完成后，进入下一篇教程，我们将用 Claude Code 完成第一个实际项目。
```

Create: `frontend/public/content/tutorials/harness/claude-code-first-use.md`

```markdown
# Claude Code 第一个项目

## 项目目标

我们将使用 Claude Code 创建一个简单的 **Markdown 待办事项管理器**——一个能从 Markdown 文件中提取、统计和管理待办事项的 Node.js 脚本。

## 启动 Claude Code

```bash
# 进入你的项目目录
mkdir todo-parser && cd todo-parser

# 启动 Claude Code
claude
```

## 与 Claude 对话

### 第一步：描述需求

在 Claude Code 的对话界面中，输入：

> 我需要一个 Node.js 脚本，它能读取当前目录下的 Markdown 文件，
> 提取所有 `- [ ]` 和 `- [x]` 格式的待办事项，
> 统计完成率，并输出一个漂亮的报告。

### 第二步：查看生成结果

Claude 会生成类似以下的代码：

```javascript
const fs = require('fs');
const path = require('path');

function parseTodos(content) {
  const todos = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^- \[(x| )\] (.+)/);
    if (match) {
      todos.push({
        done: match[1] === 'x',
        text: match[2].trim(),
      });
    }
  }
  return todos;
}

function generateReport(results) {
  // ... Claude 会生成完整的报告逻辑
}
```

### 第三步：测试运行

```bash
# 创建测试 Markdown 文件
echo '- [x] 完成设计文档
- [ ] 编写单元测试
- [ ] 代码审查
- [x] 修复登录 Bug' > tasks.md

# 运行脚本
node todo-parser.js

# 期望输出：
# 📊 待办事项报告
# 总计：4 | 已完成：2 | 完成率：50%
```

## 关键技巧

### 提供清晰的上下文

```
❌ 差：「帮我写个脚本」
✅ 好：「用 Node.js 写一个 CLI 脚本，读取 Markdown 文件中的待办事项，统计并输出报告」
```

### 分步骤推进

大任务拆分成小步骤，每一步验证后再继续：

1. 先让 Claude 定义数据结构和接口
2. 实现核心解析逻辑
3. 添加报告生成
4. 最后处理错误和边界情况

### 善用 @ 引用

在对话中使用 `@文件名` 引用项目中的文件，让 Claude 获得更多上下文。

## 下一步

完成第一个项目后，下一篇将介绍 Claude Code 的日常工作流技巧。
```

Create: `frontend/public/content/tutorials/harness/claude-code-daily.md`

```markdown
# Claude Code 日常工作流

## 工作流概览

将 Claude Code 融入日常开发，可以显著提升以下场景的效率：

1. **新功能开发**：从需求到代码的快速转化
2. **代码审查**：自动化的 PR Review
3. **Bug 修复**：错误日志分析和修复建议
4. **重构**：安全的大规模代码变更
5. **文档维护**：自动生成和更新文档

## 场景一：代码审查

```bash
# 审查当前分支相对于 main 的变更
claude "Review the diff from main branch. Focus on:
- Potential bugs or logic errors
- Security vulnerabilities
- Performance issues
- Code style consistency
Format as a PR review with severity levels."
```

### 审查要点模板

每次代码审查时，让 Claude 关注以下几个方面：

- **正确性**：逻辑是否符合预期
- **安全性**：是否存在注入、权限等问题
- **性能**：是否有不必要的循环或数据库查询
- **可维护性**：代码是否清晰、是否需要注释

## 场景二：重构

```bash
# 重构前先让 Claude 理解现有代码
claude "Read src/services/userService.js and explain its current structure"

# 然后提出重构目标
claude "Refactor userService.js to use async/await instead of callbacks.
Make sure all tests still pass."
```

## 场景三：Bug 调试

```bash
# 粘贴错误日志
claude "I'm getting this error when running tests:
TypeError: Cannot read property 'map' of undefined
  at UserList.render (src/components/UserList.jsx:23)

Analyze the root cause and suggest a fix."
```

## 高效工作流技巧

### 1. 使用会话历史

Claude Code 会记住会话中的上下文，利用这点逐步深入：

```bash
> 这个组件的状态管理有问题
# Claude 分析...
> 你建议的方案中，改用 useReducer 有什么优势？
# Claude 展开说明...
> 好，请帮我实现这个改动
```

### 2. 编写 .claude 指令文件

在项目根目录创建 `.claude/instructions.md`：

```markdown
# 项目开发约定
- 使用 Jest 进行测试
- 遵循 Airbnb JavaScript 风格指南
- 组件使用 React Hooks，避免 Class 组件
- API 调用统一通过 services/ 层
```

Claude Code 会自动读取这些指令，确保生成的代码符合团队规范。

### 3. 批量文件操作

```bash
# 一次性分析和修改多个文件
claude "In all files under src/components/,
replace the deprecated 'componentWillReceiveProps' lifecycle method
with the appropriate modern alternative."
```

## 下一步

下一篇将深入介绍 Claude Code 的 Hooks 机制，实现更强大的自动化工作流。
```

Create: `frontend/public/content/tutorials/harness/claude-code-hooks.md`

```markdown
# Claude Code Hooks 实战

## 什么是 Hooks

Claude Code 的 Hooks 机制允许你在 Claude 执行特定操作前后运行自定义脚本，实现自动化的开发工作流。

类似于 Git Hooks，它们在一些关键节点触发：
- **PreToolUse**：工具调用前
- **PostToolUse**：工具调用后
- **OnSessionStart**：会话开始时
- **OnSessionEnd**：会话结束时

## Hooks 配置

在项目根目录创建 `.claude/hooks.json`：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "echo 'About to modify file: $CLAUDE_TOOL_INPUT'",
        "description": "Log file modifications"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "npm run lint -- --fix $CLAUDE_TOOL_INPUT",
        "description": "Auto-lint modified files"
      }
    ]
  }
}
```

## 实用 Hooks 示例

### 自动格式化代码

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write.*\\.(js|jsx|ts|tsx)$",
        "command": "npx prettier --write $CLAUDE_MODIFIED_FILE",
        "description": "格式化修改的代码文件"
      }
    ]
  }
}
```

### 自动运行测试

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write.*src/",
        "command": "npm test -- --related $CLAUDE_MODIFIED_FILE --passWithNoTests",
        "description": "运行相关测试"
      }
    ]
  }
}
```

### 安全检查

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write.*\\.env",
        "command": "echo 'WARNING: Modifying .env file' && exit 0",
        "description": "提醒环境变量文件修改"
      },
      {
        "matcher": "Write|Edit",
        "command": "grep -q 'API_KEY\\|SECRET\\|PASSWORD' $CLAUDE_TOOL_INPUT && echo 'WARNING: Possible secret in file!' || true",
        "description": "检测可能的秘密信息泄露"
      }
    ]
  }
}
```

## 完整工作流示例

结合多个 Hooks 构建完整的代码提交前检查：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write.*\\.(js|jsx)$",
        "command": "npx eslint --fix $CLAUDE_MODIFIED_FILE && npx prettier --write $CLAUDE_MODIFIED_FILE",
        "description": "Lint + Format"
      }
    ],
    "OnSessionEnd": [
      {
        "command": "echo 'Session ended. Modified files:' && git diff --name-only",
        "description": "显示本次会话修改的文件列表"
      }
    ]
  }
}
```

## 环境变量参考

Hooks 脚本中可以使用的环境变量：

| 变量 | 说明 |
|------|------|
| `CLAUDE_TOOL_NAME` | 触发 Hook 的工具名称 |
| `CLAUDE_MODIFIED_FILE` | 被修改的文件路径 |
| `CLAUDE_SESSION_ID` | 当前会话 ID |

## 下一步

恭喜！你已经完成了 Claude Code 从入门到 Hooks 的完整学习路径。

接下来可以：
- 探索其他 Harness 工具（Codex、Trae、Hermas Agent）
- 学习 Workflow 工具（Dify、Coze、n8n）
- 进入开发框架（LangChain、RAG、MCP 开发）
```

- [ ] **Step 6: 验证教程渲染**

Run: `cd frontend && npm run dev`
Open: `http://localhost:3000/tutorials/claude-code-intro`
Check: 教程内容正确渲染、代码块高亮、复制按钮可用、步骤进度显示

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Tutorials/ frontend/public/content/tutorials/
git commit -m "feat: add tutorial list/detail pages and 5 initial Claude Code tutorials

- TutorialList: filterable grid with category/difficulty chips and search
- TutorialDetail: breadcrumb nav + TutorialRenderer integration
- 5 tutorials: intro, install, first use, daily workflow, hooks

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: 创建工具向导页面

**Files:**
- Create: `frontend/src/pages/Tools/ToolList.jsx`
- Create: `frontend/src/pages/Tools/ToolList.css`
- Create: `frontend/src/pages/Tools/ToolDetail.jsx`
- Create: `frontend/src/pages/Tools/ToolDetail.css`

- [ ] **Step 1: 创建 ToolList.jsx**

```jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllTools } from '../../services/contentLoader';
import { TOOL_CATEGORIES, TOOL_CATEGORY_LABELS } from '../../utils/constants';
import './ToolList.css';

const ToolList = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...Object.values(TOOL_CATEGORIES)];
  const tools = selectedCategory === 'all'
    ? getAllTools()
    : getAllTools(selectedCategory);

  return (
    <div className="tool-list-page">
      <div className="tool-list-header">
        <h1>工具向导</h1>
        <p>每款工具提供从安装配置到最佳实践的引导式向导，帮助你快速上手。</p>
      </div>

      {/* Category Filter */}
      <div className="tool-categories" role="radiogroup" aria-label="工具类别">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-chip ${selectedCategory === cat ? 'filter-chip--active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
            aria-pressed={selectedCategory === cat}
          >
            {cat === 'all' ? '全部' : TOOL_CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Tool Cards */}
      <div className="tool-grid">
        {tools.map((tool) => (
          <Link to={`/tools/${tool.slug}`} key={tool.id} className="tool-card">
            <div className="tool-card-header">
              <h3 className="tool-card-name">{tool.name}</h3>
              <span className="tag">{TOOL_CATEGORY_LABELS[tool.category]}</span>
            </div>
            <p className="tool-card-desc">{tool.description}</p>
            <div className="tool-card-tags">
              {tool.tags?.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            {tool.wizardSteps?.length > 0 && (
              <div className="tool-card-steps">
                {tool.wizardSteps.length} 步向导 →
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ToolList;
```

- [ ] **Step 2: 创建 ToolList.css**

```css
.tool-list-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.tool-list-header {
  margin-bottom: var(--spacing-lg);
}
.tool-list-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: 800;
}
.tool-list-header p {
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.tool-categories {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  background: var(--bg-primary);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.filter-chip:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}
.filter-chip--active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: var(--text-inverse);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.tool-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  transition: all 0.15s;
  color: var(--text-primary);
}
.tool-card:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-md);
  text-decoration: none;
  transform: translateY(-2px);
}

.tool-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
  gap: var(--spacing-sm);
}

.tool-card-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.tool-card-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  flex: 1;
  margin-bottom: var(--spacing-sm);
}

.tool-card-tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 1px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 500;
}

.tool-card-steps {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
  color: var(--accent-color);
  font-weight: 500;
  font-size: var(--font-size-sm);
}

@media (max-width: 768px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 创建 ToolDetail.jsx**

```jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getToolBySlug, getTutorialBySlug } from '../../services/contentLoader';
import { TOOL_CATEGORY_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import './ToolDetail.css';

const ToolDetail = () => {
  const { slug } = useParams();
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <div className="tool-detail-error">
        <h2>工具未找到</h2>
        <Link to="/tools" className="back-link">← 返回工具列表</Link>
      </div>
    );
  }

  return (
    <div className="tool-detail-page">
      {/* Breadcrumb */}
      <nav className="tool-breadcrumb" aria-label="面包屑导航">
        <Link to="/">首页</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/tools">工具向导</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{tool.name}</span>
      </nav>

      {/* Header */}
      <header className="tool-header">
        <span className="tag">{TOOL_CATEGORY_LABELS[tool.category]}</span>
        <h1>{tool.name}</h1>
        <p className="tool-desc">{tool.description}</p>
        {tool.officialUrl && (
          <a
            href={tool.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tool-official-link"
          >
            官方网站 →
          </a>
        )}
        <div className="tool-tags">
          {tool.tags?.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </header>

      {/* Wizard Steps */}
      {tool.wizardSteps?.length > 0 ? (
        <section className="tool-wizard">
          <h2>学习向导</h2>
          <p className="tool-wizard-desc">
            按照以下步骤逐步掌握 {tool.name}，每步对应一篇详细教程。
          </p>

          <div className="wizard-steps">
            {tool.wizardSteps.map((wizardStep) => {
              const tutorial = getTutorialBySlug(wizardStep.tutorialSlug);
              return (
                <Link
                  to={tutorial ? `/tutorials/${tutorial.slug}` : '#'}
                  key={wizardStep.step}
                  className={`wizard-step ${!tutorial ? 'wizard-step--disabled' : ''}`}
                >
                  <div className="wizard-step-number">{wizardStep.step}</div>
                  <div className="wizard-step-content">
                    <h3>{wizardStep.title}</h3>
                    {tutorial && (
                      <p>
                        {tutorial.title}
                        <span className="wizard-step-time">
                          ⏱ {tutorial.estimatedTime} 分钟
                        </span>
                      </p>
                    )}
                    {!tutorial && <p className="wizard-step-soon">即将推出</p>}
                  </div>
                  <span className="wizard-step-arrow">→</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="tool-wizard">
          <h2>教程即将推出</h2>
          <p>
            {tool.name} 的详细向导正在编写中。欢迎
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              贡献内容
            </a>
            ！
          </p>
        </section>
      )}

      {/* Related Tutorials */}
      <section className="tool-related">
        <h2>相关教程</h2>
        <Link to={`/tutorials?category=${tool.category}`} className="view-all">
          浏览所有 {TOOL_CATEGORY_LABELS[tool.category]} 教程 →
        </Link>
      </section>
    </div>
  );
};

export default ToolDetail;
```

- [ ] **Step 4: 创建 ToolDetail.css**

```css
.tool-detail-page {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.tool-breadcrumb {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-sm);
}

.breadcrumb-sep {
  color: var(--text-tertiary);
}

/* Header */
.tool-header {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.tool-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  margin: var(--spacing-sm) 0;
}

.tool-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
  line-height: 1.6;
  margin-bottom: var(--spacing-sm);
}

.tool-official-link {
  display: inline-block;
  color: var(--accent-color);
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.tool-tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

/* Wizard */
.tool-wizard {
  margin-bottom: var(--spacing-xl);
}

.tool-wizard h2 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.tool-wizard-desc {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.wizard-steps {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.wizard-step {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-primary);
  transition: background 0.15s;
  color: var(--text-primary);
  text-decoration: none;
}
.wizard-step:hover {
  background: var(--bg-secondary);
  text-decoration: none;
}

.wizard-step--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.wizard-step--disabled:hover {
  background: var(--bg-primary);
}

.wizard-step-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-color);
  color: var(--text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.wizard-step-content {
  flex: 1;
  min-width: 0;
}
.wizard-step-content h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
}
.wizard-step-content p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-top: 2px;
}

.wizard-step-time {
  margin-left: var(--spacing-sm);
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

.wizard-step-soon {
  font-style: italic;
}

.wizard-step-arrow {
  color: var(--text-tertiary);
  font-size: var(--font-size-lg);
}

/* Error */
.tool-detail-error {
  text-align: center;
  padding: var(--spacing-2xl);
}

.back-link {
  color: var(--accent-color);
  font-weight: 500;
}

/* Related */
.tool-related {
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.tool-related h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.view-all {
  color: var(--accent-color);
  font-weight: 500;
  font-size: var(--font-size-sm);
}
```

- [ ] **Step 5: 验证工具向导**

Run: `cd frontend && npm run dev`
Open: `http://localhost:3000/tools`
Check: 工具卡片按类别排列，点击 Claude Code 进入向导页，6 步向导链接到对应教程

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Tools/
git commit -m "feat: add tool list and tool wizard detail pages

- ToolList: category filter chips, card grid with step count
- ToolDetail: wizard step navigation linking to tutorials, official link
- Empty state for tools without wizard content yet

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: 创建学习路径和场景占位页面

**Files:**
- Create: `frontend/src/pages/Pathways/PathwayList.jsx`
- Create: `frontend/src/pages/Pathways/PathwayList.css`
- Create: `frontend/src/pages/Scenarios/ScenarioList.jsx`
- Create: `frontend/src/pages/Scenarios/ScenarioList.css`

- [ ] **Step 1: 创建 PathwayList.jsx**

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { getAllPathways } from '../../services/contentLoader';
import './PathwayList.css';

const PathwayList = () => {
  const pathways = getAllPathways();

  return (
    <div className="pathway-list-page">
      <div className="pathway-list-header">
        <h1>学习路径</h1>
        <p>从入门到精通，按层级递进系统学习。每条路径包含多个教程，完成后解锁下一阶段。</p>
      </div>

      <div className="pathway-grid">
        {pathways.map((pathway) => (
          <Link to={`/pathways/${pathway.slug}`} key={pathway.id} className="pathway-card">
            <div className="pathway-card-icon">{pathway.icon}</div>
            <h3 className="pathway-card-title">{pathway.title}</h3>
            <p className="pathway-card-desc">{pathway.description}</p>
            <div className="pathway-card-meta">
              <span>{pathway.steps.length} 个教程</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PathwayList;
```

- [ ] **Step 2: 创建 PathwayList.css**

```css
.pathway-list-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.pathway-list-header {
  margin-bottom: var(--spacing-lg);
}
.pathway-list-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: 800;
}
.pathway-list-header p {
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.pathway-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-md);
}

.pathway-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xl);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-primary);
  transition: all 0.15s;
  color: var(--text-primary);
}
.pathway-card:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-md);
  text-decoration: none;
  transform: translateY(-2px);
}

.pathway-card-icon {
  font-size: 40px;
  margin-bottom: var(--spacing-md);
}

.pathway-card-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.pathway-card-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  flex: 1;
}

.pathway-card-meta {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

@media (max-width: 768px) {
  .pathway-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 创建 ScenarioList.jsx**

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { getAllScenarios } from '../../services/contentLoader';
import './ScenarioList.css';

const ScenarioList = () => {
  const scenarios = getAllScenarios();

  return (
    <div className="scenario-list-page">
      <div className="scenario-list-header">
        <h1>场景检索</h1>
        <p>描述你想要达成的目标，找到匹配的工具链和教程，即学即用。</p>
      </div>

      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <Link to={`/scenarios/${scenario.slug}`} key={scenario.id} className="scenario-card">
            <h3 className="scenario-card-title">{scenario.title}</h3>
            <p className="scenario-card-goal">
              <strong>目标：</strong>
              {scenario.goal}
            </p>
            <p className="scenario-card-desc">{scenario.description}</p>
            <div className="scenario-card-meta">
              <span>🔧 {scenario.tools.length} 个工具</span>
              <span>📚 {scenario.tutorials.length} 篇教程</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ScenarioList;
```

- [ ] **Step 4: 创建 ScenarioList.css**

```css
.scenario-list-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.scenario-list-header {
  margin-bottom: var(--spacing-lg);
}
.scenario-list-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: 800;
}
.scenario-list-header p {
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--spacing-md);
}

.scenario-card {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  transition: all 0.15s;
  color: var(--text-primary);
}
.scenario-card:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-md);
  text-decoration: none;
  transform: translateY(-2px);
}

.scenario-card-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.scenario-card-goal {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-sm);
}

.scenario-card-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  flex: 1;
}

.scenario-card-meta {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

@media (max-width: 768px) {
  .scenario-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: 验证页面**

Run: `cd frontend && npm run dev`
Open: `http://localhost:3000/pathways` 和 `http://localhost:3000/scenarios`
Check: 页面正确渲染，数据从 JSON 加载

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Pathways/ frontend/src/pages/Scenarios/
git commit -m "feat: add pathway list and scenario list placeholder pages

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: 添加 useProgress Hook 和 localStorage 持久化

**Files:**
- Create: `frontend/src/hooks/useProgress.js`

- [ ] **Step 1: 创建 useProgress.js**

```javascript
import { useState, useCallback } from 'react';

/**
 * 学习进度管理 Hook
 * 使用 localStorage 持久化用户的学习进度
 */
const PROGRESS_KEY = 'learn-ai-progress';

function loadProgress() {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // localStorage 不可用或已满时静默失败
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  const markTutorialComplete = useCallback((tutorialSlug) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        [tutorialSlug]: {
          completed: true,
          completedAt: new Date().toISOString(),
          ...prev[tutorialSlug],
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const markChapterComplete = useCallback((tutorialSlug, chapterIndex) => {
    setProgress((prev) => {
      const tutorialProgress = prev[tutorialSlug] || { completed: false, chapters: {} };
      const next = {
        ...prev,
        [tutorialSlug]: {
          ...tutorialProgress,
          chapters: {
            ...tutorialProgress.chapters,
            [chapterIndex]: {
              completed: true,
              completedAt: new Date().toISOString(),
            },
          },
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const getTutorialProgress = useCallback(
    (tutorialSlug) => progress[tutorialSlug] || { completed: false, chapters: {} },
    [progress]
  );

  const getOverallProgress = useCallback(() => {
    const entries = Object.values(progress);
    const completed = entries.filter((e) => e.completed).length;
    return {
      total: entries.length,
      completed,
      percentage: entries.length > 0 ? Math.round((completed / entries.length) * 100) : 0,
    };
  }, [progress]);

  const clearProgress = useCallback(() => {
    setProgress({});
    try {
      localStorage.removeItem(PROGRESS_KEY);
    } catch {
      // 静默失败
    }
  }, []);

  return {
    progress,
    markTutorialComplete,
    markChapterComplete,
    getTutorialProgress,
    getOverallProgress,
    clearProgress,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useProgress.js
git commit -m "feat: add useProgress hook with localStorage persistence

- Tracks tutorial and chapter completion
- Overall progress calculation with percentage
- Clear progress function for reset

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: 构建生产版本 + Vercel 部署配置

**Files:**
- Create: `frontend/vercel.json`
- Create: `frontend/.gitignore`

- [ ] **Step 1: 创建 .gitignore**

```gitignore
node_modules
dist
.env
.env.local
*.log
.DS_Store
```

- [ ] **Step 2: 创建 vercel.json**

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/content/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: 构建验证**

Run: `cd frontend && npm run build`
Expected: 构建成功，生成 `dist/` 目录，无错误

- [ ] **Step 4: 本地预览构建产物**

Run: `cd frontend && npm run preview`
Check: 所有页面和路由正常工作

- [ ] **Step 5: Commit**

```bash
git add frontend/vercel.json frontend/.gitignore
git commit -m "chore: add vercel deployment config and gitignore

- vercel.json: SPA fallback rewrites, content caching headers
- .gitignore: standard Node.js ignores

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: 创建项目 README

**Files:**
- Create: `README.md`

- [ ] **Step 1: 创建 README.md**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add project README with quick start guide

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 2-5 概览

> 以下为后续阶段的高层任务列表，每个 Phase 应在单独的计划文档中细化。

### Phase 2: 三条入口完善
- 学习路径详情页（`/pathways/[slug]`）：可视化进度线 + 课程解锁
- 场景详情页（`/scenarios/[slug]`）：Mermaid 工作流图 + 工具链串联
- 首页热门推荐动态化
- 客户端搜索索引构建（预生成 `search-index.json`）

### Phase 3: 内容管道
- Python RSS/社交媒体抓取脚本
- AI 加工管道（摘要/分类/去重）
- 知识管理后台（FastAPI + htmx）
- GitHub Actions 定时管道运行
- Vercel 自动部署集成

### Phase 4: 用户系统 + 教程编排
- Supabase Auth 集成（GitHub OAuth）
- 用户进度云端同步（替代 localStorage）
- 教程编排管理后台（CRUD + 素材选取）
- 管理员角色与权限

### Phase 5: 完善与社区
- AI 助手浮窗（嵌入式 Chatbot）
- 评论系统评估（GitHub Discussions 优先）
- CONTRIBUTING.md + 社区规范
- 邮件/RSS 订阅更新通知
- i18n 国际化预留

---

> **Phase 1 计划完成**，共 11 个 Task。每个 Task 包含具体文件路径、完整代码和验证步骤。
