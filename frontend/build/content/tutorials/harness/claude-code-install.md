## 环境准备

在安装 Claude Code 之前，请确认你的系统满足以下要求：

- **操作系统**：macOS 10.15+、Windows 10+（WSL2 推荐）或 Linux（Ubuntu 20.04+/CentOS 8+）
- **Node.js**：v18.0.0 或更高版本（Claude Code 基于 Node.js 运行）
- **终端**：支持现代终端特性（iTerm2、Windows Terminal 或系统自带终端均可）
- **网络**：需要能够访问 api.anthropic.com（国内用户可能需要配置代理）

## 安装步骤

### 1. 检查 Node.js 版本

首先确认你的 Node.js 版本是否满足要求：

```bash
node --version
# 应输出 v18.0.0 或更高版本
# 如果版本过低，请使用 nvm 或从 nodejs.org 升级
```

### 2. 全局安装 Claude Code

通过 npm 将 Claude Code 安装到全局环境：

```bash
npm install -g @anthropic-ai/claude-code
```

安装完成后，可以通过以下命令验证是否安装成功：

```bash
claude --version
# 应输出版本号，如 1.0.0
```

### 3. 配置 API Key

Claude Code 需要 Anthropic API Key 才能正常工作。将你的 API Key 添加到 shell 配置文件中：

```bash
# 编辑 ~/.bashrc（如果使用 bash）
echo 'export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxxxxx"' >> ~/.bashrc

# 如果使用 zsh，则编辑 ~/.zshrc
echo 'export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxxxxx"' >> ~/.zshrc

# 重新加载配置
source ~/.bashrc  # 或 source ~/.zshrc
```

你也可以使用环境变量管理器（如 direnv）按项目配置 API Key，避免全局暴露。

## 验证配置

完成以上步骤后，进入一个代码项目目录，运行 Claude Code：

```bash
cd ~/my-project
claude
```

首次启动时，Claude Code 会询问你希望使用哪种模型（Sonnet 或 Opus）。选择后，你会看到一个交互式对话界面。尝试输入简单的指令来验证一切正常：

> "请列出当前目录下的所有文件，并说明项目结构"

如果 Claude 能正确回应，说明安装和配置已成功完成。

## 常见安装问题

### 问题一：npm install 报 EACCES 权限错误

这是因为 npm 全局目录需要管理员权限：

```bash
# 推荐方案：使用 nvm 管理 Node.js，避免权限问题
# 或修改 npm 全局目录：
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 问题二：API Key 不生效

确认环境变量已正确设置：

```bash
echo $ANTHROPIC_API_KEY
# 应输出你的 API Key
```

如果输出为空，检查 shell 配置文件是否正确加载。尝试重新打开终端窗口或手动执行 source 命令。
