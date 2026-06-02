## 学习目标

完成本章后，你将能够：

- 理解 Codex 是什么以及它与传统 IDE 插件的区别
- 区分 Codex App（桌面端）和 Codex CLI（命令行）的适用场景
- 掌握 Codex 的核心能力矩阵和架构原理
- 将 Codex 与 Claude Code、Cursor、Copilot 进行场景化对比
- 准备好进入安装和首次使用阶段

## 学习路径

| 路径 | 适用人群 | 预计时间 | 内容 |
|------|----------|----------|------|
| **快速通道** | 有 AI 编码工具经验 | 10 分钟 | 跳过概念，直接看对比表和架构 |
| **完整路径** | 初次接触 AI 编码工具 | 20 分钟 | 从概念到能力的完整理解 |

## 什么是 OpenAI Codex

Codex 是 OpenAI 推出的**桌面端为主、CLI 为辅的 AI 编程代理**。与传统的代码补全工具不同，Codex 是一个能够自主理解项目结构、规划任务、执行终端命令、读写文件、并在遇到错误时自我修正的**智能体（Agent）**。

Codex 由 OpenAI 的 o-series 和 GPT 系列模型驱动，支持跨平台的桌面应用（Windows/macOS）和命令行版本。作为 OpenAI 官方的编程工具，Codex 与 ChatGPT 订阅体系深度打通，提供了一致的账号和额度体验。

## Codex App vs Codex CLI

Codex 提供两种工作模式，理解它们的区别是高效使用 Codex 的第一步：

| 维度 | Codex App（桌面端） | Codex CLI（命令行） |
|------|---------------------|---------------------|
| **定位** | **主力工具**，完整的桌面体验 | 辅助工具，轻量级终端操作 |
| **安装方式** | Microsoft Store / macOS 下载 | npm 全局安装 |
| **交互界面** | 独立窗口，富文本对话 + 文件预览 | 终端内纯文本交互 |
| **项目感知** | 自动检测打开的项目文件夹 | 需要 `cd` 到项目目录 |
| **多线程** | 支持多个并行对话线程 | 单一对话会话 |
| **离线能力** | 部分功能支持本地模型 | 纯云端 |
| **适用场景** | 日常开发主界面 | CI/CD、自动化脚本、SSH 环境 |
| **推荐用法** | **日常主力** | 辅助 + 自动化场景 |

> **核心建议**：Codex App 是 OpenAI 的主推产品形态。如果你只需要一个工具，选 App。CLI 更适合作为 CI/CD 流水线中的自动化节点或在远程服务器上使用。

## 核心能力全景

### 代码生成（Code Generation）

从自然语言描述生成完整的功能模块、文件结构和配置：

```
# 在 Codex 对话中输入
"创建一个 FastAPI 后端，包含用户注册、登录、JWT 认证，
使用 SQLAlchemy ORM 连接 PostgreSQL，包含请求参数校验。"
```

Codex 会生成 `main.py`、`models/user.py`、`schemas/auth.py`、`routers/auth.py`、`middleware/auth.py`、`requirements.txt` 等完整文件。

### 代码审查（Code Review）

将 git diff 粘贴到 Codex 对话中，让它作为"虚拟审阅者"检查代码变更：

```
"Review this diff, focus on:
1. Security: injection risks, missing auth checks
2. Performance: N+1 queries, memory leaks
3. Error handling: missing try-catch, unhandled rejections
请用中文列出发现的问题和修复建议。"
```

### 代码重构（Refactoring）

Codex 能理解完整的调用链和类型关系，安全地进行大规模结构变更：

```
"请将 src/services/order.py 中的 process_order 函数拆分为多个独立函数。
每个函数不超过 50 行，单一职责，保持所有现有测试通过。"
```

### Bug 调试（Debugging）

粘贴错误日志和堆栈信息，Codex 会追踪代码执行路径并定位根因：

```
"运行 pytest 时遇到错误：
FAILED tests/test_payment.py::test_refund - TypeError: 'NoneType' object is not subscriptable
请读取 src/services/payment.py 分析根因并给出修复方案。"
```

### 终端操作（Terminal Operations）

Codex 可以直接执行构建、部署、数据库迁移、依赖管理等 Shell 命令，支持读写文件系统和完整的命令执行。

### 文档生成（Documentation）

自动为函数、类、模块生成注释，或从零编写 README、API 文档。

### 测试编写（Testing）

根据实现代码生成单元测试、集成测试，覆盖边界条件和异常路径。

## 架构原理：Agent Loop

理解 Codex 的工作机制有助于更好地驾驭它。其核心是一个**感知-思考-行动-反馈**的循环：

```
┌─────────────────────────────────────────────────┐
│              Codex Agent Loop                     │
│                                                   │
│  1. 感知（Sense）                                 │
│     ├── 解析用户意图和指令                        │
│     ├── 索引项目文件结构和依赖关系                 │
│     └── 加载项目配置（.codex/ 目录）              │
│          ↓                                        │
│  2. 规划（Plan）                                  │
│     ├── 将高层目标拆解为原子子任务                 │
│     ├── 确定执行顺序和依赖关系                     │
│     └── 选择工具：读文件 / 写文件 / 跑命令         │
│          ↓                                        │
│  3. 执行（Act）                                   │
│     ├── 通过工具调用接口执行操作                   │
│     ├── 读写项目文件、执行 Shell 命令              │
│     └── 获取执行结果和输出                        │
│          ↓                                        │
│  4. 评估（Evaluate）                              │
│     ├── 分析执行结果是否符合预期                   │
│     ├── 判断任务是否完成                          │
│     └── 如果出错 → 回到步骤 2 自动修正             │
└─────────────────────────────────────────────────┘
```

关键特征：

- **自主规划**：Codex 会将"实现用户认证功能"自动拆解为"创建数据模型 → 设计 API 端点 → 编写中间件 → 添加测试"
- **失败重试**：命令执行失败时，Codex 会读取错误信息、分析原因、调整方案、自动重试
- **上下文累积**：整个对话过程中，Codex 保持对项目状态的完整理解

## 模型支持

Codex 支持 OpenAI 的多个模型系列：

| 模型系列 | 适用场景 | 特点 |
|----------|----------|------|
| **o-series** (o3, o4-mini) | 复杂推理、架构决策、高难度调试 | 深度思考，响应可能较慢 |
| **GPT-5** | 日常开发主力 | 速度和能力的平衡点 |
| **GPT-4.1** | 成本敏感场景、批量操作 | 性价比高 |
| **本地模型** | 离线场景、隐私敏感 | 仅 App，部分功能受限 |

## 与其他工具的对比

| 维度 | Codex | Claude Code | GitHub Copilot | Cursor |
|------|-------|-------------|----------------|--------|
| **开发商** | OpenAI | Anthropic | GitHub/Microsoft | Cursor Inc. |
| **产品形态** | **桌面 App 为主** | CLI 为主 | IDE 插件 | AI-first IDE |
| **交互方式** | 对话式 + 富文本预览 | 终端内对话式 | 内联补全 + 聊天面板 | 内联编辑 + 聊天 |
| **自主性** | 高（自主规划执行修正） | 高（自主规划执行修正） | 低（补全为主） | 中（可执行命令） |
| **代码库理解** | 全量索引 | 全量索引 | 当前文件 + 打开标签页 | 代码库索引 |
| **终端能力** | 完整 Shell 访问 | 完整 Shell 访问 | 无 | 内置终端 |
| **权限模型** | 分级确认 | 分级确认 | IDE 内预览 | 修改预览 |
| **IDE 集成** | 独立 App + VS Code 扩展 | 独立运行 | VS Code / JetBrains 插件 | 独立 IDE |
| **离线能力** | 部分（本地模型） | 无 | 无 | 无 |
| **价格模型** | ChatGPT 订阅 + API | API 按量计费 | 订阅制 | 订阅制 |

**选型建议**：

- **桌面端主力 + 离线需求** → Codex App
- **终端深度用户 + Anthropic 生态** → Claude Code
- **IDE 内轻量补全** → GitHub Copilot
- **想要 AI-first 的完整 IDE** → Cursor

实际上，许多开发者会**组合使用**：Codex 做深度开发，Copilot 做日常补全，Claude Code 做代码审查的第二意见。

## Codex 的独特优势

1. **桌面端优先体验**：独立 App 提供富文本预览、文件树、多线程对话等 IDE 级体验，不依赖终端
2. **ChatGPT 生态整合**：与 ChatGPT 订阅打通，共享对话历史和使用额度
3. **多线程并行**：可以同时开启多个对话线程，分别处理不同的任务
4. **本地模型支持**：App 版可运行本地模型进行离线操作，保护代码隐私
5. **Commands 系统**：通过 `/commands` 快速调用常见操作，也支持自定义扩展
6. **Skills 工作流**：可复用的工作流模板，类似 IDE 中的代码片段但支持多步骤操作
7. **MCP 集成**：通过 Model Context Protocol 连接外部工具和数据源

## 快速预览：5 分钟上手

如果你已安装 Codex（详见下一章安装指南），以下是快速体验流程：

```bash
# 1. 启动 Codex App 或 CLI
codex

# 2. 第一个指令
"请分析当前目录的项目结构，告诉我这是什么类型的项目"

# 3. 尝试代码生成
"创建一个简单的 Python 脚本 hello.py，打印当前系统信息"

# 4. 让 Codex 运行它
"请运行 hello.py 看看效果"

# 5. 探索 Commands
/help  # 查看所有可用命令
```

## 下一步

在理解了 Codex 的核心概念后，按以下顺序继续学习：

1. **安装与认证**：在本地完成 Codex App 或 CLI 的安装和 OpenAI 账号登录
2. **Commands 与工作流**：掌握 Codex 的命令系统和日常开发工作流
3. **Skills 与 MCP**：学习创建自定义技能和连接外部工具
4. **进阶实战**：Subagents、Plugins 和企业级部署策略
