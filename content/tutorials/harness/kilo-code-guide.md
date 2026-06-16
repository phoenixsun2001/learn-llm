## 学习目标

完成本章后，你将能够：

- 理解 Kilo Code 是什么以及它的开源 Agent 架构
- 掌握 Kilo Code 在多平台（VS Code、JetBrains、CLI、浏览器、移动端）的安装方式
- 区分四种核心 Agent（Code、Ask、Plan、Debug）的适用场景
- 熟练使用自动补全、Fast Edits、Checkpoints、Context Mentions 等核心功能
- 通过 Kilo Gateway 接入 500+ 模型，灵活选择底层 LLM
- 将 Kilo Code 与 Claude Code、Codex、Cursor 进行场景化对比

## 学习路径

| 路径 | 适用人群 | 预计时间 | 内容 |
|------|----------|----------|------|
| **快速通道** | 有 AI 编码工具经验 | 10 分钟 | 安装 + Agent 速览 + 第一个任务 |
| **完整路径** | 初次接触 AI 编码工具 | 25 分钟 | 从概念到最佳实践的完整学习 |

## 什么是 Kilo Code

Kilo Code 是一个**开源的 AI 结对编程代理（Agent）**，能够像一位有经验的开发者一样理解你的项目、规划任务、读写文件、执行终端命令，并在出错时自我修正。它不是简单的代码补全插件，而是一个完整的**自主编程智能体**。

与 Claude Code 的纯命令行形态不同，Kilo Code 以 VS Code 和 JetBrains 等 IDE 扩展为核心，同时提供 CLI、浏览器、移动端（iOS/Android）、Slack 和 Cloud Agent 等多种入口，做到了"写代码的地方就有 Kilo Code"。

> **开源承诺**：Kilo Code 完全开源，你可以审计其代码、定制 Agent 行为、甚至自部署 KiloClaw 来运行托管的 Agent 实例。

## 平台支持

Kilo Code 的跨平台覆盖是其最大差异化优势之一：

| 平台 | 安装方式 | 适用场景 |
|------|----------|----------|
| **VS Code** | 扩展市场安装 `kilocode.kilo-code` | 主力开发环境，功能最完整 |
| **JetBrains** | 插件市场安装（IntelliJ / PyCharm / WebStorm） | Java/Python/Kotlin 开发者 |
| **CLI** | `npm install -g @kilocode/cli` | CI/CD、远程服务器、自动化脚本 |
| **浏览器** | 官方 Web 界面 | 无需安装、快速试用、轻量级任务 |
| **Cloud Agent** | Kilo 云端托管 | 后台持续运行 Agent，无需本地资源 |
| **移动端** | iOS / Android App | 移动中查看进度、审批关键操作 |
| **Slack** | Slack App 集成 | 团队协作中快速触发 AI 任务 |
| **App Builder** | 内置可视化搭建器 | 通过自然语言快速生成完整应用原型 |

> **建议**：日常开发以 VS Code 或 JetBrains 扩展为主力，CLI 用于自动化流水线，移动端和 Slack 用于状态监控和审批。

## 安装指南

### VS Code

```bash
# 方式一：终端安装
code --install-extension kilocode.kilo-code

# 方式二：VS Code 内操作
# 打开扩展面板 (Ctrl+Shift+X) → 搜索 "Kilo Code" → 点击安装
```

安装后，VS Code 侧边栏会出现 Kilo Code 面板，使用 `Cmd/Ctrl + Shift + K` 快速唤起。

### JetBrains (IntelliJ / PyCharm / WebStorm)

```
# 在 IDE 内操作
Settings → Plugins → Marketplace → 搜索 "Kilo Code" → Install → 重启 IDE
```

### CLI

```bash
# 全局安装
npm install -g @kilocode/cli

# 验证安装
kilo --version

# 进入项目目录后启动
cd your-project
kilo
```

### Cloud Agent（无需安装）

直接访问 [Kilo Cloud Agent](https://kilo.ai) 登录后即可使用，适合不想在本地配置环境或需要后台持续运行 Agent 的场景。

## 四种核心 Agent

Kilo Code 内置四种专门化的 Agent，通过切换 Agent 来匹配当前任务类型：

### 1. Code Agent（编码代理）

**定位**：主力编码 Agent，用于日常开发。

```
适用场景：
- 从零实现功能模块
- 修复 Bug 并自动运行测试验证
- 重构代码、优化性能
- 生成单元测试和集成测试
```

Code Agent 拥有完整的文件读写和终端执行权限，能够自主规划并执行多步骤的复杂开发任务。

### 2. Ask Agent（问答代理）

**定位**：只读模式的代码分析 Agent。

```
适用场景：
- 理解陌生代码库的结构和逻辑
- 分析代码质量和潜在问题
- 查询 API 用法和最佳实践
- 解释复杂算法或正则表达式
```

Ask Agent **不会修改任何文件**，适合在不确定操作后果时先用它来分析代码。

### 3. Plan Agent（规划代理）

**定位**：架构设计和任务拆解 Agent。

```
适用场景：
- 将大型需求拆解为可执行的子任务
- 设计系统架构和数据模型
- 评估技术方案的优缺点
- 生成实现路线图和时间估算
```

在开始一个大型任务前，先用 Plan Agent 制定清晰计划，再切换到 Code Agent 执行。

### 4. Debug Agent（调试代理）

**定位**：专门针对错误的诊断 Agent。

```
适用场景：
- 分析堆栈跟踪和错误日志
- 追踪复杂 Bug 的根因
- 检查异步调用链和竞态条件
- 分析性能瓶颈和内存泄漏
```

Debug Agent 会系统地读取相关文件、分析调用链、提出修复方案，并可以在 Code Agent 确认后自动应用修复。

### Agent 切换策略

| 当前状态 | 推荐 Agent | 原因 |
|----------|------------|------|
| 收到新需求 | Plan | 先规划再执行 |
| 开始写代码 | Code | 主力执行 |
| 遇到报错 | Debug | 专项诊断 |
| 阅读陌生代码 | Ask | 只读分析，安全 |
| Debug 给出方案后 | Code | 执行修复 |

## 核心功能详解

### 自动补全（Autocomplete）

Kilo Code 提供上下文感知的智能代码补全，不仅补全单行，还能预测整个代码块：

- **多行补全**：根据上下文预测接下来的多行代码
- **Tab 接受**：按 Tab 键一键接受建议
- **智能触发**：在函数声明、循环、条件语句后自动触发

### Fast Edits（快速编辑）

Fast Edits 是 Kilo Code 的创新功能，允许你通过自然语言描述局部修改，无需开启完整对话：

```
# 选中代码块 → 触发 Fast Edit → 输入指令
"为这个函数添加参数校验"
"把这个循环改为 async/await 写法"
"提取这段逻辑为独立函数"
```

### 代码操作（Code Actions）

在编辑器中右键或通过快捷键触发的预置操作：

- **Explain Code**：解释当前代码块的功能和逻辑
- **Improve Code**：自动优化代码可读性和性能
- **Add Tests**：为当前函数生成对应测试用例
- **Find Issues**：检查潜在 Bug 和安全问题

### 任务与待办列表（Task / Todo List）

Kilo Code 在执行复杂任务时会自动生成并维护一个 Todo List：

```
任务进度：
[X] 创建 User 数据模型
[X] 实现注册 API 端点
[→] 添加 JWT 认证中间件 ← 当前执行中
[ ] 编写单元测试
[ ] 更新 API 文档
```

你可以随时查看任务进度，并手动调整优先级或跳过某些步骤。

### Checkpoints（检查点）

Checkpoints 是 Kilo Code 的文件版本快照功能，在 Agent 开始大规模修改前自动创建：

- **自动快照**：每次 Agent 批量修改文件前自动创建
- **一键回滚**：如果 Agent 方向跑偏，一键恢复到检查点状态
- **手动创建**：在关键节点可手动创建有名称的检查点

### 浏览器使用（Browser Use）

Kilo Code 的 Agent 可以直接操控浏览器：

```
"打开我们的应用登录页面，测试新用户注册流程是否正常"
```

Agent 会启动浏览器、导航到指定 URL、执行操作序列、截图并报告结果。这对于端到端测试和调试前端交互尤其有用。

### 上下文引用（Context Mentions）

使用 `@` 符号在对话中引用上下文：

```
@file:src/services/auth.py   # 引用特定文件
@folder:src/components/       # 引用整个文件夹
@git:diff                      # 引用当前未提交的改动
@terminal:last                 # 引用上次终端输出
```

精确的上下文引用能大幅提升 Agent 回答的准确度。

### 提示词增强（Enhance Prompt）

当你不确定如何清晰描述需求时，使用 Enhance Prompt 功能：

```
输入："加个登录"
Kilo 自动增强为：
"实现用户登录功能：包含邮箱+密码登录表单、
JWT Token 生成与验证、登录状态持久化、
错误提示（密码错误、用户不存在）、
以及前端登录页面组件。"
```

### Git 提交生成（Git Commit Generation）

Kilo Code 分析当前变更的 diff，自动生成符合 Conventional Commits 规范的提交信息：

```
# 在对话中输入
"为当前的改动生成 commit message"

# 输出示例
feat(auth): add JWT-based login with refresh token rotation
- Implement email/password authentication endpoint
- Add JWT generation and validation middleware
- Create login page component with form validation
```

## 模型选择与 Kilo Gateway

### Kilo Gateway 统一 API

Kilo Gateway 是 Kilo 生态的核心组件，提供**单个 API 端点接入 500+ 模型**的能力：

```
# 传统方式：每个供应商单独接入
OpenAI API → api.openai.com
Anthropic API → api.anthropic.com
Google API → generativelanguage.googleapis.com
...

# Kilo Gateway：单端点接入所有
Kilo Gateway → 统一路由 → 任意供应商的任意模型
```

### 模型切换

在 Kilo Code 中切换模型只需一条指令，无需修改代码或配置文件：

```
# 在对话中直接切换
/model openai/gpt-5
/model anthropic/claude-sonnet-4-5
/model google/gemini-2.5-pro
/model deepseek/deepseek-v4
```

### 模型选择策略

| 场景 | 推荐模型 | 原因 |
|------|----------|------|
| 复杂架构设计 | o-series / Opus | 深度推理能力 |
| 日常编码主力 | Sonnet / GPT-5 | 速度与能力平衡 |
| 快速问答 | Haiku / Gemini Flash | 低延迟、低成本 |
| 批量重构 | GPT-4.1 / DeepSeek | 高性价比 |
| 特定领域代码 | 开源专用模型 | 针对性训练 |

## KiloClaw：托管 Agent 部署

KiloClaw 是 Kilo 提供的 **OpenClaw 托管部署服务**，让你可以：

- 将配置好的 Agent 部署为独立服务
- 通过 HTTP API 或 Webhook 调用 Agent
- 设置定时任务让 Agent 周期性执行检查
- 在 CI/CD 流水线中集成 Agent 能力

```yaml
# KiloClaw 配置示例（概念性）
agent:
  name: "code-reviewer"
  model: "anthropic/claude-sonnet-4-5"
  triggers:
    - type: webhook
      event: pull_request
  tasks:
    - review_code_quality
    - check_security_issues
    - suggest_improvements
```

## 与其他工具的对比

| 维度 | Kilo Code | Claude Code | Codex | Cursor |
|------|-----------|-------------|-------|--------|
| **开发商** | Kilo | Anthropic | OpenAI | Cursor Inc. |
| **开源** | **完全开源** | 否 | 否 | 否 |
| **产品形态** | IDE 扩展为主 + CLI + Cloud + 移动端 | CLI 为主 | 桌面 App 为主 | AI-first IDE |
| **多 Agent** | **Code / Ask / Plan / Debug** | 单一 Agent | App + CLI 双模式 | 聊天 + 内联 |
| **平台覆盖** | VS Code / JetBrains / CLI / Web / iOS / Android / Slack | CLI / VS Code / JetBrains | 桌面 App / CLI | 独立 IDE |
| **模型接入** | **500+ 模型（Kilo Gateway）** | Anthropic 模型 + 第三方 | OpenAI 模型 | 多供应商 |
| **Checkpoints** | **内置** | 无 | 无 | 无 |
| **Fast Edits** | **内置** | 无 | 无 | 内联编辑 |
| **移动端** | **完整支持** | 无 | 无 | 无 |
| **浏览器操控** | **内置** | 无 | 无 | 无 |
| **托管部署** | **KiloClaw** | 无 | 无 | 无 |
| **价格模型** | 开源免费 + Gateway 按量 | API 按量计费 | ChatGPT 订阅 + API | 订阅制 |

**选型建议**：

- **开源优先 + 多 Agent 切换 + 全平台** → Kilo Code
- **终端深度用户 + Anthropic 生态** → Claude Code
- **OpenAI 生态 + 桌面端体验** → Codex
- **零配置 AI-first IDE** → Cursor

实践中，许多团队将 Kilo Code 作为主力编码工具，Claude Code 或 Codex 作为特定场景的补充。

## 快速上手：10 分钟体验

```bash
# 1. 安装 VS Code 扩展
code --install-extension kilocode.kilo-code

# 2. 打开 Kilo Code 面板
# Cmd/Ctrl + Shift + K

# 3. 配置模型供应商
# 在设置中填入 Kilo Gateway API Key 或直接接入供应商 Key

# 4. 第一个任务 — 切换到 Code Agent
"分析当前项目的技术栈和目录结构，告诉我这是什么类型的项目"

# 5. 体验 Ask Agent
# 切换到 Ask Agent
"src/services/ 目录下的主要模块有哪些？各模块的职责是什么？"

# 6. 体验 Fast Edits
# 在编辑器中选中一个函数 → 右键 → Fast Edit
"为这个函数添加输入参数的 Joi / Zod 校验"
```

## 最佳实践

### 1. 善用 Agent 切换

不要始终停留在 Code Agent。接到新需求时先用 Plan Agent 做规划，遇到 Bug 切换到 Debug Agent，阅读陌生代码用 Ask Agent。合适的 Agent 做合适的事，效率提升显著。

### 2. 精确的上下文引用

使用 `@` Context Mentions 而非描述性引用：

```
# 不推荐
"请修改订单服务中的支付逻辑"

# 推荐
"请修改 @file:src/services/order.py 中的 process_payment 函数，
参考 @file:src/schemas/payment.py 的新字段定义来更新参数"
```

### 3. Checkpoints 习惯

- 每次让 Agent 执行大型重构前，手动创建一个命名检查点
- 如果 Agent 连续 3 步都未能解决问题，果断回滚检查点并调整指令
- 使用描述性名称：`before-refactor-auth-module` 而非 `checkpoint-1`

### 4. Enhance Prompt 先行

在给 Agent 复杂指令前，先用 Enhance Prompt 优化你的描述。清晰的输入 = 精准的输出。

### 5. Gateway 模型策略

```
日常开发：用快速模型（Sonnet / GPT-5）
遇到难题：切换深度推理模型（Opus / o-series）
批量任务：用性价比模型（GPT-4.1 / DeepSeek）
```

### 6. 团队协作

- 将项目级的 Kilo Code 配置提交到 Git 仓库
- 在 PR 审查中使用 Kilo Code 作为第一道自动化检查
- 通过 Slack 集成让非技术团队成员也能触发简单任务

## 下一步

在掌握了 Kilo Code 的核心概念后，建议按以下路径继续：

1. **上手实践**：安装 Kilo Code，完成第一个实际开发任务
2. **Agent 切换**：在实际项目中体验四种 Agent 的协作流程
3. **Gateway 配置**：接入 Kilo Gateway，尝试不同模型的差异
4. **团队落地**：探索 KiloClaw 部署和企业级使用模式
