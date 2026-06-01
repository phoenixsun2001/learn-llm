# AI Learning Platform — Phase 4: 用户系统 + 教程编排 实施计划

> **For agentic workers:** Use superpowers:subagent-driven-development

**Goal:** 集成 Supabase（Auth + PostgreSQL），用户进度云端同步，管理员教程编排功能。

**Prerequisites:** Phase 1-3 完成

---

## 架构说明

Phase 4 引入 Supabase 作为 BaaS 后端：
- **Auth**: GitHub OAuth 登录，管理员角色
- **Database**: PostgreSQL（用户进度、教程编排数据）
- **API**: Supabase JS 客户端直连（无需自建后端 API）

数据流：
```
前端 React SPA ←→ Supabase JS Client ←→ Supabase (Auth + PostgreSQL)
```

---

### Task 4.1: Supabase 项目初始化 + 客户端配置

**Files:**
- Create: `frontend/.env.local`
- Create: `frontend/src/services/supabase.js`
- Modify: `frontend/src/App.jsx` (AuthProvider wrapper)

**Requirements:**

supabase.js:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

.env.local 包含占位符（实际值由用户配置）：
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

注意：MVP 阶段 Supabase 为可选依赖。当未配置时，应用回退到 localStorage 模式。确保前端在无 Supabase 配置时仍能正常运行。

---

### Task 4.2: 用户认证（GitHub OAuth）

**Files:**
- Create: `frontend/src/components/Auth/AuthModal.jsx`
- Create: `frontend/src/components/Auth/AuthModal.css`
- Create: `frontend/src/hooks/useAuth.js`
- Modify: `frontend/src/components/Navbar/Navbar.jsx` (添加用户头像/登录按钮)

**Requirements:**

useAuth.js — 认证 Hook:
- `signInWithGitHub()`: 触发 GitHub OAuth 流程
- `signOut()`: 登出
- `user`: 当前用户对象
- `isAdmin`: 是否为管理员（检查 user.app_metadata.role）
- 自动监听 `onAuthStateChange` 更新状态

AuthModal.jsx — 登录弹窗:
- 简洁的登录/注册界面
- "使用 GitHub 登录" 按钮（GitHub 图标 + 文字）
- 已登录状态显示头像 + 用户名 + 登出按钮

Navbar.jsx 修改:
- 右侧添加用户头像（已登录）或"登录"按钮（未登录）
- 点击头像弹出下拉菜单（我的进度、管理后台、退出登录）
- 管理员可见"管理后台"链接 → /admin

---

### Task 4.3: 用户进度云端同步

**Files:**
- Modify: `frontend/src/hooks/useProgress.js` (添加 Supabase 同步)
- Create: `frontend/src/services/progressService.js`

**Requirements:**

progressService.js — 进度服务:
- `syncProgressToCloud(userId, progress)`: 上传进度到 Supabase
- `loadProgressFromCloud(userId)`: 从 Supabase 加载进度
- `mergeProgress(local, cloud)`: 合并本地和云端进度（取较新者）

useProgress.js 修改:
- 当用户已登录时，自动从云端加载进度
- 每次更新进度后，异步同步到云端
- 保留 localStorage 作为离线缓存
- 未登录时行为不变（纯 localStorage）

Supabase 表结构（SQL migration）:
```sql
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tutorial_slug TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    chapter_index INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tutorial_slug)
);
```

---

### Task 4.4: 教程编排管理后台（平台内）

**Files:**
- Create: `frontend/src/pages/Admin/AdminLayout.jsx`
- Create: `frontend/src/pages/Admin/AdminLayout.css`
- Create: `frontend/src/pages/Admin/TutorialManager.jsx`
- Create: `frontend/src/pages/Admin/TutorialManager.css`
- Create: `frontend/src/pages/Admin/PathwayManager.jsx`
- Create: `frontend/src/pages/Admin/PathwayManager.css`
- Modify: `frontend/src/App.jsx` (添加 /admin/* 路由，管理员保护)

**Requirements:**

AdminLayout.jsx — 管理后台布局:
- 侧边栏导航：教程管理、路径编排、素材库、发布管理
- 顶部标题栏 + 返回前台链接
- 管理员权限检查（非管理员重定向到首页）

TutorialManager.jsx — 教程管理:
- 教程列表表格（标题、分类、难度、状态、操作）
- 新建教程按钮 → 跳转编辑器
- 编辑教程：Markdown 编辑器 + 元数据表单
- 状态切换：草稿 → 发布 → 归档
- 从素材库选取内容组装教程（引用 content/materials/ 中的素材）

PathwayManager.jsx — 路径编排:
- 路径列表
- 创建/编辑路径：标题、描述、拖拽排序教程
- 设置前置依赖关系

App.jsx 路由保护:
```jsx
// 管理员路由（需登录 + 管理员角色）
<Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
  <Route index element={<Navigate to="/admin/tutorials" />} />
  <Route path="tutorials" element={<TutorialManager />} />
  <Route path="pathways" element={<PathwayManager />} />
</Route>
```

AdminGuard 组件：检查 useAuth().isAdmin，未授权重定向。

---

### Task 4.5: 数据库迁移脚本 + 初始化

**Files:**
- Create: `supabase/migrations/001_init.sql`
- Create: `frontend/src/data/admin-config.js`

**Requirements:**

001_init.sql — 数据库初始化:
```sql
-- 用户进度表
CREATE TABLE IF NOT EXISTS user_progress (...)

-- 教程编排表（管理员操作的表）
CREATE TABLE IF NOT EXISTS admin_tutorials (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    ...
);

CREATE TABLE IF NOT EXISTS admin_pathways (...)
```

admin-config.js — 管理后台配置:
- 定义管理后台菜单项
- 定义可用的分类/难度选项
- 定义发布工作流状态

---

### Task 4.6: 最终集成验证 + 环境配置说明

- 验证 GitHub OAuth 登录流程
- 验证进度同步（localStorage ↔ Supabase）
- 验证管理后台页面渲染 + 权限控制
- 验证未配置 Supabase 时应用正常运行（graceful degradation）
- 更新 README 添加 Supabase 配置说明
