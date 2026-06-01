## 项目目标

本章将带你用 Claude Code 构建一个实用的"Markdown 待办事项管理器"——一个 Node.js 命令行脚本。它能读取 Markdown 格式的待办文件，统计完成进度，并支持增删任务。

通过这个项目，你将完整体验：用自然语言描述需求 → Claude 生成代码 → 本地测试运行 → 迭代优化 的 AI 辅助开发流程。

## 启动 Claude Code

在终端中进入你的项目目录，启动 Claude Code：

```bash
mkdir ~/todo-manager && cd ~/todo-manager
claude
```

## 与 Claude 对话

在 Claude Code 的对话界面中，你可以直接用中文描述需求。以下是一个完整的对话示例：

> "请帮我创建一个 Node.js 脚本 `todo.js`，实现以下功能：
> 1. 读取当前目录下的 `tasks.md` 文件
> 2. 解析其中的待办事项（以 `- [ ]` 或 `- [x]` 开头）
> 3. 统计总数、已完成数和未完成数
> 4. 支持 `--add "新任务"` 参数添加任务
> 5. 支持 `--done 3` 参数标记第 3 个任务为完成
> 请使用 Node.js 内置的 fs 和 path 模块，不要引入第三方依赖。"

Claude 会分析你的需求，然后生成代码。以下是它可能生成的解析部分：

```javascript
function parseTasks(content) {
  const lines = content.split('\n');
  const tasks = [];
  let id = 0;
  for (const line of lines) {
    const match = line.match(/^- \[( |x)\] (.+)$/);
    if (match) {
      id++;
      tasks.push({
        id,
        done: match[1] === 'x',
        text: match[2].trim(),
      });
    }
  }
  return tasks;
}
```

生成代码后，你可以先创建一个测试用 `tasks.md` 文件，然后让 Claude 帮你运行测试：

```bash
# 创建一个示例 tasks.md
cat > tasks.md << 'EOF'
# 我的待办事项
- [x] 学习 Claude Code 基础
- [ ] 完成第一个项目
- [ ] 配置开发环境
- [x] 阅读文档
EOF

# 运行脚本
node todo.js
```

## 关键技巧

以下技巧能帮你更好地与 Claude Code 协作：

1. **需求说清楚，但不要一步到位**：先给出核心功能描述，让 Claude 生成初版代码，运行后再提出改进。这比一次性给出"完美需求"效果更好。
2. **分步骤推进**：复杂任务拆分成小步骤，每步验证通过后再继续。例如先实现文件读取和解析，再加统计功能，最后添加增删支持。
3. **使用 @ 引用文件**：在对话中输入 `@文件名`，Claude 会读取该文件内容作为上下文，这对于让 Claude 理解现有代码非常有用。
4. **善用上下文清理**：如果对话变得很长，可以用 `/clear` 命令清空对话历史，避免 Claude 被无关信息干扰。

## 下一步

恭喜你完成了第一个 Claude Code 项目！你已体验了从需求到代码再到测试的完整流程。接下来，建议学习 Claude Code 的日常工作流，了解如何在真实项目中更高效地使用它。
