## 学习目标

完成本章后，你将能够：

- 理解 Hooks 系统的完整生命周期和所有触发点
- 配置 PreToolUse、PostToolUse、Stop 等核心 Hooks
- 使用 Subagent Hooks 管理子 Agent 行为
- 将 Hooks 与 Skills 工作流集成
- 设计企业级 Hooks 部署和调试策略
- 排查 Hooks 执行异常并优化性能

## 学习路径

| 路径 | 适用人群 | 预计时间 | 内容 |
|------|----------|----------|------|
| **快速通道** | 已有 Hooks 概念 | 15 分钟 | 生命周期速览 + 实战示例 + 调试 |
| **完整路径** | 需要系统掌握 | 35 分钟 | 完整生命周期 + 企业部署 + 性能优化 |

## 什么是 Hooks

Hooks 是 Claude Code 的事件钩子系统——概念上类似于 Git Hooks，但作用域更广。通过 Hooks，你可以在 Claude Code 执行过程的特定阶段自动触发自定义脚本，实现代码格式化、自动测试、安全检查、通知推送等自动化工作流。

Hooks 的核心价值在于**将被动工具变为主动流程**。没有 Hooks，Claude Code 只是一个"你下指令、它执行"的工具。有了 Hooks，它变成了一个嵌入在你开发流程中的**自动化质量保障引擎**。

## Hooks 架构与完整生命周期

Claude Code 支持的 Hooks 触发点覆盖了 Agent 执行的完整生命周期：

### 生命周期事件表

| 触发点 | 触发时机 | 可阻止 | 典型用途 | 性能要求 |
|--------|----------|--------|----------|----------|
| `SessionStart` | 会话开始时 | 是（返回非零中断启动） | 加载配置、检查环境、打印项目状态 | < 2s |
| `PreToolUse` | 工具被调用**之前** | 是（返回非零阻止操作） | 校验输入、阻止危险操作、前置检查 | < 1s |
| `PostToolUse` | 工具执行完成**之后** | 否（不影响操作） | 格式化输出、记录日志、触发通知 | < 3s |
| `Notification` | Claude 发送通知时 | 否 | 转发通知到 Slack/钉钉 | < 1s |
| `Stop` | 主 Agent 响应**结束**时 | 否 | 运行测试、生成报告、commit 建议 | < 60s |
| `SubagentStop` | 子 Agent **完成**任务时 | 否 | 汇总子任务结果、验证子 Agent 输出 | < 10s |
| `PreCompact` | 上下文压缩**之前** | 否 | 备份关键信息、记录压缩时间点 | < 1s |
| `PreClear` | 清空上下文**之前** | 否 | 保存重要决策到 CLAUDE.md | < 1s |

### Hook 执行顺序详解

在一次典型的"Claude 编辑文件"操作中，Hooks 的触发顺序是：

```
SessionStart (会话启动)
    ↓
PreToolUse  (Write/Edit 工具调用前 — 可以阻止)
    ↓
[Claude 执行文件写入]
    ↓
PostToolUse (Write/Edit 工具完成后 — 格式化、记录)
    ↓
Stop        (Agent 本轮响应结束 — 运行测试)
```

对于涉及 Subagents 的复合操作：

```
SessionStart
    ↓
PreToolUse  (主 Agent 创建 Subagent 前)
    ↓
[Subagent 执行中...]
    ↓
SubagentStop  (每个 Subagent 完成时)
    ↓
Stop          (主 Agent 所有响应结束)
```

## Hooks 配置

Hooks 通过 JSON 文件配置，支持两个位置：

| 位置 | 作用域 | 适用场景 |
|------|--------|----------|
| `项目/.claude/hooks.json` | 当前项目 | 项目特定的质量门禁（应签入 Git） |
| `~/.claude/hooks.json` | 全局（所有项目） | 个人偏好（如通知、日志） |

### 配置结构

```json
{
  "hooks": [
    {
      "matcher": "PostToolUse",
      "command": "npx prettier --write \"${CLAUDE_TOOL_FILE_PATH}\"",
      "tools": ["Write", "Edit"],
      "env": {
        "CUSTOM_VAR": "value"
      }
    }
  ]
}
```

每个 Hook 条目的字段说明：

| 字段 | 必需 | 说明 |
|------|------|------|
| `matcher` | 是 | 触发点名称（PreToolUse、PostToolUse 等） |
| `command` | 是 | 要执行的 Shell 命令 |
| `tools` | 否 | 限定只对特定工具生效（如 ["Write", "Edit"]） |
| `env` | 否 | 传递给命令的额外环境变量 |
| `timeout` | 否 | 命令超时时间（毫秒），默认 30000 |
| `condition` | 否 | 条件表达式，为真时才触发（如文件扩展名匹配） |

## 实战示例一：编辑后自动格式化代码

**场景**：每当 Claude 编辑文件后，自动运行 Prettier 格式化代码，确保代码风格一致。

```json
{
  "hooks": [
    {
      "matcher": "PostToolUse",
      "command": "npx prettier --write \"${CLAUDE_TOOL_FILE_PATH}\"",
      "tools": ["Write", "Edit"]
    }
  ]
}
```

**进阶版**：同时处理多种文件类型的格式化：

```json
{
  "hooks": [
    {
      "matcher": "PostToolUse",
      "command": "bash -c 'case \"${CLAUDE_TOOL_FILE_PATH}\" in *.js|*.jsx|*.ts|*.tsx) npx prettier --write \"${CLAUDE_TOOL_FILE_PATH}\" ;; *.py) black \"${CLAUDE_TOOL_FILE_PATH}\" ;; *.go) gofmt -w \"${CLAUDE_TOOL_FILE_PATH}\" ;; esac'",
      "tools": ["Write", "Edit"]
    }
  ]
}
```

## 实战示例二：代码变更后自动运行测试

**场景**：Claude 完成一轮代码修改后，自动运行相关测试，确保没有引入回归。

```json
{
  "hooks": [
    {
      "matcher": "Stop",
      "command": "bash -c 'if [ -f package.json ]; then npm test -- --bail --findRelatedTests \"${CLAUDE_TOOL_FILE_PATH}\" 2>&1; else echo \"No package.json found, skipping tests\"; fi'",
      "timeout": 60000
    }
  ]
}
```

**策略说明**：

- `--bail`：第一个失败后立即停止，节省时间
- `--findRelatedTests`：只运行与被修改文件相关的测试，而非全量
- `timeout: 60000`：给测试 60 秒时间（默认 30 秒可能不够）
- 如果测试失败，Claude 会看到错误输出，可以在下一轮对话中修复

## 实战示例三：防止提交敏感信息

**场景**：在 Claude 写入文件之前，扫描文件内容中是否包含 API Key、密码、Token 等敏感信息。

```json
{
  "hooks": [
    {
      "matcher": "PreToolUse",
      "command": "bash -c 'file=\"${CLAUDE_TOOL_FILE_PATH}\"; if [ -f \"$file\" ]; then if grep -qE \"(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC) PRIVATE KEY-----|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[a-zA-Z0-9-]+)\" \"$file\" 2>/dev/null; then echo \"SECURITY ERROR: 文件 $file 包含疑似密钥/Token！请移除后重试。\"; echo \"匹配到的模式: $(grep -oE \"(sk-[a-zA-Z0-9]{6}|AKIA[0-9A-Z]{4})\" \"$file\" | head -3)\"; exit 1; fi; fi'",
      "tools": ["Write"],
      "timeout": 5000
    }
  ]
}
```

**原理**：

1. `PreToolUse` 在写入文件前触发
2. 用正则匹配常见密钥模式（Anthropic API Key、AWS Access Key、GitHub Token、Slack Token、私钥）
3. 如果匹配到，输出错误信息并返回退出码 1
4. **返回非零退出码会阻止当前操作**——Claude 不会写入包含敏感信息的文件
5. Claude 看到错误后，会调整代码移除硬编码的密钥

## 实战示例四：会话结束后自动生成 Commit Message

**场景**：完成一轮开发会话后，自动检查暂存区变更并生成 Conventional Commit 消息。

```json
{
  "hooks": [
    {
      "matcher": "Stop",
      "command": "bash -c 'if git rev-parse --git-dir > /dev/null 2>&1; then staged=$(git diff --cached --stat 2>/dev/null); if [ -n \"$staged\" ]; then echo \"\"; echo \"═══ Git Commit 建议 ═══\"; echo \"暂存文件:\"; echo \"$staged\"; echo \"\"; echo \"建议的 commit message:\"; git diff --cached | head -200 | claude -p \"Generate a Conventional Commit message for this diff. Output ONLY the commit message, no explanation.\" --model claude-haiku-3-5-20241022; fi; fi'",
      "timeout": 30000
    }
  ]
}
```

## 实战示例五：子 Agent 完成时验证输出

**场景**：当 Subagent 完成任务后，自动验证其输出是否符合质量标准。

```json
{
  "hooks": [
    {
      "matcher": "SubagentStop",
      "command": "bash -c 'echo \"[Subagent Hook] 子任务完成：${CLAUDE_SUBAGENT_NAME}，退出码：$?\" >> /tmp/claude-subagent.log; if [ -f \"${CLAUDE_TOOL_FILE_PATH}\" ]; then echo \"输出文件：${CLAUDE_TOOL_FILE_PATH}，大小：$(wc -c < ${CLAUDE_TOOL_FILE_PATH}) bytes\" >> /tmp/claude-subagent.log; fi'",
      "timeout": 5000
    }
  ]
}
```

## 实战示例六：长时间任务完成后推送通知

**场景**：当 Claude 完成耗时较长的任务后，通过 Webhook 发送 Slack/钉钉/企业微信通知。

### Slack 通知

```json
{
  "hooks": [
    {
      "matcher": "Stop",
      "command": "bash -c 'duration=$SECONDS; if [ $duration -gt 30 ]; then curl -s -X POST -H \"Content-type: application/json\" --data \"{\\\"text\\\":\\\"🤖 Claude Code 任务完成 (耗时: ${duration}s)\\\"}\" \"$SLACK_WEBHOOK_URL\" > /dev/null 2>&1; fi'",
      "env": {
        "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      }
    }
  ]
}
```

### 钉钉通知

```json
{
  "hooks": [
    {
      "matcher": "Stop",
      "command": "bash -c 'duration=$SECONDS; if [ $duration -gt 30 ]; then curl -s -X POST -H \"Content-Type: application/json\" --data \"{\\\"msgtype\\\":\\\"text\\\",\\\"text\\\":{\\\"content\\\":\\\"Claude Code 任务完成，耗时 ${duration}s\\\"}}\" \"$DINGTALK_WEBHOOK_URL\" > /dev/null 2>&1; fi'",
      "env": {
        "DINGTALK_WEBHOOK_URL": "https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN"
      }
    }
  ]
}
```

## 组合使用：完整质量门禁流水线

将上述示例组合在一起，可以构建一个完整的自动化质量保障流程：

```json
{
  "hooks": [
    {
      "matcher": "PreToolUse",
      "command": "bash -c 'file=\"${CLAUDE_TOOL_FILE_PATH}\"; if [ -f \"$file\" ] && grep -qE \"(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN.*PRIVATE KEY-----)\" \"$file\" 2>/dev/null; then echo \"⛔ 检测到硬编码密钥，操作被阻止\"; exit 1; fi'",
      "tools": ["Write"],
      "timeout": 5000
    },
    {
      "matcher": "PostToolUse",
      "command": "bash -c 'case \"${CLAUDE_TOOL_FILE_PATH}\" in *.js|*.jsx|*.css) npx prettier --write \"${CLAUDE_TOOL_FILE_PATH}\" 2>/dev/null ;; esac'",
      "tools": ["Write", "Edit"],
      "timeout": 10000
    },
    {
      "matcher": "Stop",
      "command": "bash -c 'if [ -f package.json ]; then echo \"\"; echo \"═══ 运行测试 ═══\"; npm test -- --bail 2>&1 || true; fi'",
      "timeout": 60000
    }
  ]
}
```

**执行流程**：

```
Write 前 → 扫描密钥（有 → 阻止 / 无 → 继续）
    ↓
Write 后 → Prettier 格式化
    ↓
Stop   → 运行测试 → 输出结果
```

## Hooks 与企业级 Skills 集成

Hooks 可以与 Skills 系统协同工作，实现更复杂的自动化：

```
Skills 触发某个操作
    ↓
PreToolUse Hook 检查前置条件
    ↓
[操作执行]
    ↓
PostToolUse Hook 格式化/记录
    ↓
Stop Hook 运行完整验证
    ↓
SubagentStop Hook 汇总并行任务结果
```

## 环境变量参考

Hooks 脚本中可访问以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `CLAUDE_TOOL_NAME` | 当前调用的工具名称 | `Write`, `Edit`, `Bash` |
| `CLAUDE_TOOL_INPUT` | 工具的输入参数（JSON 字符串） | `{"file_path":"src/app.js"}` |
| `CLAUDE_TOOL_FILE_PATH` | 被操作的文件路径（最常用） | `/home/user/project/src/app.js` |
| `CLAUDE_PROJECT_DIR` | 项目根目录路径 | `/home/user/project` |
| `CLAUDE_MODEL` | 当前使用的模型名称 | `claude-sonnet-4-20250514` |
| `CLAUDE_SESSION_ID` | 当前会话的唯一标识 | `abc123-def456` |
| `CLAUDE_SUBAGENT_NAME` | 子 Agent 名称 (SubagentStop) | `code-reviewer` |
| `CLAUDE_SUBAGENT_RESULT` | 子 Agent 结果摘要 (SubagentStop) | JSON 字符串 |

## 调试 Hooks

### 1. 添加日志输出

在命令中使用 `>>` 重定向输出到日志文件：

```json
{
  "matcher": "PostToolUse",
  "command": "bash -c 'echo \"[$(date)] Hook fired: ${CLAUDE_TOOL_NAME} on ${CLAUDE_TOOL_FILE_PATH}\" >> /tmp/claude-hooks.log; npx prettier --write \"${CLAUDE_TOOL_FILE_PATH}\" 2>&1 >> /tmp/claude-hooks.log'"
}
```

### 2. 测试 Hook 命令

在配置到 hooks.json 之前，先在终端中手动执行命令，确认语法正确：

```bash
# 模拟 Hook 环境变量，手动测试
export CLAUDE_TOOL_FILE_PATH="src/test.js"
export CLAUDE_TOOL_NAME="Write"
export CLAUDE_SUBAGENT_NAME="test-subagent"
npx prettier --write "${CLAUDE_TOOL_FILE_PATH}"
```

### 3. 检查退出码

```bash
# Hook 命令返回非零退出码时，Claude Code 的行为取决于 matcher 类型
# PreToolUse: 非零 → 阻止操作
# PostToolUse/Stop/SubagentStop: 非零 → 记录警告但不回滚
# SessionStart: 非零 → 中断会话启动
```

### 4. 逐步启用

不要一次性启用所有 Hooks。逐个添加、测试、确认无误后，再添加下一个：

```
第一天：只加 PostToolUse 格式化 Hook
第二天：加入 PreToolUse 安全检查 Hook
第三天：加入 Stop 测试 Hook
```

## 性能优化

Hooks 在同步执行，过慢的 Hook 会严重影响 Claude Code 的响应体验：

| Hook 类型 | 推荐超时 | 说明 |
|-----------|----------|------|
| PreToolUse | 1-3s | 应该即时响应，否则影响每次工具调用 |
| PostToolUse | 3-5s | 格式化和日志记录应快速完成 |
| Stop | 30-60s | 可以运行较慢的任务，但不宜超过 1 分钟 |
| SubagentStop | 5-10s | 子 Agent 验证应快速 |
| SessionStart | 1-2s | 启动时不应有明显延迟 |

### 性能建议

1. **避免在 PreToolUse/PostToolUse 中运行测试**——把它们放到 Stop Hook
2. **使用条件过滤**——只对特定文件类型触发 Hook，而非所有文件
3. **缓存昂贵操作**——如 ESLint 配置，使用 `--cache` 标志
4. **监控 Hook 耗时**——在日志中记录每个 Hook 的执行时间

## 企业级 Hooks 部署

### 分层配置策略

```
~/.claude/hooks.json         (用户级 — 个人通知偏好)
    ↓
项目/.claude/hooks.json       (项目级 — 质量门禁，签入 Git)
    ↓
项目/.claude/hooks.local.json (本地覆盖 — 不签入 Git，开发者自定义)
```

### 团队共享 Hooks

项目级的 `.claude/hooks.json` 应签入 Git 仓库，确保团队所有成员使用相同的质量门禁。

```bash
# hooks.json（不含敏感信息）→ 签入 Git
git add .claude/hooks.json
git commit -m "ci: add Claude Code quality gate hooks"

# .env（含 Webhook URL 等敏感信息）→ 不签入
echo '.env' >> .gitignore
```

### 模板化配置文件

对于需要团队自定义的配置（如通知 Webhook URL），使用模板 + 环境变量模式：

```json
{
  "hooks": [
    {
      "matcher": "Stop",
      "command": "bash -c 'if [ -n \"$TEAM_WEBHOOK_URL\" ]; then curl -s -X POST -H \"Content-Type: application/json\" --data \"{\\\"text\\\":\\\"Claude 任务完成\\\"}\" \"$TEAM_WEBHOOK_URL\"; fi'"
    }
  ]
}
```

每个团队成员在本地设置 `TEAM_WEBHOOK_URL` 环境变量即可，不需要修改 hooks.json。

## Hooks 故障排查

| 症状 | 可能原因 | 排查步骤 |
|------|----------|----------|
| Hook 不触发 | matcher 名称错误、tools 过滤不匹配 | 检查 hooks.json 语法；查看 `/tmp/claude-hooks.log` |
| Hook 触发但无效果 | 命令本身执行失败 | 手动模拟环境变量测试命令 |
| Hook 导致 Claude 卡住 | 进程僵死或循环等待 | 设置合理 timeout；检查命令是否有交互式输入 |
| PreToolUse 阻止了不该阻止的操作 | 正则匹配过于宽泛 | 收紧正则表达式；添加白名单条件 |
| 多个 Hook 互相干扰 | 执行顺序不确定 | 合并相关 Hook；依赖独立脚本 |

## Hooks 最佳实践

1. **保持 Hooks 短小快速**：每个 Hook 命令应在 5 秒内完成。如果 Hook 太慢，会严重影响 Claude Code 的响应体验。把耗时任务放到 `Stop` 触发点。
2. **PreToolUse 谨慎阻塞**：在 `PreToolUse` 中返回非零会阻止 Claude 的操作。将这个能力保留给真正的阻断场景（如密钥扫描），不要用它来做格式化检查。
3. **使用 bash -c 包装复杂命令**：对于多行或多命令的逻辑，用 `bash -c '...'` 包装，避免 Shell 解析问题。
4. **正确转义 JSON**：JSON 字符串中的双引号和反斜杠需要转义。使用在线 JSON validator 验证 hooks.json 的格式。
5. **超时设置要合理**：`Stop` Hooks 可以设置较长的超时（如 60s 用于测试），`PreToolUse/PostToolUse` 超时应尽量短（1-5s）。
6. **记录 Hook 执行情况**：在生产使用中，让 Hooks 输出到日志文件，便于排查问题。
7. **使用 hooks.local.json 隔离本地配置**：避免团队成员的个人偏好污染项目级配置。

## 进阶：自定义 Hook 脚本

对于复杂逻辑，建议将 Hook 逻辑提取到独立脚本文件：

```json
{
  "hooks": [
    {
      "matcher": "Stop",
      "command": "bash .claude/hooks/quality-check.sh"
    }
  ]
}
```

```bash
# .claude/hooks/quality-check.sh
#!/bin/bash
set -e

echo "[Quality Gate] 开始检查..."

# 1. Lint 检查
if [ -f package.json ]; then
  echo "[Quality Gate] ESLint..."
  npx eslint "${CLAUDE_TOOL_FILE_PATH}" --quiet || true
fi

# 2. 类型检查（TypeScript 项目）
if [ -f tsconfig.json ]; then
  echo "[Quality Gate] TypeScript..."
  npx tsc --noEmit || true
fi

# 3. 测试
if grep -q "\"test\":" package.json 2>/dev/null; then
  echo "[Quality Gate] Tests..."
  npm test -- --bail || true
fi

echo "[Quality Gate] 检查完成"
```

将脚本文件也签入 Git，团队成员可以共同维护和改进。

## 下一步

恭喜！你已经学完 Claude Code 的全部核心内容——从基础概念、安装配置、项目实战到日常工作流和 Hooks 自动化。

**建议的后续学习路径**：

1. **实际项目练习**：在你的真实项目中持续使用 Claude Code，积累经验
2. **自定义 Hooks**：根据团队需求编写专属的质量门禁 Hook
3. **探索 CI/CD 集成**：将 Claude Code 的代码审查能力集成到 CI/CD 流水线中
4. **学习 Codex**：完成 Codex 学习路径，形成全面的 AI 编码工具认知
5. **关注官方更新**：Claude Code 在快速迭代中，持续关注 Anthropic 的官方文档和 Changelog

**最后的练习**：

```bash
# 创建属于你自己的 hooks.json 配置
mkdir -p .claude

cat > .claude/hooks.json << 'EOF'
{
  "hooks": [
    {
      "matcher": "PostToolUse",
      "command": "bash -c 'case \"${CLAUDE_TOOL_FILE_PATH}\" in *.js|*.jsx|*.css) npx prettier --write \"${CLAUDE_TOOL_FILE_PATH}\";; esac'",
      "tools": ["Write", "Edit"]
    },
    {
      "matcher": "Stop",
      "command": "echo '[Hook] 会话结束 -' $(date)"
    }
  ]
}
EOF

# 启动 Claude Code 测试 Hooks 是否生效
claude
```
