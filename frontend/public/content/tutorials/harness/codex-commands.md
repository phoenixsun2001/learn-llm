## 学习目标

完成本章后，你将能够：

- 理解 Codex Commands 系统的设计理念
- 熟练使用所有内置 Commands 完成日常开发任务
- 创建项目级和用户级自定义 Commands
- 配置 Command 的权限和信任级别
- 将 Commands 融入日常开发工作流

## 学习路径

| 路径 | 适用人群 | 预计时间 | 内容 |
|------|----------|----------|------|
| **快速通道** | 熟悉类似工具的命令系统 | 15 分钟 | 内置 Commands 速览 + 自定义示例 |
| **完整路径** | 需要系统学习 | 25 分钟 | 从概念到工作流实践的完整路径 |

## 什么是 Commands

Commands（命令）是 Codex 的**能力入口点**——它们是预先定义的操作模板，让你用简短的关键词触发复杂的 AI 行为。Commands 之于 Codex，就像快捷键之于 IDE：减少重复输入，加速高频操作。

Commands 的设计理念：

- **一致性**：所有 Commands 以 `/` 开头，格式统一
- **可组合**：Commands 可以接受参数，链式使用
- **可扩展**：除内置 Commands 外，支持创建自定义 Commands
- **上下文感知**：Commands 执行时会自动获取当前项目和对话的上下文

## 内置 Commands 参考

以下按功能分类列出 Codex 的内置 Commands：

### 对话管理

| Command | 说明 | 示例 |
|---------|------|------|
| `/new` | 创建新的 Thread | `/new` |
| `/threads` | 列出所有 Thread | `/threads` |
| `/open <id>` | 切换到指定 Thread | `/open 3` |
| `/rename <name>` | 重命名当前 Thread | `/rename auth-refactor` |
| `/delete` | 删除当前 Thread | `/delete` |
| `/clear` | 清空当前对话上下文 | `/clear` |

### 代码操作

| Command | 说明 | 示例 |
|---------|------|------|
| `/explain` | 解释选中的代码 | `/explain` |
| `/fix` | 修复选中的代码问题 | `/fix` |
| `/refactor` | 重构选中的代码 | `/refactor 使用 async/await 替代 .then()` |
| `/test` | 为选中代码生成测试 | `/test` |
| `/doc` | 为选中代码生成文档 | `/doc` |
| `/review` | 审查选中代码 | `/review 检查安全漏洞` |

### 文件操作

| Command | 说明 | 示例 |
|---------|------|------|
| `/read <file>` | 读取指定文件 | `/read src/app.py` |
| `/edit <file>` | 编辑指定文件 | `/edit src/config.py` |
| `/create <file>` | 创建新文件 | `/create src/models/user.py` |
| `/find <pattern>` | 搜索代码模式 | `/find TODO` |
| `/structure` | 显示项目结构 | `/structure` |

### 终端操作

| Command | 说明 | 示例 |
|---------|------|------|
| `/run <cmd>` | 执行 Shell 命令 | `/run pytest -v` |
| `/build` | 运行项目构建 | `/build` |
| `/deploy` | 触发部署 | `/deploy staging` |
| `/deps` | 查看/管理依赖 | `/deps update` |

### 项目管理

| Command | 说明 | 示例 |
|---------|------|------|
| `/init` | 初始化 Codex 项目配置 | `/init` |
| `/context` | 查看/编辑上下文设置 | `/context` |
| `/settings` | 打开项目配置 | `/settings` |
| `/help` | 显示帮助信息 | `/help` |

## 创建自定义 Commands

### 项目级 Commands

项目级 Commands 放在 `.codex/commands/` 目录下，随项目一起通过 Git 分享给团队。

**语法**：每个 Command 是一个 Markdown 文件，文件名即为 Command 名称。

```markdown
<!-- .codex/commands/ship.md -->

# /ship

运行完整的发布前检查清单：
1. `npm test` — 运行所有测试
2. `npm run lint` — 代码风格检查
3. `npm run build` — 构建产物检查
4. 生成 CHANGELOG 条目

如果所有步骤通过，创建发布 commit 和 tag。
```

使用方式：

```
/ship
```

### 带参数的自定义 Commands

```markdown
<!-- .codex/commands/pr-review.md -->

# /pr-review <branch-name>

审查目标分支与当前分支的差异，生成 PR Review 报告。

检查项：
1. 代码风格和一致性
2. 潜在的 Bug 和安全问题
3. 性能影响
4. 测试覆盖是否充分
5. 文档是否需要更新

输出中文格式的审查报告，按严重程度排序。
```

使用方式：

```
/pr-review feature/user-auth
```

### 用户级 Commands

用户级 Commands 放在 `~/.codex/commands/` 目录下，在所有项目中可用：

```bash
mkdir -p ~/.codex/commands
```

示例：创建一个全局的"快速修复" Command：

```markdown
<!-- ~/.codex/commands/quick-fix.md -->

# /quick-fix

快速诊断并修复当前打开文件中的问题：
1. 检查语法错误
2. 检查未使用的导入
3. 检查潜在的 None/Null 引用
4. 自动应用修复

不要做大规模重构，只修复明确的错误和警告。
```

## Command 权限与信任级别

Commands 支持分级权限控制，确保安全性：

| 信任级别 | 说明 | 适用 Command 类型 |
|----------|------|-------------------|
| **Trusted** | 自动执行，无需确认 | 纯读操作（如 `/read`, `/explain`） |
| **Ask Once** | 首次使用时请求确认 | 大多数自定义 Commands |
| **Always Ask** | 每次执行都需要确认 | 写操作、Shell 执行、外部 API 调用 |
| **Blocked** | 完全禁止执行 | 被管理员锁定的危险操作 |

### 在 Commands 中声明信任级别

```markdown
<!-- .codex/commands/deploy-prod.md -->
# /deploy-prod
<!-- trust: always-ask -->
<!-- description: 部署到生产环境 — 此操作不可逆 -->

确认部署到生产环境前，执行：
1. 运行完整的回归测试套件
2. 验证所有环境变量已正确设置
3. 确认数据库备份已创建
4. 输出部署预览并请求二次确认
```

## 日常开发工作流模式

### 工作流一：代码审查工作流

```
1. 完成一个功能分支的开发
2. /pr-review main
   → Codex 生成完整的 PR Review 报告
3. 根据报告修复问题
4. git commit && git push
5. 创建 PR 时将审查报告作为描述
```

### 工作流二：重构工作流

```
1. /read src/services/old_module.py
   → 确认 Codex 已加载完整上下文
2. /refactor "拆分为多个独立模块，提取公共逻辑到 utils/"
   → Codex 给出重构方案
3. 审查方案 → 确认
4. /run pytest tests/
   → 验证重构后所有测试通过
5. /review "检查重构后是否有遗漏的引用"
```

### 工作流三：文档生成工作流

```
1. /doc
   → 为当前选中的函数/类生成文档字符串
2. /create README.md
   → 基于整个项目生成或更新 README
3. /create docs/API.md
   → 提取所有公共 API 生成 API 文档
```

### 工作流四：调试工作流

```
1. /run pytest --pdb
   → 运行测试并捕获错误
2. 粘贴错误输出到对话
3. /fix
   → Codex 自动定位并修复问题
4. /run pytest --lf
   → 只重新运行上次失败的测试
5. 重复直到所有测试通过
```

## Commands 组合实战

Commands 的真正威力在于组合使用：

### 组合一：新功能开发全流程

```
/new                    # 创建新 Thread
/create src/feature.py  # 创建功能文件
"实现用户提到的功能..."   # 自由对话
/test                   # 生成测试
/run pytest tests/      # 运行测试
/review                 # 审查代码
/fix                    # 修复发现的问题
/doc                    # 生成文档
```

### 组合二：Pull Request 准备

```
/review "作为 PR 审阅者检查所有变更"
/fix                    # 自动修复简单问题
/run npm test           # 确保测试通过
/run npm run lint       # 确保代码格式正确
"生成这个 PR 的 Conventional Commit 消息"
```

## Commands 最佳实践

1. **命名清晰**：Command 名应该自解释，如 `/pr-review` 而非 `/pr`
2. **单一职责**：每个 Command 做一件事，通过组合实现复杂流程
3. **包含描述**：在 Command 文件中清晰描述它的作用、前提条件和输出
4. **设置合适的信任级别**：写操作和 Shell 执行使用 `always-ask`，读操作用 `trusted`
5. **团队共享**：项目级 Commands 签入 Git，作为团队工作流规范的一部分
6. **持续迭代**：发现某个操作频繁重复时，立即抽象为 Command
7. **提供示例**：在 Command 描述中给出使用示例，降低学习成本

## 常见问题

**Q: Commands 和直接对话有什么区别？**

Commands 是预定义的模板，确保每次执行的一致性和完整性。直接对话更灵活但没有"检查清单"式的保证。对于团队的标准化操作，Commands 远优于自由对话。

**Q: 如何知道有哪些可用 Commands？**

```
/help     # 列出所有可用 Commands
/help fix # 查看特定 Command 的详细说明
```

**Q: 可以覆盖内置 Commands 吗？**

自定义 Commands 与内置 Commands 同名时会覆盖内置行为。不推荐覆盖核心 Commands（如 `/new`, `/help`），但可以为团队定制 `/review` 的检查标准。

**Q: Commands 可以调用其他 Commands 吗？**

支持。在自定义 Command 定义中使用 `/another-command` 即可链式调用。

## 下一步

掌握了 Commands 系统后，下一步学习 **Codex Skills 与 MCP 集成**——创建可复用的工作流模板，并通过 Model Context Protocol 连接外部工具和数据源。
