## 学习目标

完成本章后，你将能够：

- 在 Windows、macOS 或 Linux 上完成 Claude Code 的安装
- 正确配置 Anthropic API Key 并理解权限作用域
- 验证安装完整性并通过首次运行检查
- 排查 10 种以上常见安装和认证问题
- 配置无头/服务器环境下的 Claude Code

## 学习路径

| 路径 | 适用人群 | 预计时间 | 内容 |
|------|----------|----------|------|
| **快速通道** | 熟悉 npm/Node.js 环境 | 10 分钟 | 安装 + API Key + 验证 |
| **完整路径** | 需要各平台详细指引 | 25 分钟 | 全平台 + 故障排查 + 无头部署 |

## 环境准备

在安装 Claude Code 之前，请确认你的系统满足以下要求：

| 要求项 | Windows | macOS | Linux |
|--------|---------|-------|-------|
| **操作系统** | Windows 10+ (推荐 WSL2) | macOS 12 Monterey+ | Ubuntu 20.04+ / Debian 11+ / CentOS 8+ |
| **Node.js** | v18.0.0+ | v18.0.0+ | v18.0.0+ |
| **npm** | v9.0.0+（随 Node.js 附带） | v9.0.0+ | v9.0.0+ |
| **终端** | Windows Terminal（推荐）| iTerm2、Warp、Kitty | GNOME Terminal、Kitty |
| **网络** | 可访问 api.anthropic.com | 同左 | 同左 |
| **磁盘空间** | 约 500MB（含依赖） | 同左 | 同左 |
| **Git** | 2.40+（用于项目协作） | 2.40+ | 2.40+ |

### Windows 与 WSL2

**强烈推荐 Windows 用户使用 WSL2**。虽然 Claude Code 在原生 PowerShell/CMD 中也可运行，但 WSL2 提供更好的性能、完整的 Unix 工具链支持，以及更少的路径兼容性问题。

```powershell
# 在 PowerShell（管理员）中安装 WSL2
wsl --install -d Ubuntu-24.04

# 重启后进入 Ubuntu，然后按照 Linux 安装步骤操作
```

如果你必须在原生 Windows 上运行：

```powershell
# 使用 PowerShell 7+（非 Windows PowerShell 5）
# 安装 Node.js 从 https://nodejs.org （选择 LTS 版本）
# 使用 Windows Terminal 而非 cmd.exe
```

### macOS 注意事项

- 确保 Xcode Command Line Tools 已安装：`xcode-select --install`
- 如果使用 Homebrew 安装的 Node.js，注意全局 npm 包路径可能与系统 Node.js 不同

### Linux 注意事项

- 需要 `build-essential`（Ubuntu/Debian）或 `Development Tools`（CentOS/RHEL）用于编译原生模块
- 某些最小化安装的 Linux 发行版可能需要额外安装 `python3` 和 `make`

## 安装步骤

### 1. 检查 Node.js 版本

首先确认你的 Node.js 版本是否满足要求：

```bash
node --version
# 应输出 v18.0.0 或更高版本，例如 v20.11.0

npm --version
# 应输出 v9.0.0 或更高版本，例如 v10.2.4
```

如果版本过低，推荐使用 nvm（Node Version Manager）安装和管理 Node.js 版本：

```bash
# 安装 nvm（如果尚未安装）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc  # 或 source ~/.zshrc

# 安装并使用 Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# 再次验证版本
node --version
```

### 2. 全局安装 Claude Code

通过 npm 将 Claude Code 安装到全局环境：

```bash
npm install -g @anthropic-ai/claude-code
```

安装过程通常需要 30 秒到 2 分钟，取决于网络速度。安装完成后，验证安装是否成功：

```bash
claude --version
# 应输出版本号，例如 1.0.37

which claude
# 应输出 claude 命令的完整路径，例如 /usr/local/bin/claude
```

### 3. 配置 API Key

Claude Code 需要 Anthropic API Key 才能正常工作。

#### 获取 API Key 的步骤：

1. 访问 https://console.anthropic.com/
2. 注册或登录你的 Anthropic 账号
3. 进入 **API Keys** 页面
4. 点击 **"Create Key"** 生成新的 API Key
5. 复制 Key（格式为 `sk-ant-api03-xxxxxxxxxxxxx`），**请立即保存，离开页面后将无法再次查看**

#### API Key 权限作用域

创建 Key 时建议配置最小权限：

| 设置项 | 推荐值 | 说明 |
|--------|--------|------|
| **Workspace** | 绑定到特定 Workspace | 限制 Key 的作用范围 |
| **API Key Type** | User API Key | 用于个人开发，非生产应用 |
| **Rate Limit** | 设置合理上限 | 防止意外超量使用 |
| **Expiration** | 90 天或自定义 | Key 过期后需轮换 |

> **安全提醒**：API Key 是访问 Anthropic 服务的凭证。不要将其硬编码在代码中、分享给他人、或提交到 Git 仓库。

#### 配置环境变量：

根据你使用的 Shell 选择对应的配置文件：

```bash
# === Bash 用户 (~/.bashrc) ===
echo 'export ANTHROPIC_API_KEY="sk-ant-api03-你的API密钥"' >> ~/.bashrc
source ~/.bashrc

# === Zsh 用户 (~/.zshrc) ===
echo 'export ANTHROPIC_API_KEY="sk-ant-api03-你的API密钥"' >> ~/.zshrc
source ~/.zshrc

# === Fish 用户 (~/.config/fish/config.fish) ===
echo 'set -gx ANTHROPIC_API_KEY sk-ant-api03-你的API密钥' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

#### 使用 .env 文件（按项目配置）：

你也可以在项目根目录创建 `.env` 文件来管理 API Key，避免全局暴露：

```bash
# 在项目根目录创建 .env 文件
echo 'ANTHROPIC_API_KEY=sk-ant-api03-你的API密钥' > .env

# 确保 .env 已加入 .gitignore
echo '.env' >> .gitignore
```

Claude Code 启动时会自动读取项目根目录的 `.env` 文件。

### 4. 配置代理（国内用户）

如果你在国内且无法直接访问 api.anthropic.com，需要配置 HTTP 代理：

```bash
# 在 shell 配置文件中添加代理设置
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
```

CLI 工具通常不会自动使用系统代理，因此显式设置环境变量是必要的。

## 首次运行

完成配置后，启动 Claude Code：

```bash
# 进入任意项目目录
cd ~/my-project

# 启动 Claude Code（交互模式）
claude

# 或者使用一次性提问模式（非交互）
claude -p "请分析当前项目的技术栈和架构"
```

首次启动时，Claude Code 会：

1. 扫描当前目录并构建代码库索引
2. 检查 `.claude/` 目录下的项目配置
3. 询问你希望默认使用哪种模型（推荐选择 Sonnet）
4. 显示交互式对话界面，等待你的指令

尝试输入简单指令来验证一切正常：

> "请列出当前目录下的所有文件，并说明项目结构"

如果 Claude 能正确回应，说明安装和配置已成功完成。

## 配置基础

### CLAUDE.md 项目规范文件

在项目根目录创建 `CLAUDE.md` 文件，定义项目规范——Claude Code 每次启动都会自动读取：

```markdown
# CLAUDE.md 示例

## 技术栈
- 前端：React 18 + JavaScript + CSS 变量
- 后端：Node.js + Express
- 数据库：PostgreSQL

## 编码规范
- 使用函数组件和 Hooks，不用 Class 组件
- CSS 类名使用 kebab-case
- 所有 API 调用统一通过 src/services/api.js
- 不要引入新的第三方依赖库

## 架构约定
- 组件放在 src/components/[ComponentName]/ 目录
- API 路由放在 src/routes/ 目录
- 数据库迁移文件放在 migrations/ 目录
```

### 用户级配置 (~/.claude/)

Claude Code 支持用户级配置，存放在 `~/.claude/` 目录下：

```bash
# 查看用户级配置目录
ls -la ~/.claude/

# 常见的配置文件
# ~/.claude/settings.json  — 全局设置（模型、权限等）
# ~/.claude/credentials    — API 凭证（自动生成）
# ~/.claude/commands/      — 用户级自定义命令
# ~/.claude/hooks.json     — 全局 Hooks 配置
```

### 模型选择策略

```bash
# 默认使用 Sonnet（推荐日常使用）
claude

# 复杂任务使用 Opus
claude --model claude-opus-4-20250514

# 成本敏感任务使用 Haiku
claude --model claude-haiku-3-5-20241022
```

## IDE 集成

### VS Code 集成

安装 Claude Code VS Code 扩展后，你可以在编辑器内使用 Claude Code 的对话功能：

```bash
# 在 VS Code 中搜索并安装 "Claude Code" 扩展
# 或者从命令行安装
code --install-extension anthropic.claude-code
```

安装后，使用 `Cmd/Ctrl + Shift + P` 打开命令面板，搜索 "Claude Code" 即可启动。

### JetBrains 集成

JetBrains IDE（IntelliJ、WebStorm、PyCharm 等）可通过插件市场安装 Claude Code 插件：

1. 打开 Settings → Plugins → Marketplace
2. 搜索 "Claude Code"
3. 安装并重启 IDE

## 无头/服务器环境部署

在 CI/CD 或远程服务器上使用 Claude Code：

```bash
# 1. 最小化安装
npm install -g @anthropic-ai/claude-code

# 2. 通过环境变量传递 API Key（无需交互）
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# 3. 使用非交互模式
claude -p "请审查本次 PR 变更" < diff.patch > review.md

# 4. 在 CI/CD 脚本中使用
# .github/workflows/claude-review.yml
- name: Code Review
  run: |
    git diff origin/main...HEAD | claude -p "Review this diff for security issues" > review.md
```

无头环境的关键注意事项：

- **无交互模式**：使用 `-p` 标志，不启动交互式 TUI
- **环境变量优先**：API Key 通过环境变量传递，不依赖配置文件
- **超时设置**：CI 环境建议设置命令超时（如 300 秒）
- **输出重定向**：将结果写入文件而非终端输出

## 常见安装问题排查

### 问题一：npm install -g 报 EACCES 权限错误

```
Error: EACCES: permission denied, access '/usr/local/lib/node_modules'
```

这是因为 npm 全局目录需要管理员权限。**推荐方案**是使用 nvm 管理 Node.js（见上文），它会将全局包安装到用户目录下。或者手动修改 npm 全局目录：

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 问题二：claude 命令找不到

```bash
# 确认全局 npm 包的 bin 目录在 PATH 中
npm list -g --depth=0

# 检查 npm 全局 bin 路径
npm bin -g

# 确保该路径在 PATH 中
echo $PATH | grep "$(npm bin -g)"
```

### 问题三：API Key 不生效（认证失败）

```bash
# 第一步：确认环境变量已设置
echo $ANTHROPIC_API_KEY
# 应输出你的 API Key（如无输出则说明未设置）

# 第二步：确认 Key 格式正确
# 正确的格式：sk-ant-api03-xxxxxxxxxxxxx
# 注意：没有多余的空格或引号

# 第三步：检查网络连通性
curl -I https://api.anthropic.com
# 应返回 HTTP/2 200 或其他非错误状态码

# 第四步：如果使用代理，确认代理设置
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 第五步：检查 API Key 是否过期或被撤销
# 登录 https://console.anthropic.com/ 检查 Key 状态
```

### 问题四：Node.js 版本不兼容

```bash
# 某些系统自带的 Node.js 版本过旧
# 使用 nvm 安装推荐版本
nvm install 20
nvm use 20

# 确认当前使用的版本
node --version  # 应为 v20.x.x
```

### 问题五：npm 安装卡住或超时

```bash
# 切换到国内镜像源（如 npmmirror.com）
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install -g @anthropic-ai/claude-code

# 安装完成后可以切回默认源
npm config delete registry
```

### 问题六：WSL2 无法访问 Windows 网络

```bash
# 在 WSL2 中测试网络连通性
curl -I https://api.anthropic.com

# 如果失败，检查 WSL2 网络配置
# 在 Windows PowerShell（管理员）中：
wsl --shutdown
# 重启 WSL2 后重试

# 也可以尝试在 ~/.wslconfig 中设置：
[wsl2]
networkingMode=mirrored
```

### 问题七：macOS Gatekeeper 阻止

```bash
# 如果通过 Homebrew 安装的 Node.js 遇到权限问题：
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

## 首次运行验证检查清单

完成安装后，逐项验证：

- [ ] `claude --version` 正常输出版本号
- [ ] `echo $ANTHROPIC_API_KEY` 输出正确的 Key（以 `sk-ant-api03-` 开头）
- [ ] `curl -I https://api.anthropic.com` 返回成功状态码
- [ ] 在一个空目录中启动 `claude`，可以进入交互界面
- [ ] 输入 "列出当前目录的文件结构"，Claude 正确响应
- [ ] `echo "用一句话介绍你自己" | claude -p` 管道模式正常工作
- [ ] `.env` 文件已加入 `.gitignore`（如使用 .env 方式）
- [ ] Key 未出现在任何代码文件或 git 历史中

## 下一步

安装完成后，建议立即进入**第一个实战项目**章节——我们将用 Claude Code 从零构建一个 Git Commit Message 生成器，完整体验 AI 辅助开发的完整流程。
