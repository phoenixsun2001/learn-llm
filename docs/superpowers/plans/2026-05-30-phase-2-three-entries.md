# AI Learning Platform — Phase 2: 三条入口完善 实施计划

> **For agentic workers:** Use superpowers:subagent-driven-development

**Goal:** 完善三条入口：学习路径可视化进度页、场景详情页（含 Mermaid 工作流）、搜索功能、首页内容动态化。

**Prerequisites:** Phase 1 MVP 完成（React SPA + 教程渲染引擎 + 工具向导 + 数据层）

---

## 文件变更总览

```
修改: frontend/src/pages/Home/Home.jsx          # 动态热门教程
修改: frontend/src/pages/Home/Home.css
新建: frontend/src/pages/Pathways/PathwayDetail.jsx  # 路径详情+进度
新建: frontend/src/pages/Pathways/PathwayDetail.css
新建: frontend/src/pages/Scenarios/ScenarioDetail.jsx # 场景详情+工作流
新建: frontend/src/pages/Scenarios/ScenarioDetail.css
新建: frontend/src/pages/Search/SearchResults.jsx     # 搜索结果页
新建: frontend/src/pages/Search/SearchResults.css
修改: frontend/src/App.jsx                     # 新增路由
新建: frontend/src/data/search-index.json       # 预生成搜索索引
修改: frontend/src/data/tutorials-index.json    # 补充搜索关键词
```

---

### Task 2.1: 学习路径详情页（PathwayDetail）

**Files:**
- Create: `frontend/src/pages/Pathways/PathwayDetail.jsx`
- Create: `frontend/src/pages/Pathways/PathwayDetail.css`
- Modify: `frontend/src/App.jsx` (add `/pathways/:slug` route)

**Requirements:**

PathwayDetail.jsx — 学习路径详情页：
- 使用 `useParams()` 获取 slug，调用 `getPathwayBySlug(slug)` 获取路径数据
- 面包屑：首页 > 学习路径 > {pathway.title}
- 路径头部：大图标 + 标题 + 描述 + 教程数统计
- **可视化进度线**：垂直时间线展示每个步骤
  - 每条步骤显示：序号圆圈、教程标题、描述、预估时间、状态标记
  - 已完成的步骤显示绿色勾号（从 useProgress hook 读取）
  - 当前步骤高亮（accent 边框 + 光晕）
  - 步骤之间用竖线连接
  - 点击步骤跳转到对应教程
- 使用 `getTutorialBySlug(tutorialId)` 解析步骤中的 `tutorialId` 为实际教程数据
- 顶部显示总体进度百分比（已完成步骤数/总步骤数）
- 未找到路径时显示错误状态

PathwayDetail.css：
- 时间线样式：左侧竖线（border-left），步骤圆圈左对齐
- 完成状态绿色、进行中蓝色、待完成灰色
- 响应式：移动端减小圆圈尺寸

App.jsx 添加路由：
```jsx
import PathwayDetail from './pages/Pathways/PathwayDetail';
// 在 Routes 中添加:
<Route path="/pathways/:slug" element={<PathwayDetail />} />
```

---

### Task 2.2: 场景详情页（ScenarioDetail）

**Files:**
- Create: `frontend/src/pages/Scenarios/ScenarioDetail.jsx`
- Create: `frontend/src/pages/Scenarios/ScenarioDetail.css`
- Modify: `frontend/src/App.jsx` (add `/scenarios/:slug` route)

**Requirements:**

ScenarioDetail.jsx — 场景详情页：
- 使用 `useParams()` 获取 slug，调用 `getScenarioBySlug(slug)` 获取场景数据
- 面包屑：首页 > 场景检索 > {scenario.title}
- 场景头部：标题 + 目标描述（突出显示）+ 详细描述
- **推荐工具链**：卡片形式展示关联工具，点击跳转到 `/tools/{slug}`
- **教程列表**：卡片链接到关联教程，显示标题+时长
- **工作流可视化**：渲染 `scenario.workflow` 文本为流程示意
  - 用箭头（→）连接各步骤，每步一个 pill 样式标签
  - 解析 "步骤A → 步骤B → 步骤C" 格式
- 未找到场景时显示错误状态

ScenarioDetail.css：
- 工具链卡片：水平排列，hover 效果
- 工作流 pills：水平滚动，accent 色标签，箭头连接

App.jsx 添加路由：
```jsx
import ScenarioDetail from './pages/Scenarios/ScenarioDetail';
<Route path="/scenarios/:slug" element={<ScenarioDetail />} />
```

---

### Task 2.3: 全局搜索功能

**Files:**
- Create: `frontend/src/pages/Search/SearchResults.jsx`
- Create: `frontend/src/pages/Search/SearchResults.css`
- Create: `frontend/src/data/search-index.json`
- Modify: `frontend/src/App.jsx` (add `/search` route)
- Modify: `frontend/src/services/contentLoader.js` (add search function)

**Requirements:**

search-index.json — 预生成搜索索引：
```json
[
  {"type":"tutorial","slug":"claude-code-intro","title":"Claude Code 入门指南","keywords":["claude","code","入门","指南","CLI"],"category":"harness","difficulty":"beginner"},
  {"type":"tutorial","slug":"claude-code-install","title":"Claude Code 安装与配置","keywords":["安装","配置","API","Key","环境"],"category":"harness","difficulty":"beginner"},
  ...所有教程...
  {"type":"tool","slug":"claude-code","title":"Claude Code","keywords":["CLI","编码","助手","Anthropic"],"category":"harness"},
  ...所有工具...
  {"type":"scenario","slug":"ai-code-review","title":"使用 AI 进行代码审查","keywords":["代码审查","review","自动化"],"category":null},
  ...所有场景...
]
```

contentLoader.js 添加：
```javascript
import searchIndex from '../data/search-index.json';

export function searchAll(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  return searchIndex.filter((item) =>
    item.title.toLowerCase().includes(q) ||
    item.keywords.some((kw) => kw.toLowerCase().includes(q))
  );
}
```

SearchResults.jsx — 搜索结果页：
- 从 URL 读取 `?q=` 参数
- 调用 `searchAll(query)` 获取结果
- 页面标题："搜索：{query}" + 结果数量
- 结果按类型分组：教程 / 工具 / 场景
- 每项显示：类型标签 + 标题（可点击）+ 分类标签
- 空状态："未找到相关结果"
- 搜索框在页面顶部，可修改查询重新搜索

App.jsx 添加路由：
```jsx
import SearchResults from './pages/Search/SearchResults';
<Route path="/search" element={<SearchResults />} />
```

---

### Task 2.4: 首页内容动态化

**Files:**
- Modify: `frontend/src/pages/Home/Home.jsx`
- Modify: `frontend/src/pages/Home/Home.css`

**Requirements:**

Home.jsx 改动：
- 热门教程从 `tutorials-index.json` 动态加载（取 `estimatedTime` 最短的 3 篇，或标记为 "热门" 的）
- 学习路径区增加路径卡片预览（从 `pathways-index.json` 前 3 条，显示图标+标题+步骤数）
- 工具区增加热门工具卡片（从 `tools-index.json` 取有 `wizardSteps` 的前 3 个）
- 保持现有的 Hero 和三入口卡片不变

---

### Task 2.5: 教程索引补充

**Files:**
- Modify: `frontend/src/data/tutorials-index.json`

**Requirements:**
- 为每个教程补充 `keywords` 字段（用于搜索索引）
- 添加 `featured: true` 标记热门教程
- 确保 `subcategory` 与内容目录一致
