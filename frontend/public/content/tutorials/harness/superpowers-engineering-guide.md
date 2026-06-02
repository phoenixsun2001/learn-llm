# AI 工程化编程全流程实战：Superpowers 框架指南

## 为什么 AI 编程需要工程纪律

很多人装上 Codex 或 Claude Code 后，第一件事就是直接让 AI 写代码。这看似高效，但产出的代码往往杂乱、难以维护、缺乏测试、边界条件处理不完整。

根本原因在于：**AI 是一个需要清晰约束才能发挥能力的工具**。在传统软件开发中，我们会先写需求文档、设计文档、测试用例，然后才进入编码。但在 AI 编程场景中，大多数人跳过了这些步骤，默认"AI 能自动理解一切"。

Superpowers 框架解决的就是这个问题。它通过 **14 个可组合的 Skills** 给 AI 套上工程纪律，让 AI 从"随机生成代码"变成"守流程的工程师"。

> 核心链路：需求澄清 → 设计确认 → 计划拆解 → 隔离开发 → TDD → Review → 验证 → 收尾

---

## Codex Desktop App 快速配置

在深入 Superpowers 之前，你需要先有一个可用的 AI 编程环境。Codex Desktop App 是推荐的客户端之一。

### 核心概念

Codex 不是"更会写代码的 ChatGPT"。它的工作对象是**一个项目**，能在你的文件系统里创建、修改、管理代码文件。

两个核心概念：

- **对话（Conversation）**：任务沟通窗口，类似聊天界面，用来提需求、追问、调整方案。
- **项目（Project）**：对应电脑里的文件夹或代码仓库，Codex 在这里实际生成和修改文件。

比如让 Codex 做一个网页，它不会只在聊天框里返回代码，而是直接在项目文件夹里创建 `index.html`、`style.css`、`script.js` 等文件。

### 三步启动

1. **下载安装**：macOS 下载 .dmg 安装包，Windows 通过微软应用商店安装。
2. **配置 API Key**：注册账号获取 API 密钥，通过终端执行配置脚本。如果之前已使用过 Codex CLI，桌面版通常会自动读取已有配置。
3. **切换中文界面**：File → Settings → General → Language → 中文（中国）。

详细的安装步骤、认证流程和故障排除，请参考 Codex 安装教程。

---

## Superpowers 框架概述

### 设计理念

Superpowers 是一套为 AI 编程智能体（Codex、Claude Code、Cursor 等）设计的工程化开发工作流框架。核心思路是：**让 AI 在编写代码时自动遵循最佳实践，而不是随意生成**。

### 四层架构

Superpowers 采用分层架构，以 Skills 作为核心抽象：

| 层级 | 职责 | 代表 Skills |
|------|------|------------|
| **入口与规则** | 总调度，确保不会跳过流程 | using-superpowers |
| **需求到计划** | 从模糊想法到可执行方案 | brainstorming、writing-plans、using-git-worktrees |
| **执行与质量控制** | 编码、测试、审查 | subagent-driven-development、test-driven-development、requesting-code-review |
| **调试、验证、收尾** | 修 Bug、跑验证、合并代码 | systematic-debugging、verification-before-completion、finishing-a-development-branch |

每个 Skill 都是轻量的 YAML Frontmatter + Markdown 文件，支持覆盖机制，开发者可按团队规范自定义。

---

## 核心创新：Subagent-Driven Development

在长对话 AI 编码中，**上下文污染**是最常见的问题。随着对话轮次增加，早期决策持续影响后续输出，模型可能沿着错误方向越走越远。

Subagent-Driven Development（子智能体驱动开发）通过四个机制解决这个问题：

1. **上下文隔离**：每个子智能体从全新上下文启动，只接收当前任务描述。
2. **职责分离**：实现子智能体负责编码，审查子智能体负责质量检查。
3. **快速重试**：审查未通过时，直接创建新子智能体重新实现。
4. **并行执行**：相互独立的任务可分发给多个子智能体并行处理。

### 两阶段代码审查

Subagent-Driven Development 的审查被拆分为两个独立阶段，避免传统审查中"关注点混杂"的问题：

**第一阶段：Spec Review（规范合规审查）**

核心问题："这个实现是否满足需求？"
- 是否实现了所有要求的功能点
- 边界条件是否处理
- 测试是否覆盖规范要求
- 不关注代码风格或实现细节

**第二阶段：Code Quality Review（代码质量审查）**

核心问题："这个实现是否易读、可维护？"
- 是否遵循项目代码风格
- 是否存在重复代码（DRY 原则）
- 命名是否清晰
- 是否出现过度工程化

### 两种执行模式

| 维度 | Subagent-Driven | Executing Plans (Inline) |
|------|----------------|--------------------------|
| **适用场景** | 需求明确 + 测试完整 | 探索性开发 + 频繁调整 |
| **上下文** | 每任务独立隔离 | 共享会话上下文 |
| **审查** | 自动两阶段审查 | 人工决策节点 |
| **并行能力** | 支持多任务并行 | 顺序执行 |

选择建议：需求明确、测试完备时用 Subagent-Driven；探索性开发、需要频繁调整时用 Executing Plans。

---

## 关键 Skills 解读

以下是日常开发中最核心的 6 个 Skills：

### 1. brainstorming — 需求澄清

在写任何代码之前，先理解项目上下文、逐一提问确认需求、提出 2-3 个方案、分段展示设计获得确认，然后写成 spec 文档。**铁律：设计获批前禁止写代码**。

### 2. writing-plans — 任务拆解

把 spec 变成可执行的详细计划。计划必须包含：要改哪些文件、完整代码、测试命令、预期输出、每个任务 2-5 分钟小步骤。**禁止 TBD/TODO 这类空话**。

### 3. test-driven-development — TDD 铁律

最硬核的 Skill。**铁律：没有先失败的测试，就不能写生产代码**。完整 RED-GREEN-REFACTOR 循环：先写失败测试 → 写最小实现使其通过 → 重构保持绿色。

### 4. requesting-code-review — 审查请求

任务完成后派 reviewer subagent，用精确上下文而非整个 session 历史。反馈按 Critical / Important / Minor 分级，Critical 必须立即修复。

### 5. verification-before-completion — 验证收尾

**铁律：没有刚运行过的验证证据，就不能说"完成"**。识别验证命令 → 运行完整命令 → 读取输出和退出码 → 报告真实状态。这是防止"AI 过早宣布成功"的关键 Skill。

### 6. finishing-a-development-branch — 分支收尾

先跑测试（不过不能进 merge/PR），然后给用户结构化选项：本地 merge / 创建 PR / 保留分支 / 丢弃。**丢弃必须用户明确确认**。

---

## 实战工作流：从需求到交付

下面是一个完整的开发流程，展示了 Skills 如何串联使用：

### 第一步：Brainstorm（头脑风暴）

告诉 AI 你想做什么。brainstorming Skill 会驱动 AI 先提问澄清需求，而不是急于写代码。AI 会提出多个方案，你选择方向后，它输出 spec 文档。

### 第二步：Git Worktree（环境隔离）

在写任何代码之前，using-git-worktrees 会创建独立的 Git Worktree，确保：
- 不影响主分支
- 工作区干净，没有未提交改动
- 依赖已安装，baseline 测试已通过

### 第三步：Plan（任务拆解）

writing-plans 把 spec 拆解为 2-5 分钟的小步骤。每个步骤包含：具体文件路径、预计改动内容、验证命令、预期输出。这份计划会成为子智能体的执行脚本。

### 第四步：Implement with TDD（测试驱动实现）

Subagent-Driven Development 逐任务执行：
1. 派 implementer subagent（从干净上下文开始）
2. test-driven-development 强制 RED → GREEN → REFACTOR
3. 测试失败先确认因正确原因失败，再写生产代码
4. 每个任务完成后 commit

### 第五步：Two-Phase Review（两阶段审查）

每个任务实现完成后自动触发：
1. **Spec Reviewer** 检查是否满足需求
2. **Code Quality Reviewer** 检查代码质量
3. 任一阶段不通过 → 创建新 subagent 重新实现

### 第六步：Verify & Finish（验证与收尾）

verification-before-completion 确保所有验证命令被新鲜运行。finishing-a-development-branch 提供结构化的收尾选项（merge/PR/保留/丢弃）。

---

## 采用建议

### 是否必须使用 Superpowers？

分三层看：

| 层面 | 判断 |
|------|------|
| **技术层面** | 不必须。没有它 AI 也能写代码。 |
| **工程质量** | 复杂项目强烈建议。能减少"AI 自信但没验证"的问题。 |
| **规则层面** | 一旦启用就是 mandatory workflows，不是 suggestions。 |

### 实践 Tips

1. **从轻开始**：不用一次性启用全部 14 个 Skills。先装 using-superpowers、brainstorming、verification-before-completion 这三个，体验"有纪律的 AI"是什么感觉。
2. **重项目、轻任务**：大型项目默认启用完整流程；一次性脚本、原型探索可显式跳过。
3. **根据自己的业务定制**：Skills 支持覆盖机制。把团队的代码规范、审查清单写成自定义 Skill，让 AI 遵守团队约定。
4. **经常更新**：Superpowers 是活跃项目，定期拉取最新版本，同时将自己的实践经验反馈到自定义 Skills 中。
5. **逐步升级**：当发现"AI 经常跳过验证"或"代码质量不稳定"时，再去启用对应的 Skill。

---

## 总结

Superpowers 不是"必须安装的工具"，而是**值得采用的 AI 编程纪律框架**。它特别适合以下目标：

- 让 AI 像守流程的工程师一样工作，而非随机生成代码
- 减少"AI 自信但没验证"导致的线上事故
- 建立可复现的 AI 辅助开发流程，方便团队协作

14 个 Skills 覆盖了从需求到交付的完整生命周期，核心价值在于它们串联起来形成的工程链路，而非某个单独的 Skill。

下一步：参考本文的实战工作流，在你的下一个项目中启用 brainstorming + verification-before-completion，体验工程纪律给 AI 编程带来的变化。
