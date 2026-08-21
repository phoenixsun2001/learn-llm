# DeepSeek Harness 完全指南

> **DeepSeek Harness 开发者预览版 · 一切皆插件 · 开源**
> 面向 Harness（Agent 运行时）开发者，把模型、工具、会话、沙箱等所有 Agent 能力都做成可插拔、可组合的插件。

DeepSeek Harness（下文简称 dsh）是 DeepSeek 推出的**开发者预览版 Agent 基础设施**。它的核心口号是 `Agent = Model + Harness`：模型提供「灵魂」，而 Harness 赋予 Agent **理解环境、调用工具、并在真实场景中持续工作**的能力。与那些把能力写死在框架里的方案不同，DeepSeek Harness 把**一切都做成插件**——开发者不改一行源码，就能在配置层选择、替换或扩展任意能力。

本指南带你从理念讲到架构，再到安装上手，帮助你把 DeepSeek Harness 纳入自己的 Agent 工程实践。

## DeepSeek Harness 是什么

DeepSeek Harness 开发者预览版面向全球 Harness 开发者开放测试，并同步开放源代码。它的定位不是「又一个 AI 编程工具」，而是**支撑 Agent 持续运行的可组合运行时**：

- **模型是 Agent 的灵魂**：负责推理与决策。
- **Harness 是让 Agent 落地的脚手架**：提供环境感知、工具执行、会话管理、上下文注入等一切「让模型真正干活」的能力。

与传统「一问一答」的助手不同，dsh 关注的是一段**长程、多轮、可持续**的运行过程：Agent 在真实项目里领取任务、调用工具、观察结果、分派子 Agent，直到任务完成。DeepSeek Harness 把这些能力全部**插件化**，让你能在开源、开放、可复用、可组合的基础设施之上，探索智能上限。

**关键特性：**

- **一切皆插件**：模型、工具、技能、会话、沙箱、存储、循环、调度、UI 等能力均由插件提供。
- **无特权内核**：Cordis 内核只负责插件的加载、卸载与依赖管理，不承载任何具体 Agent 能力。
- **配置层自由组合**：不改源码，即可在配置层选择、替换或扩展任一能力。
- **运行有迹可循**：模型看到的一切都会写入仅追加（append-only）的会话日志，可恢复、分叉、检索与回放。

## 一切皆插件的设计哲学

DeepSeek Harness 基于 **Cordis 插件系统**构建。模型、工具、技能、会话、沙箱、存储、循环、调度、UI 等所有 Agent 能力均由插件提供，并通过 **Cordis 服务与事件**彼此协作。

这一设计带来两条核心价值：

### 1. 一切皆插件，运行有迹可循

模型看到的一切——系统提示词、思维链、工具调用与结果、子 Agent 调度，以及每一次上下文注入——都会写入**仅追加设计的会话日志**。在 **Trajectory 视图**中，你可以按来源查看这些信息。恢复、分叉、检索与回放都共享同一份事件流，因此「运行过程」本身就是可被审计、可被复现的一等公民。

### 2. 配置层自由组合

开发者无需改动 DeepSeek Harness 源码，即可在**配置层**选择、替换或扩展任一能力。这意味着：换模型、换沙箱、换工具注册表、换 UI，都只是「换插件」，而不是「改框架」。

## Cordis 内核

Cordis 是 dsh 底层的框架。它的职责非常克制：

> **Cordis 内核只负责插件的加载、卸载和依赖关系，不承载 Agent 的具体能力。**

理解这一点是理解整个架构的关键：

- **插件向共享上下文贡献服务、类型化事件和可逆的副作用。** 产品的每一部分都是插件——包括模型适配器、工具注册表、会话日志，乃至 **agent loop（智能体循环）本身**，因此每一部分都可以从配置替换。
- **不存在需要打补丁的特权内核。** 扩展 dsh 的方式是把新插件**挂载到其他插件旁边**；而各项注册都是**副作用**，会在其插件卸载时自动撤销。这保证了插件的生命周期是干净、可逆的。

换句话说，dsh 没有一个「改坏了就得回滚内核」的中心，而是把「能力」分散到可独立上下的插件里，内核只做编排。

## 核心架构与 Cordis 插件系统

> ⚠️ 改动 `packages/` 下的任何内容之前，请先阅读官方架构文档。官方建议：直接用 Agent（智能体）去探索代码库并理解其架构。

### Profile 与组合包

运行中的 dsh 是**一棵插件树**，由启动时**按序叠加**的各层组合而成：

- **Profile（配置档）**：存放在 Harness home 中的具名组装。它列出自己要叠放的组合包，存放自己安装的树外插件，并保存用户自己的 `cordis.patch.yml`。`web` 和 `headless` 作为模板随发行版交付。
- **组合包（Bundle）**：Cordis 配置项及其挂载代码的分发格式，因此它插入的内容始终可被其上各层 patch。

两者都在各自的 `package.json` 中通过 `dsh` 字段声明自己：

| 字段 | 含义 |
|------|------|
| `dsh.profile` | 列出一个 profile 的组合包 |
| `dsh.bundle` | 指向一个组合包的 patch 文件 |

三个基础发行档（layer）：

| 发行档 | 作用 |
|--------|------|
| `dsh-base` | 每个 profile 的**第一层**：模型适配器、工具、持久化、沙箱与审批策略、设置、凭据、遥测 |
| `dsh-web-app` | 增加**浏览器应用** |
| `dsh-headless` | 增加**一次性运行器**，且完全不带服务器 |

**各层的叠加顺序**（应用在空条目列表之上）：

1. 先按 profile 列出的顺序应用每个组合包；
2. 然后应用 profile 的 `cordis.patch.yml`；
3. 然后是 home 级的那份；
4. 最后是任意 `--patch overlay`。

一条 patch 按 `id` 定位某个条目并**替换其整个 config**，或**插入新条目**。要查看你机器上实际启动的配置树：

```bash
dsh --profile web --dump-config
```

它打印出的任何条目，都可以由你自己的 patch 替换。组装机制见官方 `app-boot` 文档，配置字段见生成的配置目录。

### 核心包一览

以下是向 Cordis 树贡献内容的部分核心包：

| 包 | 职责 | ctx 键 |
|----|------|--------|
| `core/session` | 仅追加的 SessionEvent 日志和内存存储 | `ctx.sessions` |
| `core/system-prompt` | 提示词片段与工具 schema 的组装 | `ctx.systemPrompt` |
| `core/tools` | 作用域化的工具注册表和带把关的执行流水线 | `ctx.tools` |
| `core/agent` | Agent 接口、活跃 agent 注册表和 `agent/*` 事件 | `ctx.agents` |
| `core/agent-loop` | 实现该接口的默认驱动器 | `ctx.agentLoop` |
| `core/scope` | 按 agent 划分作用域的注册原语库 | 无 ctx 键 |
| `llm/llm` | 消息与流式词汇表，以及适配器 seam | `ctx.llm` |

## 事件系统与轮次流程

**事件就是扩展点**，而选对事件域是大多数改动的第一个决定。dsh 有三类事件：

- **会话事件**：追加到日志并通过 `session/event` 广播的**持久事实**。当某个事实必须在重新加载后仍然存在时，使用它。
- **Agent 事件（`agent/*`）**：携带活跃 Agent——inbox、步骤、状态、请求、验证、续跑。要**观察或拦截进行中的工作**时使用它。
- **能力事件**：无需导入循环即可向某个 seam（`fs/*`、`tools/*`、`telemetry/*`）附加策略和适配器。

### 轮次流程（Turn Flow）

**一个步骤（step）= 一次模型请求 + 它调用的工具。一个轮次（turn）包含零个或多个步骤**：它在领取首条输入之前打开，并在不再欠下任何工作时关闭。整体流程如下：

```text
turn/start
  → 领取 next-step 输入（外加一条排队消息）
  → 组装 prompt 片段 + 工具 schema
  → agent/pre-step（reject | enter(messages)）
      reject，或首次 enter 被改写为空 → 关闭一个不含步骤的轮次
  step/start
  → 把 enter 的消息追加为 user/message
  → 从日志派生模型历史
  agent/request → llm/stream → assistant/chunk* → assistant/message
  tool/call* → tools/pre-execute → tools/execute → tools/post-execute → tool/result*
  step/end
  工具还欠一次请求，或 next-step 输入到达 → 领取 → 进入下一步
  → agent/turn-stopping
turn/end
```

其中 `turn/*`、`step/*`、`user/message`、`assistant/*` 和 `tool/*` 是**持久会话事件**；其余是分属三个事件域的**实时扩展点**。`agent/pre-step`、`agent/request`、`llm/stream` 和三个 `tools/*` 事件是 **waterfall（瀑布式事件）**，其监听器必须调用 `next()` 才能委托下去；而 `agent/turn-stopping` 是 **serial 事件**，没有 `next()`。

输入通过同一个 inbox 到达驱动器。有些消息会立即唤醒它；注入的上下文会留在 inbox 中，直到另一条消息将其唤醒。`agent/pre-step` 决定模型看到什么：监听器可以**改写已领取的消息**，也可以直接**拒绝**它们；首次领取被拒绝或被改写为空时，仍会关闭一个不含步骤的持久轮次，因此日志会记录这次尝试。每个步骤读取插件注册的提示词片段和工具 schema。

## 会话日志与模型可见性

会话日志是**模型所见上下文的来源**。`deriveMessages()` 从中投影出模型历史，原始 `assistant/chunk` 事件则保证回放和 UI 保真。fork、恢复、transcript（文本记录）、遥测和持久化都派生自该事件流。

> **模型可见即已记录。** 抵达模型请求的一切都必须能从日志重建，并由一项运行时不变量断言这一点。

因此，**新增一项模型可见输入就需要新增一个会话事件**：扩展 `SessionEventMap` 并从日志渲染。这是「运行有迹可循」在设计层面的直接体现——日志不是事后补记，而是模型上下文的唯一事实来源（single source of truth）。

## 能力 Seam 与扩展点

一个 **seam** 是一项可替换能力，包含三种角色：

1. **Service Definition**：声明接口；
2. **Service Provider**：实现该接口；
3. **Consumer**：使用它（通常是面向模型的工具）。

一个包可以合并承担多个角色，但单一角色本身不构成一个 seam；**添加一项能力意味着把三者一并设计**。

seam 正是「替换一个提供方就能改变整个产品」的原因：

- 文件系统与进程提供方共享同一个执行世界，因此把它们指向**远程沙箱**，也就把 Bash、PTY 和 LSP 一并搬了过去，无需提供方专用 fork。
- subagent 提供方在同一个接口之后同样千差万别：从**新建一个子 agent**，到**把一个轮次委派给另一个产品**。
- 实验性的 **Agent Teams** 是 `ctx.agentTeams` 上的私有显式启用协作 seam，在可继续 subagent 之上提供持久 roster、任务板和 mailbox。

### 新行为该放在哪里

新行为附加到**已有文档记录的扩展点**。下表把常见目标映射到对应机制（改动循环本身时，本映射随之更新）：

| 目标 | 机制 |
|------|------|
| 添加模型提供方 | 在 `ctx.llm` 上注册其适配器 |
| 添加面向模型的能力 | 在 `ctx.tools` 上注册；其 schema 加入提示词组装 |
| 让某个会话拥有不同能力集合 | 组装一个 agent preset（服务行需要 `isolate realm`） |
| 添加 shell 执行 | 注册 `ctx.shell` 后端；本地后端通过 `ctx.subprocess` spawn 进程 |
| 添加持久化终端执行 | 注册 `ctx.terminals` 后端和 `dsh-tool-terminal` |
| 添加用户命令 | 在 `ctx.commands` 上注册；它无需模型轮次即可分派 |
| 添加后台工作 | 在 `ctx.jobs` 上注册；`job_*` 工具负责收集或停止 |
| 添加文件系统访问或策略 | 注册 `ctx.fs` 提供方，或监听 `fs/*` 事件 |
| 限制所启动的进程 | 使用 `ctx.sandbox` 后端；消费方在启动进程前包装 argv |
| 拦截请求、工具或轮次 | 使用相应的 `agent/*` 或 `tools/*` 事件；`agent/turn-stopping` 会停止轮次 |
| 添加模型可见上下文 | 调用 `agent.inject()`；它会落到下一次获准的请求中 |
| 添加 UI 或编辑器集成 | 驱动 `ctx.agents` 并从 `session/event` 渲染 |
| 添加 Web Client Chat 节点 | 注册 `ConversationNodeDefinition` + keyed renderer |
| 添加持久会话状态 | 扩展 `SessionEventMap`；从日志渲染和回放 |
| 生成会话标题 | 注册唯一的 `ctx.sessionTitle` 提供方 |
| 管理同会话目标 | 使用 `ctx.goals`；通过 `agent/*` 续跑 |
| fork 活跃会话 | `ctx.sessions.fork(source, boundary?, childSessionId?)` |
| 将注册项限定到单个 agent | 使用该 agent 的 `agent.ctx` |

## 多种运行模式

dsh 提供多种运行模式，覆盖从完整编码到最小化基准测试、再到自定义 preset 创作的不同场景：

| 模式 | 说明 |
|------|------|
| **标准模式** | 功能完整的编码 Agent，支持文件编辑、Shell、文件与网页检索、Skills、计划、目标、子代理和工作流。 |
| **PTC 模式** | 具备标准模式的全部能力，并通过 **Code Mode SDK** 呈现工具，让模型用一个 **TypeScript 程序**组合多步操作——即由模型生成一段代码来组合多轮工具调用。 |
| **极简模式** | 仅提供**持久 bash** 与 **str_replace_editor** 的双工具编码 Agent，用于最小化环境下的模型基准测试。 |
| **创造模式** | 用于创建自定义 Agent preset：具备标准模式的全部能力，并提供运行时检查、插件实验和 preset 创作指导。 |

标准模式提供完整的工具组合；PTC 模式把「多轮工具调用」抽象成一段模型生成的代码；极简模式把环境压缩到两个工具以做干净的能力对比；创造模式则让你在运行时里检查、实验 Cordis 插件，并据此组合和创作新的模式。

## 安装与快速上手

### 快速体验

安装 Node.js 后，可通过 `npx` 直接启动 Web UI：

```bash
npx @deepseek-ai/dsh web
```

### 源码安装

获取完整项目源码，并按照仓库说明完成安装：

```bash
git clone https://github.com/deepseek-ai/deepseek-harness
```

### 查看启动配置树

安装后，先打印当前机器实际叠加出的插件/配置树，观察哪些条目可被你的 patch 替换：

```bash
dsh --profile web --dump-config
```

### 加入 DSH 插件生态

DeepSeek Harness 开发者预览版仍处于面向 Harness 开发者的测试阶段，核心插件和基础 API 将持续迭代。在开源、开放、可复用、可组合的基础设施之上，你可以编写自己的插件与组合包，参与 DSH 生态共建。

## 延伸阅读

- [DeepSeek Harness 官方页面（开发者预览版）](https://www.deepseek.com/harness/)
- [DeepSeek Harness 架构参考文档](https://deepseek-harness.github.io/deepseek-harness/reference/)
- [DeepSeek Harness GitHub 仓库](https://github.com/deepseek-ai/deepseek-harness)
- [Cordis 论文](https://www.deepseek.com/harness/)
