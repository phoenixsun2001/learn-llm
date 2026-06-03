## 学习目标

完成本章后，你将能够：

- 在 6 个高频开发场景中高效使用 Claude Code
- 使用内置和自定义 Slash Commands 加速日常操作
- 管理多项目工作流和团队协作
- 优化 Claude Code 的 API 使用成本

## 学习路径

| 路径 | 适用人群 | 预计时间 | 内容 |
|------|----------|----------|------|
| **快速通道** | 已有基础使用经验 | 15 分钟 | Slash Commands + 场景速查 + 成本优化 |
| **完整路径** | 需要系统掌握工作流 | 30 分钟 | 全部场景深入 + 自定义命令 + 团队协作 |

## 工作流概览

在日常开发中，Claude Code 可以融入以下六个高频场景，覆盖从写代码到发布的完整流程：

| 场景 | 典型触发时机 | 平均耗时 | 效率提升 |
|------|-------------|----------|----------|
| 代码审查 | 提交 PR 前 / 合并前 | 2-5 分钟 | 提前发现 70%+ 的常见问题 |
| 代码重构 | 功能迭代中 / 技术债清理 | 5-15 分钟 | 复杂重构从小时级降至分钟级 |
| Bug 调试 | 测试失败 / 线上报错 | 3-10 分钟 | 定位速度提升 3-5 倍 |
| 文档生成 | 功能完成 / 发布前 | 1-3 分钟 | 文档编写时间减少 80% |
| 测试编写 | 功能实现后 / TDD | 5-10 分钟 | 测试覆盖率快速提升 |
| 依赖管理 | 版本升级 / 安全审计 | 2-5 分钟 | 安全处理 breaking changes |

## Slash Commands 系统

Claude Code 的 Commands 系统是日常工作流的核心入口。所有 Commands 以 `/` 开头，在对话中直接输入。

### 内置 Commands 参考

| Command | 功能 | 使用场景 |
|---------|------|----------|
| `/clear` | 清空当前对话上下文 | 开始全新任务前 |
| `/compact` | 压缩上下文（保留关键信息） | 对话变长但任务未完成时 |
| `/model` | 切换模型 (opus/sonnet/haiku) | 调整推理能力/成本 |
| `/cost` | 查看当前会话 API 成本 | 关注预算时 |
| `/review` | 审查当前代码变更 | PR 提交前 |
| `/pr-comments` | 审查并输出 PR 评论格式 | 准备 PR Review |
| `/doctor` | 诊断安装和配置问题 | 遇到异常行为时 |
| `/help` | 显示所有可用命令 | 忘记命令时 |
| `/status` | 显示当前会话状态 | 查看上下文窗口使用量 |
| `/add-dir` | 添加工作目录到上下文 | 多项目工作流 |
| `/init` | 初始化 .claude/ 项目配置 | 新项目设置 |
| `/context` | 显示/编辑上下文 | 精细控制上下文内容 |

### 创建自定义 Slash Commands

在 `.claude/commands/` 目录下创建 Markdown 文件来定义自定义命令：

**项目级命令** (`.claude/commands/the-command-name.md`)：

```markdown
<!-- .claude/commands/deploy-check.md -->

This command runs a pre-deployment safety checklist:

1. Run `npm test` and verify all tests pass
2. Run `npm run build` and verify build succeeds
3. Check for any uncommitted changes with `git status`
4. Verify environment variables are correctly set in `.env.production`
5. Output a deployment readiness summary with any warnings

Do NOT proceed with deployment until all checks pass.
```

使用：在对话中输入 `/deploy-check`。

**用户级命令** (`~/.claude/commands/`)：

```bash
mkdir -p ~/.claude/commands
```

用户级命令在所有项目中可用，适合个人偏好设置。

### 自定义命令最佳实践

1. **命名规范**：使用 kebab-case，动词在前，如 `deploy-check` 而非 `check-deploy`
2. **单一职责**：每个命令做一件事
3. **包含检查清单**：用编号列表列出检查步骤
4. **明确前置条件**：说明命令执行前的必要状态
5. **签入 Git**：项目级命令随项目一起版本管理

## 场景一：代码审查

提交代码前，让 Claude Code 做一轮自动化审查。这是回报率最高的用法——几分钟就能发现人工 review 容易遗漏的问题。

### 使用 /review 命令（推荐）

```bash
# 在 Claude Code 对话中直接输入
/review

# Claude 会分析当前工作区的变更并输出审查报告
```

### 审查当前分支的变更

```bash
# 方式一：审查当前工作区的所有变更
git diff | claude -p "Review this diff. Focus on:
1. Security: injection risks, missing auth checks, exposed secrets
2. Performance: N+1 queries, unnecessary re-renders, memory leaks
3. Error handling: missing try-catch, unhandled promise rejections
4. Code style: naming consistency, function length (>50 lines), complexity
请用中文列出发现的问题，按严重程度排序，每个问题附带修复代码。"
```

### 审查特定文件的变更

```bash
# 只审查特定文件
git diff -- src/services/auth.js | claude -p "审查 auth.js 的改动，重点检查安全性和错误处理。"
```

### 审查与 main 分支的差异

```bash
# PR 提交前审查
git diff main...HEAD | claude -p "Review this PR diff against main. 重点关注:
1. 是否有破坏性变更（breaking changes）
2. API 接口是否向后兼容
3. 数据库迁移是否安全（是否有回滚方案）
4. 新增依赖是否必要"
```

### 审查技巧

- **分主题审查**：分别关注安全、性能、风格，而不是一次性审查所有方面。专注的审查质量更高。
- **设置审查标准**：在 CLAUDE.md 中定义你团队的审查清单，Claude 会按清单逐项检查。
- **审查后别直接提交**：把 Claude 的建议当作"高级 lint"，最终决策仍由你做出。

## 场景二：代码重构

重构是 Claude Code 最擅长的领域之一——它能理解整个调用链，安全地进行大规模结构变更。

### 函数拆分

面对一个 300 行的"上帝函数"，传统重构需要反复阅读代码、手工追踪依赖。Claude Code 可以一步完成：

```bash
# 在 Claude 对话中输入
"请将 src/services/order.js 中的 processOrder 函数（约 300 行）拆分为多个独立函数。
拆分原则：
- 每个函数不超过 50 行
- 单一职责：校验、计算、持久化各自独立
- 提取可复用的工具函数到 src/utils/order.js
- 保持所有现有测试通过
请先读取文件，给出拆分方案，我确认后再执行。"
```

### 迁移技术方案

```bash
# 从 REST API 迁移到 GraphQL
"当前项目的 API 层使用 Express REST 风格（src/routes/）。
请帮我评估将所有路由迁移到 GraphQL (Apollo Server) 的工作量。
具体包括：
1. 列出所有现有的 REST 端点
2. 设计对应的 GraphQL schema
3. 估算每个端点的迁移复杂度（低/中/高）
4. 给出分阶段迁移建议"
```

### 性能优化

```bash
# 让 Claude 分析并优化性能瓶颈
"请读取 src/services/report.js，分析以下性能问题：
1. 是否有不必要的数据库查询（N+1 问题）
2. 是否可以添加缓存层（Redis）
3. 是否有可以并行化的操作
给出优化方案并附上代码。"
```

### 重构安全守则

1. **重构前确保测试通过**——这是 Claude 判断"行为不变"的基准
2. **要求 Claude 先读全量代码再动手**——用 `@文件路径` 引用所有相关文件
3. **小步提交**——每次重构一个方面，单独 commit，方便回退

## 场景三：Bug 调试

当你面对令人困惑的错误时，Claude Code 是比 Stack Overflow 更高效的调试伙伴。

### 粘贴即分析

```bash
# 直接粘贴完整错误堆栈
"运行 npm test 时遇到错误：
FAIL  src/services/__tests__/payment.test.js
  ● PaymentService › should handle refund

    TypeError: Cannot read properties of undefined (reading 'id')
      35 |   async refund(paymentId, amount) {
      36 |     const payment = await this.repository.findById(paymentId);
    > 37 |     if (payment.id) {
         |              ^
      38 |       // refund logic
      39 |     }

请读取 src/services/payment.js 和对应的测试文件，帮我：
1. 分析为什么 payment 可能是 undefined
2. 检查 repository.findById 的返回值处理
3. 给出修复方案和防御性编程建议"
```

### 管道模式快速诊断

```bash
# 将错误日志通过管道传给 Claude
npm test 2>&1 | tail -50 | claude -p "分析这些测试失败的原因，优先处理第一个失败。"
```

### 对比式调试

```bash
# 对比两个版本的差异来定位问题
"上次提交后支付功能开始报错。请分析：
git diff HEAD~1..HEAD -- src/services/payment.js
指出这次改动中可能导致 NPE 的地方。"
```

### 调试效率技巧

- **提供完整的错误上下文**：错误消息 + 堆栈 + 相关代码 + 复现步骤
- **使用二分法**：告诉 Claude "我知道问题出现在 commit A 和 commit B 之间"
- **让 Claude 添加诊断日志**：如果问题难以复现，让 Claude 在关键路径添加临时日志

## 场景四：文档生成

### 为模块生成 API 文档

```bash
"请读取 src/services/ 目录下所有文件，为每个 public 函数生成 JSDoc 注释。
要求：
- @param 包含类型和说明
- @returns 包含返回值和异常情况
- @example 包含至少一个使用示例
- 使用中文描述"
```

### 生成或更新 README

```bash
"请根据 package.json、项目文件结构和主要源码，生成一个专业的 README.md。
包含以下章节：
1. 项目简介（一句话 + 一段详细说明）
2. 快速开始（安装 + 配置 + 运行）
3. API 文档（主要接口说明）
4. 项目结构说明
5. 贡献指南"
```

### 提交信息生成

```bash
# 利用管道自动生成 Conventional Commit 消息
git diff --cached | claude -p "Generate a Conventional Commit message for these staged changes. Format: type(scope): subject, followed by bullet points of changes. 请用中文描述变更要点。"
```

## 场景五：测试编写

```bash
# 为指定文件生成测试
"请为 src/services/auth.js 编写完整的 Jest 单元测试。
要求：
1. Mock 所有外部依赖（数据库、API 调用）
2. 覆盖正常路径和异常路径
3. 测试边界条件（空输入、超长字符串、特殊字符）
4. 使用 describe/it 结构组织测试
5. 测试文件放在 __tests__/auth.test.js"
```

### TDD 工作流

```bash
# 先让 Claude 写测试，再写实现
"请按照 TDD 方式帮我实现 validateEmail 函数：
1. 首先在 __tests__/validation.test.js 中编写所有测试用例
2. 然后在 src/utils/validation.js 中实现函数
3. 运行测试直到全部通过
测试用例需覆盖：有效邮箱、无效格式、空字符串、超长字符串、特殊字符"
```

## 场景六：依赖管理

```bash
# 安全审计
"请检查 package.json 中的依赖：
1. 哪些包有已知的安全漏洞（npm audit）
2. 哪些包已经 deprecated
3. 哪些包可以升级到最新版本
4. 升级是否有 breaking changes"

# 处理版本冲突
"npm install 报错了，看起来是 peer dependency 冲突。
请分析 package.json 中的依赖关系，找到冲突根源并给出解决方案。"
```

## 会话管理与多项目工作流

### 会话恢复

```bash
# 意外关闭终端后恢复上次会话
claude --resume

# 或从会话列表中选择
claude --resume --list
```

### 多项目协作

当你需要在多个项目之间切换时：

```bash
# 方式一：不同终端窗口，各自 cd 到不同项目
# Terminal 1:
cd ~/project-frontend && claude

# Terminal 2:
cd ~/project-backend && claude

# 方式二：使用 /add-dir 在一个会话中添加多个工作目录
/add-dir ~/project-backend
```

### 团队协作模式

团队使用 Claude Code 的最佳实践：

| 实践 | 说明 |
|------|------|
| **CLAUDE.md 签入 Git** | 整个团队共享技术栈和编码规范 |
| **.claude/settings.json 签入** | 共享项目级权限和 Hooks 配置 |
| **自定义 Commands 共享** | `.claude/commands/` 作为团队标准工作流 |
| **审查报告模板** | 统一的 PR 审查清单嵌入 CLAUDE.md |
| **新人 Onboarding** | 通过 CLAUDE.md 让新成员快速了解项目规范 |

## CLAUDE.md 设置指南

`CLAUDE.md` 是你和 Claude Code 之间的"项目宪法"。一个精心编写的 CLAUDE.md 能大幅提升 Claude 的生成质量和一致性。

### 推荐结构

```markdown
# 项目名称

## 技术栈
- 前端：React 18, React Router 6, CSS Modules
- 后端：Node.js 18, Express 4, PostgreSQL 15
- 测试：Jest, React Testing Library, Supertest
- 工具：ESLint (airbnb), Prettier, Husky

## 编码规范
- 使用函数组件 + Hooks，禁止 Class 组件
- CSS 类名使用 BEM 命名法
- 异步操作使用 async/await，禁止 .then() 链
- 所有魔法数字必须定义为具名常量
- 不要引入超过 50KB 的新依赖（minified + gzipped）

## 架构约定
- 页面组件 → src/pages/
- 可复用组件 → src/components/
- API 调用 → src/services/api/ （统一错误处理和重试）
- 自定义 Hooks → src/hooks/
- 类型检查 → 使用 JSDoc 注释而非 TypeScript

## 禁止事项
- 不要使用 any 类型（即使在 JSDoc 中）
- 不要在组件中直接操作 DOM（使用 ref）
- 不要引入 Redux（使用 Context + useReducer）

## 测试要求
- 工具函数：100% 覆盖率要求
- 组件：至少覆盖所有交互路径
- API 端点：每个端点至少一个 happy path + 一个 error case
```

### CLAUDE.md 实战技巧

1. **从简开始，逐步丰富**：先写 5 条核心规则，用几天后再根据实际体验添加。
2. **记录 Claude 常犯的错误**：如果你发现 Claude 反复犯同一类错误，把它写入 CLAUDE.md 的"禁止事项"。
3. **团队共享**：CLAUDE.md 应该签入 Git，全团队共用和持续改进。

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+C` | 中断当前 Claude 的响应 |
| `Ctrl+D` | 退出 Claude Code |
| `Ctrl+L` | 清屏（保留对话历史） |
| `↑/↓` | 浏览历史输入 |
| `Tab` | 自动补全文件路径 |
| `Esc` | 取消当前输入 |
| `Shift+Enter` | 多行输入 |

## 成本优化策略

Claude Code 按 Token 计费，以下策略可以显著降低成本：

### 模型选择策略

| 任务类型 | 推荐模型 | 原因 |
|----------|----------|------|
| 简单查询、代码解释 | Haiku | 80% 的场景 Haiku 足够，成本仅为 Sonnet 的 1/10 |
| 日常编码、中等复杂度 | Sonnet | 质量和速度的最佳平衡点 |
| 复杂重构、架构决策 | Opus | 仅在高价值决策时使用 |

### 上下文管理省钱

```bash
# 避免：让 Claude 重新读取它已经知道的文件
"请再次读取 src/auth.js"  # 浪费 token

# 推荐：引用 Claude 已知的信息
"基于刚才对 auth.js 的分析，请修改 login 函数"  # 经济
```

### 具体省钱命令

```bash
# 先让 Claude 读代码，确认方案，再动手修改
# 而不是让它直接修改 → 失败 → 修改 → 失败

# 管道模式比交互模式更省（不保留会话状态）
echo "分析这个错误" | claude -p "$(cat error.log)"

# 使用 Haiku 处理格式化任务
claude --model claude-haiku-3-5-20241022 -p "格式化这个 JSON 文件"

# 使用 /compact 定期压缩上下文
/compact

# 使用 /cost 监控成本
/cost
```

## 下一步

掌握了日常工作流后，你已经能在日常开发中高效使用 Claude Code。下一步建议学习 **Hooks 系统与自动化**——通过事件钩子实现代码格式化、自动测试、安全检查等全自动化的质量保障流水线。
