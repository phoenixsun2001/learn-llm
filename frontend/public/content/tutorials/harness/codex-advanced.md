## 学习目标

完成本章后，你将能够：

- 理解 Subagents 多 Agent 协作模式及其适用场景
- 配置 Automations 实现后台定时任务调度
- 了解 Plugins 生态并选择合适的插件
- 设计企业级的 Codex 部署和安全策略
- 在 Codex 和 Claude Code 之间做出明智的工具选择

## 学习路径

| 路径 | 适用人群 | 预计时间 | 内容 |
|------|----------|----------|------|
| **快速通道** | 已有 Agent 工具经验 | 20 分钟 | Subagents + 对比表 + 选型决策 |
| **完整路径** | 需要全面了解进阶特性 | 35 分钟 | 所有进阶主题 + 企业部署 |

## Subagents：多 Agent 协作

Subagents（子代理）是 Codex 的多 Agent 协作机制——你可以将一个大任务分解为多个子任务，每个子任务分配给一个专门的 Subagent 并行执行。

### Subagent 的工作原理

```
用户: "重构整个认证系统"

主 Agent:
    ├── Subagent 1: "分析现有认证代码，生成重构方案"
    ├── Subagent 2: "实现新的 JWT 中间件"
    ├── Subagent 3: "更新所有 API 端点的认证引用"
    ├── Subagent 4: "编写单元测试"
    └── Subagent 5: "更新 API 文档"

主 Agent: 合并所有 Subagent 的输出 → 冲突解决 → 最终集成
```

### Subagent 的优势

| 场景 | 单 Agent | 多 Subagent |
|------|----------|-------------|
| 重构多个独立模块 | 串行，耗时长 | 并行，速度 3-5x |
| 代码审查 + 文档生成 | 上下文混杂 | 各自专注，质量更高 |
| 跨语言项目（前端+后端） | 需要切换思维 | 各自处理擅长的语言 |
| 大型 PR 审查 | 可能遗漏 | 分工审查，覆盖更全面 |

### 使用 Subagents

```bash
# 在 Codex 对话中指定 Subagent 分配
"将这个重构任务分配给 3 个 Subagent：
- Subagent 1: 重构 src/models/ 数据模型层
- Subagent 2: 重构 src/services/ 业务逻辑层
- Subagent 3: 更新所有测试文件
完成后由主 Agent 汇总并解决合并冲突。"

# 或使用 /subagent 命令
/subagent create "API 文档生成"
/subagent list
/subagent merge all
```

### Subagent 隔离模型

每个 Subagent 拥有独立的上下文和权限范围：

```json
{
  "subagents": {
    "code-reviewer": {
      "permissions": ["read", "analyze"],
      "model": "gpt-4.1",
      "timeout": 300000
    },
    "test-writer": {
      "permissions": ["read", "write:test/**"],
      "model": "gpt-5",
      "timeout": 600000
    }
  }
}
```

### Subagent 最佳实践

1. **明确边界**：每个 Subagent 的职责范围应不重叠
2. **独立可验证**：每个 Subagent 的输出可以独立测试
3. **先小后大**：先用简单任务验证 Subagent 的协调逻辑，再投入复杂任务
4. **设置超时**：为每个 Subagent 设置合理的超时时间，防止僵尸任务
5. **合并前审查**：主 Agent 合并 Subagent 结果时应进行冲突检测

## Automations：后台定时任务

Automations 让 Codex 可以在后台按计划自动执行任务——类似于 cron job，但运行在 Codex 的 Agent 上下文中。

### 配置 Automation

```json
{
  "automations": [
    {
      "name": "Daily Code Review",
      "schedule": "0 9 * * 1-5",
      "command": "/review",
      "scope": "changed-files",
      "notify": "slack"
    },
    {
      "name": "Weekly Dependency Audit",
      "schedule": "0 10 * * 1",
      "command": "/deps audit",
      "notify": "email"
    },
    {
      "name": "PR Reminder",
      "schedule": "0 14 * * 5",
      "command": "检查所有打开 PR 的状态，提醒需要 Review 的 PR",
      "notify": "slack"
    }
  ]
}
```

### Automation 触发条件

| 触发类型 | 说明 | 示例 |
|----------|------|------|
| **Schedule** | Cron 表达式定时触发 | `0 9 * * 1-5`（工作日 9 点） |
| **Event** | 文件变更事件触发 | 新 PR 创建时 |
| **Manual** | 手动触发 | 通过 Codex App 操作 |

### Automation 通知渠道

- **Slack**：发送到指定频道
- **Email**：发送邮件报告
- **In-App**：Codex App 内通知
- **Webhook**：自定义 HTTP 回调

## Plugins 生态

Codex 的 Plugins 系统允许第三方开发者扩展 Codex 的能力。

### 官方插件类别

| 类别 | 功能 | 示例 |
|------|------|------|
| **Language Support** | 深度语言集成 | Rust Analyzer, Pylance |
| **Framework** | 框架感知工具 | Next.js Helper, Django Wizard |
| **Cloud/DevOps** | 云平台集成 | AWS Toolkit, Vercel Deploy |
| **Database** | 数据库管理 | Database Explorer, SQL Formatter |
| **Testing** | 测试增强 | Coverage Visualizer, Mock Generator |
| **Security** | 安全扫描 | Snyk, Trivy |

### 安装和管理插件

```bash
# CLI 安装
codex plugin install @codex/nextjs-helper

# App 内安装
# Settings → Plugins → Marketplace → 搜索 → Install

# 查看已安装
codex plugin list

# 移除插件
codex plugin remove @codex/nextjs-helper
```

### 选择插件的原则

1. **官方 > 社区**：优先选择 OpenAI 官方或已验证的插件
2. **星数 > 下载量**：GitHub Stars 比 npm 下载量更能反映质量
3. **活跃维护**：最近 30 天有更新的插件优先
4. **权限最小化**：审查插件请求的权限范围，拒绝过度请求

## GitHub PR Review 工作流

将 Codex 集成到 GitHub PR Review 流程中，是目前企业级最高效的实践之一。

### GitHub Actions 集成

```yaml
# .github/workflows/codex-review.yml
name: Codex PR Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  codex-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Codex
        run: npm install -g @openai/codex
          
      - name: Run Codex Review
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          git diff origin/${{ github.base_ref }}...HEAD > diff.patch
          codex -p "Review this PR diff. Focus on security, performance, and code quality. 用中文输出审查报告。" < diff.patch > review.md
          
      - name: Post Review
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');
            await github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.issue.number,
              body: review
            });
```

### PR 审查自动化层级

| 层级 | 触发方式 | 审查深度 | 耗时 |
|------|----------|----------|------|
| **L1: 即时审查** | PR 创建时自动触发 | 快速扫描（致命问题） | < 1 分钟 |
| **L2: 完整审查** | PR 标记 "ready for review" | 全面审查 | 3-5 分钟 |
| **L3: 深度审查** | 手动触发 | 架构级审查 + 重构建议 | 10+ 分钟 |

## 企业安全与部署

### 安全架构

```
┌────────────────────────────────────────────────┐
│                  企业安全边界                      │
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌───────────┐ │
│  │ Codex    │    │ Codex    │    │ Codex     │ │
│  │ Client 1 │    │ Client 2 │    │ Client N  │ │
│  └────┬─────┘    └────┬─────┘    └─────┬─────┘ │
│       │               │               │         │
│       └───────────────┬┴───────────────┘         │
│                       │                          │
│               ┌───────┴───────┐                  │
│               │  Codex Proxy  │                  │
│               │ (审计 + 过滤)  │                  │
│               └───────┬───────┘                  │
│                       │                          │
│         ┌─────────────┼─────────────┐            │
│         │             │             │            │
│   ┌─────┴─────┐ ┌─────┴─────┐ ┌────┴─────┐      │
│   │ OpenAI    │ │ 内部      │ │ 本地     │      │
│   │ (云端)    │ │ Gateway   │ │ 模型     │      │
│   └───────────┘ └───────────┘ └──────────┘      │
│                                                  │
└────────────────────────────────────────────────┘
```

### 企业级配置要点

**数据安全**：

```json
{
  "enterprise": {
    "data_retention": "zero",
    "local_model_fallback": true,
    "audit_logging": true,
    "blocked_patterns": [
      "-----BEGIN.*PRIVATE KEY-----",
      "sk-[a-zA-Z0-9]+",
      "ghp_[a-zA-Z0-9]+"
    ],
    "allowed_domains": ["api.openai.com"],
    "file_size_limit_mb": 5
  }
}
```

**权限管控**：

| 角色 | 读文件 | 写文件 | 执行命令 | 访问外部API | MCP 连接 |
|------|--------|--------|----------|-------------|----------|
| **Developer** | 全部 | 全部（需确认） | 非特权命令 | 否 | 否 |
| **Senior Dev** | 全部 | 全部 | 全部（需确认） | 允许 | 允许 |
| **Lead/Architect** | 全部 | 全部 | 全部 | 全部 | 全部 |
| **CI Bot** | 变更文件 | 否 | 预定义命令 | 否 | 仅 GitHub |

**部署模式**：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **SaaS** | 直接使用 OpenAI 云端服务 | 大多数企业 |
| **Private Link** | 通过私有连接访问 OpenAI | 金融、医疗 |
| **Hybrid** | 敏感代码本地模型 + 通用代码云端 | 混合需求 |
| **Air-gapped** | 完全离线部署本地模型 | 政府、国防 |

## Codex vs Claude Code 全面对比

当你在 Codex 和 Claude Code 之间做选择时（或者想两者都用时），以下对比帮助你做出明智决策。

### 场景化选型

| 使用场景 | 推荐工具 | 原因 |
|----------|----------|------|
| 个人开发者，日常编码 | **Codex** | 桌面 App 体验更好，ChatGPT 订阅打通 |
| 终端原教旨主义者 | **Claude Code** | CLI-first 设计，终端体验更原生 |
| 企业团队（安全合规） | **Codex** | 企业部署方案更成熟 |
| 复杂架构重构 | **Claude Code** | Opus 模型在复杂推理上更强 |
| 低延迟快速补全 | **Codex** | App 启动快，本地模型选项 |
| 开源项目协作 | 两者均可 | 取决于个人偏好 |
| CI/CD 集成 | **Claude Code** | CLI 管道模式更适合自动化 |
| 离线/内网环境 | **Codex** | 支持本地模型 |
| 预算敏感 | **Codex** | ChatGPT 订阅固定费用，成本可预测 |
| 需要深度代码理解 | **Claude Code** | 200K 上下文窗口更大 |

### 技术能力对比

| 能力维度 | Codex | Claude Code |
|----------|-------|-------------|
| **上下文窗口** | ~128K tokens | 200K tokens |
| **最强模型** | o3 (推理) / GPT-5 (通用) | Claude Opus 4 |
| **代码补全速度** | 快（App 原生） | 中（终端渲染） |
| **文件系统操作** | 完整 | 完整 |
| **多线程/并行** | 支持（多个 Thread） | 有限（单会话） |
| **自定义扩展** | Commands + Skills + Plugins | Hooks + Slash Commands + MCP |
| **Git 深度集成** | 中 | 高（管道模式原生友好） |
| **CLI 管道模式** | 基础支持 | 深度支持（-p 模式） |
| **IDE 集成** | App + VS Code 扩展 | 终端独立 |
| **团队协作** | Thread 分享 | 项目配置共享 |
| **离线能力** | 部分支持 | 无 |

### 组合使用策略

许多高绩效团队采用"双工具"策略：

```
日常工作流:
  ├── 新功能开发 + 代码补全 → Codex App
  ├── 代码审查 → 两者都跑，交叉验证
  ├── 复杂重构 → Claude Code (Opus) 设计 + Codex 执行
  └── CI/CD 自动化 → Claude Code CLI 管道模式

选择逻辑:
  if 需要桌面端体验 or 离线:
    → Codex
  elif 需要深度推理 or CLI 管道:
    → Claude Code
  else:
    → 哪个顺手用哪个
```

### 最终建议

**选 Codex 如果你是**：
- 喜欢桌面 App 的 UI/UX 体验
- 已经使用 ChatGPT 订阅
- 需要在离线环境中工作
- 需要企业级部署和审计方案

**选 Claude Code 如果你是**：
- 终端重度用户
- 需要最强的复杂推理能力（Opus）
- 重度依赖管道模式（`git diff | claude -p`）
- 更喜欢 Anthropic 的 API 定价模型

## 下一步

恭喜！你已完成 Codex 的全部学习路径。以下是继续深入的建议：

1. **实际项目练习**：在你的真实项目中连续使用 Codex 2 周，建立肌肉记忆
2. **自定义 Skills 库**：为你的团队构建一套标准 Skills，提升整体效率
3. **CI/CD 集成**：将 Codex 审查能力集成到 GitHub Actions 中
4. **尝试 Claude Code**：完成 Claude Code 学习路径，形成全面的 AI 编码工具认知
5. **持续关注**：OpenAI Codex 在快速迭代中，关注官方渠道获取最新动态
