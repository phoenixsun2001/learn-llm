## 项目目标

本章将带你用 Claude Code 从零构建一个实用的命令行工具：**Git Commit Message 生成器（gm）**。

这个工具会自动读取 Git 暂存区（staged changes）的内容，分析代码变更，然后生成符合 [Conventional Commits](https://www.conventionalcommits.org/) 规范的提交消息。例如：

```
feat(auth): add JWT token refresh endpoint

- Add POST /auth/refresh route
- Implement token rotation logic in AuthService
- Add refresh token expiry validation
- Update API documentation for new endpoint
```

**为什么选这个项目？** 因为它实际上教会你 Claude Code 最重要的几种协作模式：

- **文件读取与代码分析**：让 Claude 读取和理解本地代码
- **Git 集成**：通过 git 命令获取项目上下文
- **代码生成**：从需求描述到可运行的脚本
- **迭代优化**：运行测试后发现不足，逐步改进
- **配置管理**：添加 CLI 参数和配置文件支持

## 项目初始化

首先创建项目目录并初始化：

```bash
mkdir gm && cd gm
npm init -y
```

然后在这个目录中启动 Claude Code：

```bash
claude
```

## 第一步：描述核心需求

Claude Code 启动后，你会看到交互式对话界面。输入以下需求描述：

> "请帮我创建一个 Node.js 命令行工具 `gm`，功能是读取当前 Git 仓库的暂存区变更（git diff --cached），分析代码改动内容，然后生成符合 Conventional Commits 规范的提交消息。
>
> 具体要求：
> 1. 执行 `git diff --cached` 获取暂存区变更
> 2. 如果没有暂存文件，提示用户先执行 `git add`
> 3. 分析变更内容，自动判断类型（feat/fix/docs/refactor/test/chore）
> 4. 根据变更文件路径推断 scope（如 src/auth/ 则 scope 为 auth）
> 5. 生成英文的 commit subject + body
> 6. 输出建议的提交消息，询问用户是否直接执行 git commit
>
> 请使用 Node.js 内置模块（child_process, fs, path, readline），不引入第三方依赖。
> 脚本入口文件为 `gm.js`，在 package.json 中配置 bin 字段指向它。"

Claude 会先读取项目文件（此时几乎是空的），然后开始规划并生成代码。

## 第二步：审查生成的代码

Claude 生成代码后，不要直接接受。先让它解释关键设计决策：

> "请逐段解释你生成的代码，特别是：
> 1. 如何解析 git diff 输出并提取关键信息
> 2. 如何判断 commit 类型和 scope
> 3. commit message 的生成逻辑"

Claude 会生成类似这样的核心代码结构：

```javascript
// gm.js 核心伪代码结构
const { execSync } = require('child_process');
const readline = require('readline');

// 1. 检查是否在 Git 仓库中
function checkGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// 2. 获取暂存区变更
function getStagedDiff() {
  const diff = execSync('git diff --cached', { encoding: 'utf-8' });
  if (!diff.trim()) {
    console.error('暂存区为空，请先执行 git add');
    process.exit(1);
  }
  return diff;
}

// 3. 分析 diff 内容 → 判断类型和 scope
function analyzeDiff(diff) {
  // 分析变更的文件路径、变更类型
  // 推断 commit 类型和 scope
}

// 4. 生成 Conventional Commit message
function generateMessage(analysis) {
  // 组装 subject + body 格式
}
```

审查阶段的关键价值在于：**确保你理解 Claude 写了什么，而不是盲目接受黑盒输出**。

## 第三步：运行测试与迭代

让 Claude 帮你创建测试环境并运行：

```bash
# 在对话中告诉 Claude
"请帮我做以下操作：
1. 初始化 git 仓库（git init）
2. 创建几个示例文件并暂存
3. 运行 gm.js 查看输出
4. 根据结果分析是否有需要改进的地方"
```

Claude 会执行这些命令，然后你会看到类似输出：

```bash
git init
echo 'function hello() { return "world"; }' > src/utils.js
mkdir -p src/auth
echo 'export default function login() {}' > src/auth/login.js
git add src/
node gm.js

# 预期输出：
# feat(utils): add utility functions
#
# - Add hello function in src/utils.js
```

## 第四步：处理边界情况

基础功能跑通后，向 Claude 提出更多边界要求：

> "目前还有一些边界情况需要处理：
>
> 1. 如果暂存区包含二进制文件（图片、字体等），应该跳过的提示
> 2. 如果变更超过 500 行，应该生成更简洁的摘要
> 3. 添加 `--type` 参数让用户手动指定 commit 类型
> 4. 添加 `--dry-run` 参数，只显示消息不执行提交
> 5. 添加 `--lang zh` 参数，支持生成中文提交消息
>
> 请逐个实现这些功能，每实现一个就运行测试验证。"

这是 Claude Code 最具价值的用法：**增量迭代**。每个小功能实现后立即验证，而不是一口气写 500 行然后祈祷它能跑。

```bash
# Claude 会依次实现每个功能并测试
# 例如 --dry-run 模式：
node gm.js --dry-run
# 仅输出建议的 commit message，不执行 git commit

# 手动指定类型：
node gm.js --type docs
# 强制使用 docs 类型生成提交消息

# 中文模式：
node gm.js --lang zh
# 生成中文的提交消息
```

## 第五步：添加配置支持

工具已经可以工作了，但每次输入参数比较麻烦。让 Claude 添加配置文件支持：

> "再添加一个功能：支持从 `.gmrc.json` 配置文件读取默认选项。
>
> 配置文件格式示例：
> ```json
> {
>   "lang": "zh",
>   "maxDiffLines": 500,
>   "scopes": {
>     "src/auth": "auth",
>     "src/api": "api",
>     "docs": "docs"
>   }
> }
> ```
>
> 命令行参数的优先级高于配置文件。"

这样就把工具从一个一次性脚本升级为可配置的专业工具。

## 第六步：收尾与发布准备

最后让 Claude 帮你补充发布所需的周边文件：

> "请帮我添加以下文件：
> 1. README.md — 包含安装说明、使用示例、所有命令行参数文档
> 2. 在 package.json 中添加 `npm link` 支持
> 3. 更新 .gitignore 忽略 node_modules 和 .env"

```bash
# Claude 会生成 README、更新 package.json
# 然后你可以测试全局安装
npm link
cd ~/another-project
gm --dry-run
```

## 关键技巧总结

通过这个项目，你已经掌握了 Claude Code 的几种核心协作模式：

### 1. 从粗到细的迭代法

不要一次性给出过于详细的 spec。先用一句自然语言描述核心功能，让 Claude 生成初版，运行后提出改进。这种 "conversation-driven development" 往往比传统的 "write-spec-then-code" 效率更高。

### 2. 使用 @ 引用文件

当你在对话中需要 Claude 参考某个文件时，输入 `@文件路径` 即可让 Claude 读取它：

```
"请参考 @src/old-parser.js 中的解析逻辑，在新的 parser 中实现同样的功能，但处理更多的边界情况。"
```

### 3. 分步骤推进复杂任务

"请实现用户认证系统"是一个糟糕的 prompt。更好的方式是：

```
"先创建 user model 和数据库迁移文件"
→ 验证通过
"然后实现注册 API 端点"
→ 验证通过
"然后添加 JWT 登录逻辑"
→ 验证通过
```

每一步都在 Claude 的上下文中累积，它知道之前做了什么。

### 4. 利用 `/clear` 管理上下文

如果对话变得很长（超过 30 轮），Claude 可能被早期无关信息干扰。用 `/clear` 清空上下文后重新开始，但要注意——这也会清除 Claude 对之前工作的记忆，所以适合在完成一个大的阶段后使用。

### 5. 错误修复的"粘贴即修"模式

当 Claude 生成的代码运行报错时，最有效的方式是：

```
"运行 node gm.js 时报错：
TypeError: Cannot read properties of null (reading 'match')
    at analyzeDiff (gm.js:45:22)

这说明 diff 解析逻辑在处理空文件时有问题，请修复。"
```

直接把错误信息粘贴给 Claude，它会读取相关代码行、分析原因、修改代码。

## 常见陷阱与应对

| 陷阱 | 表现 | 应对策略 |
|------|------|----------|
| **一次性需求过多** | Claude 生成大量代码但编译不通过 | 拆分需求，逐个实现和验证 |
| **过度信任生成代码** | 没有审查直接运行，导致数据丢失 | 始终先审查 diff，再确认运行 |
| **上下文过长** | 对话超过 50 轮后 Claude 开始"忘记"早期决策 | 及时 `/clear`，或在 CLAUDE.md 中记录关键决策 |
| **不明确的技术栈** | Claude 用了你不想用的库或模式 | 在 CLAUDE.md 中写明技术栈限制 |
| **忽略权限确认** | 习惯性 Allow All，导致意外修改 | 至少在前几轮手动确认每个操作 |

## 下一步

恭喜！你已经用 Claude Code 完成了一个从零到可用的实用工具。接下来，建议学习 Claude Code 的**日常工作流**——掌握代码审查、重构、调试等 6 个高频场景的进阶用法。
