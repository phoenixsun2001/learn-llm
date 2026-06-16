# Everything Claude Code (ECC) 完全指南

> **140K+ Stars | 21K+ Forks | 170+ 贡献者 | Anthropic 黑客松冠军**

## 一、ECC 是什么

ECC（Everything Claude Code）是 Anthropic x Forum Ventures 黑客马拉松获奖项目，由 [@affaanmustafa](https://x.com/affaanmustafa) 在 10 个多月的高强度生产环境使用中打磨而成。

**它不是一套简单的配置文件**，而是一个完整的 AI 编程操作系统：

| 组件 | 数量 | 说明 |
|------|------|------|
| Agents（子智能体） | 63 | 专用任务委派，覆盖代码审查、安全审计、E2E 测试、文档生成等 |
| Skills（技能模块） | 249 | 工作流定义与领域知识库，从 TDD 到 Django 到 Docker |
| Commands（斜杠命令） | 79 | 快速调用的命令入口 |
| Rules（规则） | 多语言 | 必须遵守的编码规范（TypeScript/Python/Go/Swift/PHP/Perl 等） |
| Hooks（钩子） | 自动化 | 内存持久化、上下文精简、持续学习 |

**跨平台兼容**：Claude Code / Codex / Cursor / OpenCode / Gemini CLI / Copilot CLI。

---

## 二、核心理念：四层架构

ECC 将 AI 编程辅助组织为四个层次，每层解决不同的问题：

```
┌──────────────────────────────────────────────┐
│  Layer 1: Rules（规则）                       │
│  必须遵守的编码规范，始终生效                    │
│  common/ + 语言特定目录                         │
├──────────────────────────────────────────────┤
│  Layer 2: Hooks（钩子）                        │
│  基于触发器的自动化：会话生命周期、上下文管理       │
│  PreToolUse / PostToolUse / Stop / SessionStart │
├──────────────────────────────────────────────┤
│  Layer 3: Skills（技能）                       │
│  可调用的工作流定义：TDD、安全审查、持续学习       │
│  249 个领域知识模块                              │
├──────────────────────────────────────────────┤
│  Layer 4: Agents（智能体）                     │
│  专用子智能体，独立上下文执行复杂任务              │
│  63 个专用 Agent                                │
└──────────────────────────────────────────────┘
```

---

## 三、快速安装

### 方式一：插件安装（推荐）

```bash
# 1. 添加市场
/plugin marketplace add https://github.com/affaan-m/ECC

# 2. 安装插件
/plugin install ecc@ecc

# 3. 手动安装 Rules（插件系统暂不支持分发 Rules）
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code
mkdir -p ~/.claude/rules
cp -r rules/common ~/.claude/rules/
cp -r rules/typescript ~/.claude/rules/   # 按需选择语言
```

### 方式二：手动安装

```bash
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code

# 复制 Agents
cp agents/*.md ~/.claude/agents/

# 复制 Rules
mkdir -p ~/.claude/rules
cp -r rules/common ~/.claude/rules/
cp -r rules/typescript ~/.claude/rules/

# 复制 Skills
cp -r skills/* ~/.claude/skills/

# 复制 Commands（可选）
mkdir -p ~/.claude/commands
cp commands/*.md ~/.claude/commands/
```

### 环境要求

- Claude Code CLI **v2.1.0 或更高**
- 查看版本：`claude --version`

---

## 四、六大核心能力

### 1. Token 优化

ECC 提供了系统化的 Token 管理策略：

| 策略 | 说明 |
|------|------|
| 模型选择 | 机械性任务用廉价模型，架构/审查用最强模型 |
| 系统提示精简 | 按需注入上下文，避免膨胀 |
| 后台进程 | 将耗时操作移至后台，减少会话占用 |
| 战略精简 | 在上下文达到阈值前主动精简 |

### 2. 内存持久化

ECC 的钩子系统实现了**跨会话记忆**：

```
会话启动 → 自动加载上次上下文
    ↓
会话进行 → 提取关键决策和模式
    ↓
会话结束 → 保存状态供下次使用
    ↓
精简触发 → 精简前自动保存状态
```

核心钩子：
- `session-start.js`：启动时恢复上下文
- `session-end.js`：结束时保存状态
- `pre-compact.js`：精简前状态快照
- `suggest-compact.js`：策略性精简建议

### 3. 持续学习

ECC 的 `continuous-learning-v2` 系统自动从你的编码会话中学习：

```bash
/instinct-status        # 查看已学习的"本能"及置信度
/instinct-import <file> # 导入他人的学习成果
/instinct-export        # 导出你的本能分享给团队
/evolve                 # 将相关本能聚类为技能
/prune                  # 清理过期的待处理本能
```

**工作原理**：
1. 每次会话自动提取代码模式、决策和偏好
2. 模式积累为"本能"（Instinct），附带置信度评分
3. 高置信度本能聚合成可重用的技能模块
4. 跨项目、跨会话持续积累

### 4. 验证循环

ECC 提供两种验证策略：

| 策略 | 适用场景 | 机制 |
|------|----------|------|
| 检查点验证 | 关键节点（提交前、PR 前） | 全量快照比对 |
| 持续评估 | 长时间运行的工作流 | 增量评分管道 |

支持的评分器类型：
- 功能正确性（行为匹配 Spec）
- 代码质量（Lint、复杂度、DRY）
- 安全合规（漏洞扫描、密钥检测）
- 性能回归（基准对比）

### 5. 并行化

ECC 支持多种并行策略：

| 策略 | 适用场景 |
|------|----------|
| Git Worktrees | 独立功能分支并行开发 |
| 级联方法 | 上游输出驱动下游任务 |
| 多实例扩展 | 大规模独立任务批量处理 |

```bash
# ECC 的多智能体编排命令
/multi-plan "拆分用户认证模块"     # 任务拆解
/multi-execute                    # 并行执行
/multi-backend "重构 API 层"      # 后端多服务编排
/multi-frontend "迁移到 Next.js"  # 前端多服务编排
```

> 注意：multi-* 命令需要额外安装 `ccg-workflow` 运行时：`npx ccg-workflow`

### 6. 子智能体编排

ECC 的 63 个专用 Agent 覆盖了从代码审查到部署的完整链路：

**通用开发**：
- `code-reviewer`：代码质量与安全审查
- `security-reviewer`：漏洞分析
- `build-error-resolver`：构建错误修复
- `tdd-guide`：测试驱动开发
- `e2e-runner`：Playwright 端到端测试
- `refactor-cleaner`：无效代码清理
- `doc-updater`：文档同步更新

**语言专属**：
- `go-reviewer` / `go-build-resolver`
- `python-reviewer`
- `typescript-reviewer`
- `java-reviewer` / `java-build-resolver`
- `kotlin-reviewer` / `kotlin-build-resolver`
- `rust-reviewer` / `rust-build-resolver`
- `cpp-reviewer` / `cpp-build-resolver`

**专项领域**：
- `database-reviewer`：数据库/Supabase 审查
- `harness-optimizer`：执行框架配置调优
- `loop-operator`：自主循环执行
- `docs-lookup`：文档/API 查阅

---

## 五、AgentShield 安全审计

AgentShield 是 ECC 生态中的安全审计工具（Claude Code 黑客松开发，1282 项测试，98% 覆盖率）：

```bash
# 快速扫描（无需安装）
npx ecc-agentshield scan

# 自动修复安全问题
npx ecc-agentshield scan --fix

# 调用 3 个 Opus 智能体进行深度分析（红队/蓝队/审计）
npx ecc-agentshield scan --opus --stream

# 从零生成安全配置
npx ecc-agentshield init
```

**扫描范围**：CLAUDE.md、settings.json、MCP 配置、钩子、智能体定义、技能模块。

**检测类别**：
- 密钥检测（14 种模式：API Key、Token、Password 等）
- 权限审计（过度授权的 MCP 工具）
- 钩子注入分析（恶意命令注入）
- MCP 服务风险评估
- 智能体配置审查

---

## 六、Rules 规则体系

ECC 的 Rules 分为通用规则和语言专属规则：

```
~/.claude/rules/
├── common/              # 通用原则（必装）
│   ├── coding-style.md   # 不可变性、文件组织
│   ├── git-workflow.md   # 提交格式、PR 流程
│   ├── testing.md        # TDD、80% 覆盖率要求
│   ├── performance.md    # 模型选型、上下文管理
│   ├── patterns.md       # 设计模式、项目骨架
│   ├── hooks.md          # 钩子架构
│   ├── agents.md         # 子智能体委派时机
│   └── security.md       # 强制安全检查
├── typescript/          # TS/JS 专属
├── python/              # Python 专属
├── golang/              # Go 专属
├── swift/               # Swift 专属
├── php/                 # PHP 专属
└── perl/                # Perl 专属
```

---

## 七、关键命令速查

| 命令 | 用途 |
|------|------|
| `/ecc:plan "需求"` | 功能实现规划 |
| `/ecc:code-review` | 代码质量审查 |
| `/ecc:build-fix` | 修复构建错误 |
| `/ecc:quality-gate` | 验证门禁 |
| `/ecc:learn` | 从会话中提取模式 |
| `/ecc:security-scan` | 安全审计扫描 |
| `/ecc:tdd` | TDD 工作流 |
| `/ecc:setup-pm` | 配置包管理器 |
| `/ecc:skill-create` | 从 Git 历史生成技能 |
| `/ecc:sessions` | 会话历史管理 |

---

## 八、最佳实践

### 上下文窗口管理

> **关键**：不要一次启用所有 MCP。如果启用了太多工具，200k 上下文窗口可能缩小到 70k。

经验法则：
- 全局最多配置 20-30 个 MCP
- 每个项目保持启用少于 10 个
- 活动工具总数少于 80 个
- 在项目配置中使用 `disabledMcpServers` 禁用不用的服务

### 渐进式采用

1. **起步**：只安装 `rules/common` + 你使用的语言规则
2. **熟悉**：先使用 `/ecc:plan` 和 `/ecc:code-review` 两个核心命令
3. **扩展**：逐步启用持续学习、验证循环
4. **定制**：根据项目需求增删 Skills，创建项目专属规则

### 钩子运行时控制

```bash
# 调整严格度（默认：standard）
export ECC_HOOK_PROFILE=standard

# 临时禁用特定钩子
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"
```

---

## 九、生态工具

| 工具 | 用途 |
|------|------|
| **Skill Creator** | 从 Git 历史自动生成技能文件 |
| **AgentShield** | 安全审计与自动修复 |
| **ECC Tools** | 成本控制、计费管理 |
| **ccg-workflow** | 多智能体工作流运行时 |

---

## 十、与其他方案的对比

| 维度 | ECC | Superpowers | OpenSpec |
|------|-----|-------------|----------|
| 定位 | 全栈配置体系 | 工程纪律框架 | 规范驱动开发 |
| 规模 | 63 Agent + 249 Skill | 14 Skills | 10 个工作流命令 |
| 侧重点 | 配置完整性、跨语言覆盖 | TDD、子智能体审查 | 需求→规格→归档 |
| 学习系统 | 内置持续学习 v2 | 无 | 无 |
| 安全扫描 | AgentShield（独立工具） | 无 | 无 |
| 安装方式 | Claude Code 插件 | 手动复制 Skills | CLI 初始化 |

三者互补：OpenSpec 管"想清楚再写"，Superpowers 管"工程纪律"，ECC 管"开箱即用配置"。

---

## 参考链接

- **GitHub**: [affaan-m/ECC](https://github.com/affaan-m/ECC)
- **简明指南**: [The Shorthand Guide to ECC](https://x.com/affaanmustafa/status/2012378465664745795)
- **深度指南**: [The Longform Guide to ECC](https://x.com/affaanmustafa/status/2014040193557471352)
- **安全指南**: [Agentic Security Guide](https://x.com/affaanmustafa/status/2033263813387223421)
- **作者**: [@affaanmustafa](https://x.com/affaanmustafa)
