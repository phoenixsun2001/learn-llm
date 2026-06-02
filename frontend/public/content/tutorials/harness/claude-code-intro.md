## 什么是 Claude Code

Claude Code 是 Anthropic 推出的一款**基于 Agent 架构的命令行 AI 编程工具**。它不是聊天机器人，也不仅仅是代码补全插件——它是一个能自主理解代码库、规划任务、执行终端命令、读写文件、并在遇到错误时自我修正的**智能编程代理（Coding Agent）**。

与传统的"你问一句、AI 答一句"的交互模式不同，Claude Code 以**工具调用（Tool Use）**为核心：它拥有文件系统访问能力、Shell 命令执行能力、代码搜索能力，可以在一次对话中完成"读取代码 → 分析问题 → 修改多个文件 → 运行测试 → 查看结果 → 修正错误"的完整闭环。

它基于 Claude 系列大语言模型（由 Anthropic 开发），支持几乎所有主流编程语言，尤其擅长 JavaScript/TypeScript、Python、Go、Rust、Java 等。无论是前端页面、后端 API、数据管道还是基础设施脚本，Claude Code 都能胜任。

## 核心架构：Agent Loop 详解

理解 Claude Code 的工作原理，有助于你更好地驾驭它。它的核心是一个**感知-思考-行动-反馈（Sense-Think-Act-Feedback）**的循环：

```
┌─────────────────────────────────────────────────┐
│                  Agent Loop                       │
│                                                   │
│  1. 感知（Sense）                                 │
│     ├── 读取用户输入的指令                         │
│     ├── 扫描项目文件结构和关键代码                  │
│     └── 加载 CLAUDE.md 中的项目规范                │
│          ↓                                        │
│  2. 思考（Think）                                 │
│     ├── Claude 模型分析任务意图                    │
│     ├── 规划需要执行的操作步骤                     │
│     └── 决定调用哪些工具（读文件/写文件/跑命令）    │
│          ↓                                        │
│  3. 行动（Act）                                   │
│     ├── 在本地执行 Shell 命令                      │
│     ├── 读写项目文件                              │
│     └── 返回执行结果给模型                         │
│          ↓                                        │
│  4. 反馈（Feedback）                              │
│     ├── 模型分析执行结果                           │
│     ├── 判断任务是否完成                           │
│     └── 如果出错或未完成 → 回到步骤 2              │
└─────────────────────────────────────────────────┘
```

这个循环的关键特征：

- **自主规划**：Claude 会将"实现用户登录功能"这样的高层目标自动拆解为"创建路由 → 编写控制器 → 设计数据库 Schema → 添加中间件 → 编写测试"等子任务。
- **失败重试**：如果执行某个命令报错，Claude 会读取错误信息，分析原因，调整方案，然后重试——不需要你来告诉它"报错了，你换个方法试试"。
- **上下文持续累积**：在整个对话过程中，Claude 记忆所有的文件修改和执行结果，始终能理解"当前项目处于什么状态"。

## 核心能力全景

Claude Code 覆盖了软件开发的完整生命周期。以下是它的核心能力矩阵：

### 代码生成（Code Generation）

从零创建整个功能模块。你可以用自然语言描述需求，Claude 会生成完整的代码文件、目录结构和配置。

```bash
# 示例：在 Claude Code 对话中输入
"帮我创建一个 Express.js REST API，包含用户注册和登录功能。
使用 JWT 认证，数据存储用 SQLite，包含参数校验和错误处理。"
```

Claude 会生成 `package.json`、`server.js`、`routes/auth.js`、`middleware/auth.js`、`models/user.js` 等完整文件。

### 代码审查（Code Review）

在提交代码前，让 Claude 作为"虚拟审阅者"检查代码变更。

```bash
# 将 git diff 通过管道传给 Claude 进行审查
git diff main...HEAD | claude -p "Review this diff. Focus on:
1. Security vulnerabilities (injection, XSS, auth bypass)
2. Performance issues (N+1 queries, memory leaks)
3. Code style and maintainability
请用中文列出发现的问题和修复建议。"
```

### 代码重构（Refactoring）

大规模修改代码结构而不改变外部行为。Claude 能理解整个调用链，安全地重命名、拆分函数、提取公共逻辑。

### Bug 调试（Debugging）

粘贴错误日志和堆栈信息，Claude 会追踪代码执行路径，定位根因。

```bash
# 将错误日志通过管道传给 Claude
cat error.log | claude -p "分析这个错误日志，找出根因并给出修复方案。
相关代码在 src/services/payment.js 中。"
```

### 文档生成（Documentation）

自动为函数、类、模块生成注释，或从零编写 README、API 文档。

### 测试编写（Testing）

根据实现代码生成单元测试、集成测试，覆盖边界条件和异常路径。

### 终端操作（Terminal Operations）

执行构建、部署、数据库迁移、依赖管理等任何你能在终端中做的事情。

## 与其他工具的对比

| 维度 | Claude Code | GitHub Copilot | Cursor | OpenAI Codex CLI |
|------|-------------|----------------|--------|------------------|
| **定位** | Agent 型 CLI 编程助手 | IDE 代码补全插件 | AI-first IDE | CLI 编程工具 |
| **交互方式** | 对话式，多轮迭代 | 内联补全 + 聊天面板 | 内联编辑 + 聊天 | 对话式 |
| **自主性** | 高（自主规划、执行、修正） | 低（以补全为主） | 中（可执行命令） | 中高 |
| **代码库理解** | 全量索引，深度理解 | 当前文件 + 打开标签页 | 代码库索引 | 代码库索引 |
| **终端能力** | 完整 Shell 访问 | 无 | 内置终端 | 完整 Shell 访问 |
| **权限模型** | 分级确认（读/写/执行） | IDE 内预览 | 修改预览 | 分级确认 |
| **适用场景** | 复杂多文件任务 | 日常编码补全 | 日常编码 + 轻度重构 | 复杂多文件任务 |
| **模型** | Claude Sonnet/Opus | GPT-4o / Claude | 多种模型可选 | GPT-4o / o-series |

**选型建议**：

- **日常编码补全** → Copilot 或 Cursor（即时响应，低侵入性）
- **复杂多文件重构/新功能开发** → Claude Code（自主规划 + 全代码库理解）
- **轻量级 AI 编码** → Cursor（兼顾 AI 能力和 IDE 体验）
- **与 OpenAI 生态深度绑定** → Codex CLI

实际上，许多高效开发者会**组合使用**：日常编码用 Copilot 补全，遇到复杂任务时切到 Claude Code 进行深度协作。

## 支持的模型与切换

Claude Code 支持多种 Claude 模型，按能力和成本排序：

| 模型 | 适用场景 | 相对成本 |
|------|----------|----------|
| **Claude Sonnet** | 日常开发、快速迭代（推荐默认选择） | 中 |
| **Claude Opus** | 复杂架构决策、高难度调试、深度分析 | 高 |
| **Claude Haiku** | 简单任务、批量处理、成本敏感场景 | 低 |

在 Claude Code 中切换模型：

```bash
# 启动时指定模型
claude --model claude-sonnet-4-20250514

# 或在对话中使用 /model 命令切换
/model opus
```

一般情况下，**Sonnet 是最佳平衡点**——速度快、能力强、成本适中。只有在处理特别复杂的架构问题或需要极深代码理解时才切换到 Opus。Haiku 适合批量修改、简单格式化、注释生成等低成本场景。

## Claude Code 的独特优势

总结 Claude Code 与其他 AI 编程工具的核心差异：

1. **真正的 Agent 自主性**：不是"你点一下、AI 动一下"，而是"你给出目标，AI 自主规划并执行完整个任务链"。
2. **完整代码库上下文**：不只看到你打开的文件，而是索引整个项目，理解模块间的依赖关系和调用链。
3. **CLAUDE.md 项目规范**：通过项目根目录的 CLAUDE.md 文件，你可以教会 Claude 你的技术栈偏好、编码规范、架构约定——它会在每次对话中自动遵守。
4. **Hooks 扩展机制**：通过 Hooks 系统，你可以在 Claude 执行特定操作前后自动触发自定义脚本（如自动格式化、运行测试、安全检查）。
5. **IDE 无关**：因为运行在终端中，你可以配合任何编辑器使用（VS Code、Vim、JetBrains、Emacs 等），不受特定 IDE 生态限制。
6. **权限分级控制**：读写文件、执行命令等操作都有明确的权限确认机制（Allow/Deny/Always Allow），让你始终掌控代码变更。

## 快速体验：5 分钟上手

如果你已经安装了 Claude Code（详见下一章安装配置），以下是一个 5 分钟的快速体验流程：

```bash
# 1. 创建一个实验项目
mkdir hello-claude && cd hello-claude

# 2. 初始化一个 Node.js 项目
npm init -y

# 3. 启动 Claude Code
claude

# 4. 在对话中输入第一个指令
"请创建一个简单的 HTTP 服务器 server.js，
监听 3000 端口，返回 'Hello from Claude Code!'
使用 Node.js 内置的 http 模块，不引入第三方依赖。"

# 5. 让 Claude 帮你运行和测试
"请运行这个服务器，然后用 curl 测试它是否正常响应。"
```

几分钟内，你就完成了一个从零到运行的完整功能——这正是 Claude Code 的核心价值：**用对话驱动开发，大幅缩短"从想法到运行代码"的路径**。

## 下一步

在理解了 Claude Code 的核心概念后，建议按以下顺序继续学习：

1. **安装与配置**：在本地环境完成安装、API Key 配置和 IDE 集成
2. **第一个实战项目**：用 Claude Code 从零构建一个 Git Commit Message 生成器
3. **日常工作流**：掌握代码审查、重构、调试等真实场景的用法
4. **Hooks 自动化**：用 Hooks 系统构建自动化质量保障流水线
