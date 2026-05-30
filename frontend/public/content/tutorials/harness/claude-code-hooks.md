## 什么是 Hooks

Hooks 是 Claude Code 的事件钩子系统——类似 Git Hooks，允许你在 Claude 执行的特定阶段自动触发自定义脚本。通过 Hooks，你可以实现代码格式化、自动测试、安全检查等自动化工作流。

Claude Code 支持的 Hooks 触发点包括：

| 触发点 | 触发时机 |
|--------|----------|
| `PreToolUse` | 工具被调用之前 |
| `PostToolUse` | 工具执行完成之后 |
| `Notification` | Claude 发送通知时 |
| `Stop` | 主 Agent 响应结束时 |
| `SubagentStop` | 子 Agent 完成任务时 |

## Hooks 配置

Hooks 通过项目根目录或用户目录下的 JSON 文件配置。以下是一个典型的 `.claude/hooks.json` 示例：

```json
{
  "hooks": [
    {
      "matcher": "PostToolUse",
      "command": "npm run format"
    }
  ]
}
```

`matcher` 字段指定触发点，`command` 字段指定要执行的命令。你还可以使用 `env` 字段传递额外的环境变量。

## 实用 Hooks 示例

### 示例一：文件保存后自动格式化

每次 Claude 编辑文件后自动运行 Prettier 格式化代码：

```json
{
  "hooks": [
    {
      "matcher": "PostToolUse",
      "command": "npx prettier --write ${CLAUDE_TOOL_FILE_PATH}",
      "tools": ["Write", "Edit"]
    }
  ]
}
```

通过 `tools` 字段限定只对 `Write` 和 `Edit` 工具生效，避免不必要的格式化调用。

### 示例二：代码生成后自动运行测试

当 Claude 生成或修改了代码后，自动执行相关测试：

```json
{
  "hooks": [
    {
      "matcher": "Stop",
      "command": "npm test -- --bail --findRelatedTests ${CLAUDE_TOOL_FILE_PATH}"
    }
  ]
}
```

这确保每次交付的代码都能通过现有测试，在早期发现兼容性问题。

### 示例三：关键操作前安全检查

在 Claude 执行 `rm` 或 `git push` 等危险命令前进行确认：

```json
{
  "hooks": [
    {
      "matcher": "PreToolUse",
      "command": "bash -c 'echo \"即将执行: ${CLAUDE_TOOL_NAME}\"; exit 0'",
      "tools": ["Bash"]
    }
  ]
}
```

返回非零退出码可以阻止当前操作执行，相当于在 Claude 的"双手"上加了一道安全门禁。

## 完整工作流示例

将多个 Hooks 组合使用，可以构建一个完整的质量门禁流水线：

```json
{
  "hooks": [
    {
      "matcher": "PreToolUse",
      "command": "npm run lint -- ${CLAUDE_TOOL_FILE_PATH}",
      "tools": ["Write", "Edit"]
    },
    {
      "matcher": "PostToolUse",
      "command": "npx prettier --check ${CLAUDE_TOOL_FILE_PATH}",
      "tools": ["Write", "Edit"]
    },
    {
      "matcher": "Stop",
      "command": "npm test"
    }
  ]
}
```

这个配置实现了：编辑前 lint 检查 → 编辑后 format 验证 → 会话结束时全量测试的完整质量保障流程。

## 环境变量参考

Hooks 脚本中可访问以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `CLAUDE_TOOL_NAME` | 当前调用的工具名称 |
| `CLAUDE_TOOL_INPUT` | 工具的输入参数（JSON 字符串） |
| `CLAUDE_PROJECT_DIR` | 项目根目录路径 |
| `CLAUDE_MODEL` | 当前使用的模型名称 |

这些变量让你在 Hook 脚本中灵活获取上下文信息，实现复杂的自动化逻辑。

## 下一步

恭喜学完 Claude Code 的全部核心内容！你已经掌握了从基础概念、安装配置、项目实战到日常工作流和 Hooks 自动化的全链路知识。

建议的后续学习路径：

1. 在实际项目中持续使用 Claude Code，积累经验
2. 探索 Claude Code 与 CI/CD 流水线的集成
3. 阅读 Anthropic 官方文档，了解最新的功能更新

```bash
# 最后的练习：创建你自己的 hooks.json
mkdir -p .claude
cat > .claude/hooks.json << 'EOF'
{
  "hooks": [
    {
      "matcher": "Stop",
      "command": "echo 'Session ended at' $(date)"
    }
  ]
}
EOF
claude
```
