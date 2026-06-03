## 学习目标

完成本章后，你将能够：

- 理解 Skills 与 Commands 的区别和各自优势
- 使用 Codex 内置 Skills 完成复杂工作流
- 从零创建、测试和分享自定义 Skills
- 通过 MCP (Model Context Protocol) 连接外部工具
- 构建一个完整的"代码审查 + GitHub PR"自动化 Skill

## 学习路径

| 路径 | 适用人群 | 预计时间 | 内容 |
|------|----------|----------|------|
| **快速通道** | 已有 Commands 经验 | 15 分钟 | Skills 速览 + MCP 配置 |
| **完整路径** | 需要系统学习 | 30 分钟 | 从概念到实战 Skill 的完整路径 |

## 什么是 Skills

Skills 是 Codex 的**可复用工作流模板**——与 Commands 不同，Skills 不仅可以包含多步骤操作，还可以定义输入参数、条件分支、与外部 MCP 工具的交互，以及执行后的后处理逻辑。

### Skills vs Commands

| 维度 | Commands | Skills |
|------|----------|--------|
| **复杂度** | 简单到中等 | 中等到复杂 |
| **结构** | 单一提示词模板 | 多步骤工作流 |
| **参数** | 简单位置参数 | 结构化参数 + 类型定义 |
| **条件逻辑** | 无 | 支持 if/else 分支 |
| **MCP 集成** | 间接 | 原生支持 |
| **复用性** | 项目内 | 可跨项目、可分享 |
| **适用场景** | 快速操作、日常快捷键 | 标准化工作流、团队规范 |

简单类比：Commands 是 IDE 的键盘快捷键，Skills 是 IDE 的"重构向导"——一个更快，一个更完整。

## 内置 Skills 概览

Codex 内置了以下常用 Skills：

| Skill | 功能 | 触发方式 |
|-------|------|----------|
| **Code Review** | 完整的代码审查工作流 | 选中代码 + "Code Review" |
| **Test Generator** | 自动生成单元测试框架 | "Generate tests for..." |
| **Doc Writer** | 生成 API 文档和 README | "Document this module" |
| **Refactor Assistant** | 引导式重构向导 | "Help me refactor..." |
| **Bug Hunter** | 系统性 Bug 排查流程 | "Debug this issue" |
| **PR Writer** | PR 描述生成器 | "Create PR description" |

### 使用内置 Skills

Skills 通过自然语言触发——Codex 会自动匹配最合适的 Skill：

```
"帮我做一次完整的代码审查，重点关注性能问题"
→ Codex 自动加载 Code Review Skill

"为这个模块生成完整的单元测试，包括边界条件"
→ Codex 自动加载 Test Generator Skill
```

如果不想依赖自动匹配，也可以显式调用：

```
/skill code-review
/skill test-generator
```

## 创建自定义 Skills

### Skill 文件结构

Skills 使用 Markdown 格式，存放在 `.codex/skills/` 目录：

```markdown
<!-- .codex/skills/api-review.md -->

# API Review Skill

## 描述
对 REST API 端点进行全面的安全性和设计审查。

## 参数
- `endpoint_file`: 需要审查的 API 文件路径（必填）
- `focus`: 审查重点，可选值：security, design, performance, all（默认：all）

## 工作流

### 步骤 1：加载上下文
1. 读取 `{endpoint_file}` 中的 API 定义
2. 读取关联的 schema/validation 文件
3. 列出所有端点和 HTTP 方法

### 步骤 2：安全检查
检查以下安全项：
- [ ] 所有端点是否都有认证中间件
- [ ] 输入参数是否有校验（类型、范围、长度）
- [ ] 是否防止 SQL/NoSQL 注入
- [ ] 敏感数据是否正确脱敏
- [ ] Rate limiting 是否配置
- [ ] CORS 配置是否安全

### 步骤 3：设计审查
检查以下设计项：
- [ ] RESTful 命名是否规范
- [ ] 错误响应格式是否统一
- [ ] 分页、排序、过滤参数是否标准化
- [ ] API 版本策略是否明确
- [ ] 是否有不必要的嵌套资源

### 步骤 4：生成报告
输出格式：
```
## API Review 报告

### 严重问题 (需立即修复)
...

### 警告 (建议改进)
...

### 建议 (可选的改进)
...

### 总结评分
安全性: X/10
设计质量: X/10
```
```

### Skill 参数系统

Skills 支持类型化的参数定义，让调用者明确所需输入：

```markdown
## 参数
| 名称 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `target_dir` | string | 是 | - | 要扫描的目录 |
| `file_pattern` | string | 否 | "*.py" | 文件匹配模式 |
| `max_issues` | int | 否 | 50 | 最大问题数 |
| `severity` | enum | 否 | "error" | 最低严重级别：error, warning, info |
```

### 条件分支

Skills 支持基于上下文的动态行为：

```markdown
## 条件逻辑

IF 项目使用 TypeScript:
  运行 `tsc --noEmit` 检查类型
ELSE IF 项目使用 Python:
  运行 `mypy` 检查类型
ELSE:
  跳过静态类型检查
```

## MCP (Model Context Protocol) 集成

MCP 是 Codex 连接外部工具和服务的标准协议。通过 MCP，Codex 可以访问数据库、操作 GitHub、查询 Jira、调用第三方 API 等。

### MCP 架构

```
Codex Agent
    │
    ├── MCP Client ──── MCP Server 1 (GitHub)
    │                   ├── 读取 PR
    │                   ├── 创建 Issue
    │                   └── 查看 CI 状态
    │
    ├── MCP Client ──── MCP Server 2 (Database)
    │                   ├── 查询数据
    │                   └── 执行迁移
    │
    └── MCP Client ──── MCP Server 3 (Jira)
                        ├── 读取 Ticket
                        └── 更新状态
```

### 配置 MCP 服务器

在 `.codex/mcp.json` 中配置 MCP 连接：

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

> **安全提醒**：不要在 `mcp.json` 中硬编码 Token 或密码。始终使用环境变量引用（`${VAR_NAME}`）。

### 在 Skills 中使用 MCP

```markdown
<!-- .codex/skills/pr-creator.md -->

# PR Creator Skill

## MCP 依赖
- `github`: 用于创建 PR、添加标签、请求 Review

## 工作流

### 步骤 1：生成 PR 内容
1. 分析 `git diff main...HEAD`
2. 生成 PR 标题（Conventional Commit 格式）
3. 生成 PR 描述（变更摘要 + 测试说明）

### 步骤 2：通过 MCP 创建 PR
使用 GitHub MCP Server:
1. 创建 PR（标题 + 描述 + base=main + head=current-branch）
2. 添加标签（根据变更类型：feat→enhancement, fix→bug）
3. 请求合适的 Reviewer

### 步骤 3：本地清理
1. 输出 PR URL 给用户
2. 记录 PR 编号到 .codex/pr-history.json
```

## 实战：创建代码审查 + GitHub PR Skill

以下是一个完整示例，将代码审查和 PR 创建串联为一个 Skill：

```markdown
<!-- .codex/skills/full-review.md -->

# Full Review & PR Skill

## 描述
综合 Skill：代码审查 → 自动修复 → 运行测试 → 创建 PR

## 参数
- `base_branch`: 目标分支（默认：main）
- `review_focus`: 审查重点（默认：all）

## MCP 依赖
- `github`: PR 操作

## 工作流

### 阶段 1：变更分析
1. 执行 `git diff {base_branch}...HEAD --stat` 获取变更概览
2. 列出所有变更文件，按模块分组
3. 识别高风险变更（数据库迁移、认证逻辑、配置文件）

### 阶段 2：代码审查
对每个变更文件：
- [ ] 安全漏洞检查（注入、XSS、认证绕过）
- [ ] 错误处理是否完善
- [ ] 是否有硬编码的密钥或敏感信息
- [ ] 命名是否清晰一致
- [ ] 是否有过长的函数（>50 行）
- [ ] 是否有可提取的重复代码

### 阶段 3：自动修复
对于 Confidence ≥ 90% 的问题，自动应用修复：
- 格式化问题（缩进、空行）
- 缺失的类型注解
- 未使用的导入

### 阶段 4：验证
1. 运行项目测试套件
2. 如果测试失败，分析原因并修复
3. 运行 Linter/Formatter

### 阶段 5：生成 PR
1. 生成 Conventional Commit 格式的 PR 标题
2. 生成结构化 PR 描述（变更概述、详细变更、测试、审查发现）
3. 通过 GitHub MCP 创建 PR
4. 输出 PR URL
```

## Skills 最佳实践

### 设计原则

1. **单一意图**：一个 Skill 解决一个明确的问题。"创建 PR"和"部署 Staging"应该是两个 Skill
2. **可发现性**：Skill 名称和描述应让团队成员一眼知道何时使用
3. **幂等性**：重复执行同一个 Skill 应产生一致的结果，不造成重复副作用
4. **渐进式复杂度**：Skill 应有一个"默认模式"（零配置可用）和"高级模式"（支持自定义参数）
5. **输出标准化**：每个 Skill 应输出结构化结果（JSON、Markdown 表格等）

### 文档规范

每个 Skill 文件应包含：
- **描述**（Description）：一句话说明 Skill 的功能
- **参数表**（Parameters）：输入参数的类型、默认值和说明
- **输出**（Output）：执行完成后产出的内容
- **MCP 依赖**（Dependencies）：需要的 MCP 服务器
- **示例**（Examples）：至少一个完整的使用示例

### 测试 Skills

在分享 Skill 之前，先进行测试：

```
"请测试 full-review Skill，使用以下参数：
base_branch=main
review_focus=security
并在发现第一个严重问题后停止。"
```

### 团队分享

1. 将 `.codex/skills/` 目录签入 Git
2. 在项目 README 中列出可用的 Skills 及简要说明
3. 团队新人 Onboarding 时，通过 Skills 学习团队的标准工作流

## Skills 常见问题

**Q: Skills 和 GitHub Actions/CircleCI 有什么区别？**

Skills 运行在 Codex 的交互式上下文中，可以与你实时对话确认。CI/CD 流程是无交互的自动化。Skills 更适合"需要人工判断"的场景（如代码审查），CI/CD 更适合"机械性检查"（如 Lint、Test）。

**Q: 一个 Skill 可以调用另一个 Skill 吗？**

支持。在 Skill 定义中使用 `@skill:skill-name` 语法引用其他 Skill。

**Q: Skills 执行是否会计入 API 用量？**

是的，Skills 本质上是通过多轮对话执行工作流，每次对话轮次都会消耗 Token。复杂 Skill 可能比简单指令消耗更多 Token。

**Q: 如何调试 Skill 执行失败？**

```
"上一个 Skill 执行失败了，请逐步重新执行并解释每一步的输出"
```

## 下一步

掌握了 Skills 和 MCP 集成后，下一步学习 **Codex 进阶**——Subagents 多 Agent 协作、Plugins 生态、企业部署和 Codex vs Claude Code 选型指南。
