## 工作流概览

在日常开发中，Claude Code 可以融入以下五个高频场景：

| 场景 | 典型指令 | 耗时 |
|------|----------|------|
| 代码审查 | "审查当前 git diff" | 2-5 分钟 |
| 代码重构 | "把这个函数拆成两个，提高可测试性" | 5-15 分钟 |
| Bug 调试 | "分析这个错误日志，找出根因" | 3-10 分钟 |
| 文档生成 | "为这个模块生成 JSDoc 注释" | 1-3 分钟 |
| 测试编写 | "为 auth.js 编写单元测试" | 5-10 分钟 |

下面逐一展开各场景的具体用法。

## 场景一：代码审查

提交代码前，让 Claude Code 帮你做一轮快速审查。在项目目录中启动 Claude 后：

```bash
# 查看当前修改
git diff

# 在 Claude 对话中输入
"请审查我当前的 git diff，重点关注：
1. 潜在的 null/undefined 引用
2. 错误处理是否完整
3. 是否有性能隐患
请用中文列出发现的问题和修复建议。"
```

Claude 会逐条分析 diff 中的代码变更，指出潜在问题并给出具体的修复代码。这特别适合团队中只有一个人做 code review 或者需要快速检查的场景。

## 场景二：重构

假设你有一个超过 200 行的函数需要拆分。传统做法需要你反复阅读代码、画出依赖关系、小心翼翼地移动逻辑。使用 Claude Code 则简单得多：

```bash
# 在 Claude 对话中输入
"请将 src/utils/report.js 中的 generateReport 函数拆分为三个独立函数：
1. fetchData — 负责数据获取
2. transformData — 负责数据转换和聚合
3. renderReport — 负责渲染输出
保持原有功能和测试用例不变。"
```

Claude 会自动理解函数的输入输出，合理切分职责边界，并更新所有调用方。重构完成后，你可以立即运行测试验证。

## 场景三：Bug 调试

当你遇到难以定位的 bug 时，直接把错误信息、相关代码文件和复现步骤告诉 Claude：

```bash
# 终端中看到错误：
# TypeError: Cannot read properties of undefined (reading 'items')
#     at processOrder (src/order.js:42:25)

# 在 Claude 对话中粘贴错误并说明
"我在运行 npm test 时遇到以下错误，请帮我分析根因：

TypeError: Cannot read properties of undefined (reading 'items')
    at processOrder (src/order.js:42:25)

我已经确认传入的 order 对象存在，但 items 字段可能是 undefined。
请查看 src/order.js 的 processOrder 函数，给出修复方案。"
```

Claude 会读取相关文件，分析数据的来龙去脉，找到 `items` 变为 `undefined` 的原因，并提供防御性编程的修复代码。

## 高效工作流技巧

以下是几个能让你的效率倍增的技巧：

1. **利用会话历史**：关机或关闭终端后，用 `claude --resume` 恢复上次会话，无缝继续工作。
2. **编写 .claude 指令文件**：在项目根目录创建 `.claude/instructions.md`，写入项目规范、技术栈、命名约定等。Claude Code 每次启动都会自动读取，确保生成的代码符合项目标准。
3. **批量文件操作**：一次性告诉 Claude 需要修改的多个文件，它会按依赖关系自动排序处理，避免手动逐个修改。

```markdown
# 示例 .claude/instructions.md 内容
- 使用 TypeScript 严格模式
- 所有函数必须有返回类型注解
- API 调用统一通过 src/services/api.ts
- 不要引入新的第三方依赖
```

## 下一步

掌握了日常开发工作流后，建议进一步学习 Claude Code Hooks 机制。Hooks 可以在特定事件触发时自动执行自定义脚本，让你的开发工作流更加自动化。
