## 学习目标

完成本章后，你将能够：

- 根据操作系统选择正确的 Codex 安装路径
- 完成 OpenAI 账号登录和认证配置
- 成功启动 Codex App 或 CLI 并运行首次任务
- 排查常见的安装和启动问题
- 创建第一个 Thread 并完成读写操作

## 学习路径

| 路径 | 适用人群 | 预计时间 | 内容 |
|------|----------|----------|------|
| **快速通道** | 熟悉开发环境配置 | 15 分钟 | 直接安装 + 登录 + 首次运行 |
| **完整路径** | 需要详细指导 | 30 分钟 | 从系统要求到故障排查的完整流程 |

## 系统要求

| 要求项 | Windows | macOS | Linux |
|--------|---------|-------|-------|
| **操作系统** | Windows 10+ (21H2+) | macOS 12 Monterey+ | Ubuntu 20.04+ / Debian 11+ |
| **内存** | 8GB+（推荐 16GB） | 8GB+（推荐 16GB） | 8GB+（推荐 16GB） |
| **磁盘空间** | 1GB+（App）+ 模型文件 | 1GB+（App）+ 模型文件 | 500MB（CLI） |
| **Git** | Git 2.40+ | Git 2.40+ | Git 2.40+ |
| **Node.js** | v18.0.0+（仅 CLI） | v18.0.0+（仅 CLI） | v18.0.0+（仅 CLI） |
| **网络** | 可访问 api.openai.com | 同左 | 同左 |
| **OpenAI 账号** | ChatGPT Plus/Pro/Team 或 API 付费账号 | 同左 | 同左 |

## 方式一：Codex App 安装（推荐）

### Windows 安装

通过 Microsoft Store 安装：

1. 打开 **Microsoft Store**
2. 搜索 **"OpenAI Codex"**
3. 点击 **安装**
4. 安装完成后从开始菜单启动

或者从 OpenAI 官网下载：

1. 访问 https://openai.com/codex
2. 点击 **Download for Windows**
3. 运行下载的安装程序（`.exe`）
4. 按照安装向导完成安装

### macOS 安装

```bash
# 方式 A：从官网下载 .dmg
# 访问 https://openai.com/codex 下载 macOS 版本
# 将 Codex.app 拖入 Applications 文件夹

# 方式 B：通过 Homebrew（如果有 Cask）
brew install --cask openai-codex
```

首次启动 macOS 版时，如果遇到 **"无法验证开发者"** 的 Gatekeeper 警告：

1. 打开 **系统设置 → 隐私与安全性**
2. 在"安全性"部分找到 Codex 的提示
3. 点击 **"仍要打开"**

### Linux 桌面

Codex 在 Linux 上主要通过 CLI 方式使用，App 版目前为实验性支持：

```bash
# 通过 AppImage
wget https://github.com/openai/codex/releases/latest/download/Codex.AppImage
chmod +x Codex.AppImage
./Codex.AppImage
```

## 方式二：Codex CLI 安装（辅助工具）

CLI 版本适合在服务器环境、CI/CD 流水线中或配合终端使用：

```bash
# 1. 确认 Node.js 版本
node --version  # 需要 v18.0.0+

# 2. 全局安装 Codex CLI
npm install -g @openai/codex

# 3. 验证安装
codex --version

# 4. 查看安装路径
which codex  # Linux/macOS
where codex  # Windows
```

如果遇到权限错误（EACCES），使用 nvm 管理 Node.js 版本可避免此问题：

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# 安装并使用 Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# 重新安装 Codex CLI
npm install -g @openai/codex
```

## 登录与认证

### App 登录

1. 启动 Codex App
2. 点击 **"Sign in with OpenAI"**
3. 浏览器中完成 OpenAI 账号登录
4. 授权 Codex 访问你的账号权限
5. 回到 Codex App，确认登录成功

支持的账号类型：
- **ChatGPT Plus**（个人订阅，$20/月）
- **ChatGPT Pro**（专业订阅，$200/月）
- **ChatGPT Team**（团队订阅）
- **API 付费账号**（按量计费）

### CLI 认证

CLI 需要 API Key 或登录 Token：

```bash
# 方式 A：浏览器登录认证（推荐）
codex login
# 自动打开浏览器完成 OAuth 认证

# 方式 B：手动设置 API Key
export OPENAI_API_KEY="sk-proj-你的API密钥"

# 方式 C：通过 .env 文件
echo 'OPENAI_API_KEY=sk-proj-你的API密钥' > .env
echo '.env' >> .gitignore
```

**API Key 获取步骤**：

1. 访问 https://platform.openai.com/api-keys
2. 点击 "Create new secret key"
3. 复制 Key（格式：`sk-proj-...`），**立即保存，离开页面后无法再次查看**

### API Key 权限和作用域

创建 API Key 时建议配置最小权限：

| 权限 | 建议 | 说明 |
|------|------|------|
| 模型调用 | 仅必要模型 | 限制 Codex 只能调用 GPT-4.1、GPT-5 等开发用模型 |
| 速率限制 | 设置上限 | 防止意外超量使用 |
| 项目限制 | 绑定特定项目 | 通过 API Key 绑定到特定 Organization/Project |

### Windows PowerShell 环境变量

Windows 用户需要特别注意 PowerShell 的环境变量设置方式：

```powershell
# 当前会话
$env:OPENAI_API_KEY = "sk-proj-你的API密钥"

# 永久设置（用户级）
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-proj-你的API密钥", "User")

# 验证
echo $env:OPENAI_API_KEY
```

## 首次运行验证

### App 首次使用

1. 启动 Codex App
2. 点击 **"Open Project"** 选择本地项目文件夹
3. 等待 Codex 索引项目文件（首次可能需要 1-3 分钟）
4. 创建第一个 **Thread**（对话线程）
5. 输入简单指令验证：

```
"请列出这个项目的文件结构，告诉我这是什么类型的项目"
```

### CLI 首次使用

```bash
# 进入项目目录
cd ~/my-project

# 启动交互模式
codex

# 或一次性提问（管道模式）
codex -p "分析当前项目结构和技术栈"

# 或从 stdin 读取
echo "请分析这个错误" | codex -p "$(cat error.log)"
```

### 首个读写任务测试

```bash
# 在 Codex 对话中输入
"创建一个 hello.py 文件，包含一个函数 greet(name) 返回 'Hello, {name}!'
然后在文件中添加 if __name__ == '__main__' 块调用该函数。
最后运行 python hello.py 执行它。"
```

如果 Codex 能正确创建文件、写入内容并成功运行，说明安装和认证已完全就绪。

## 项目配置基础

### Thread 管理

Thread 是 Codex 的核心组织单元——每个 Thread 是一个独立的对话上下文：

| 操作 | App | CLI |
|------|-----|-----|
| 创建 Thread | 点击 "+" 按钮 | `/new` 命令 |
| 切换 Thread | 点击 Thread 列表 | `/threads` 查看列表 |
| 删除 Thread | 右键 Thread → Delete | `/delete` 命令 |
| 重命名 Thread | 双击 Thread 名称 | `/rename` 命令 |

### .codex 目录

Codex 在项目根目录使用 `.codex/` 目录存储项目级配置：

```bash
# Codex 配置目录结构
.codex/
├── config.json      # 项目级配置
├── commands/        # 自定义 Commands
├── skills/          # 自定义 Skills
└── mcp.json         # MCP 服务器配置
```

### 首次启动的推荐设置

```
"请帮我在 .codex/config.json 中设置：
1. 默认使用 Python 3.11+
2. 代码风格使用 Black 格式化
3. 测试框架使用 pytest
4. 禁止使用 any 类型"
```

## 防火墙与网络配置

### Windows 防火墙

首次启动 Codex App 时，Windows 防火墙可能弹出网络访问请求。**务必允许** Codex 通过防火墙访问网络，否则无法连接 OpenAI 服务。

### 企业代理环境

如果公司网络使用 HTTP 代理：

```bash
# 设置代理环境变量
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1

# Windows PowerShell
$env:HTTP_PROXY = "http://proxy.company.com:8080"
$env:HTTPS_PROXY = "http://proxy.company.com:8080"
```

### 国内用户网络

如果无法直接访问 OpenAI 服务，需要配置代理或使用 API 中转服务：

```bash
# 通过环境变量设置 API Base URL（如使用中转服务）
export OPENAI_BASE_URL="https://your-proxy.com/v1"
```

## 常见安装问题排查

### 问题一：App 启动后白屏或无响应

```
可能原因：GPU 驱动或渲染问题
解决方案：
1. Windows：更新显卡驱动 → 重启 → 重试
2. macOS：检查系统版本是否 ≥ macOS 12
3. 尝试以管理员/root 权限运行一次
```

### 问题二：登录认证失败

```
1. 确认 OpenAI 账号状态正常（未被封禁、额度未耗尽）
2. ChatGPT Free 计划可能不支持 Codex，需要 Plus 以上
3. 企业账号可能需要 IT 管理员开通 Codex 权限
4. 清除 App 缓存重新登录：
   - Windows: %APPDATA%\codex\
   - macOS: ~/Library/Application Support/codex/
```

### 问题三：CLI 命令找不到

```bash
# 确认全局 npm 包的 bin 目录在 PATH 中
npm list -g --depth=0 | grep codex
npm bin -g

# 确保该路径在 PATH 中
echo $PATH | grep "$(npm bin -g)"

# 如不在，添加到 shell 配置
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 问题四：npm 安装卡住

```bash
# 切换到国内镜像
npm config set registry https://registry.npmmirror.com
npm install -g @openai/codex

# 安装后切回
npm config delete registry
```

### 问题五：首次索引速度慢

```
大项目（1000+ 文件）首次索引可能需要 3-5 分钟。
建议在 .codex/config.json 中配置排除目录：
{
  "index": {
    "exclude": ["node_modules", "dist", "build", ".git", "__pycache__", "*.pyc"]
  }
}
```

## 完整验证检查清单

完成以下所有检查项，确认安装完全就绪：

- [ ] Codex App 或 CLI 可以正常启动
- [ ] OpenAI 账号登录成功（App 右上角显示用户头像）
- [ ] 成功添加第一个本地项目
- [ ] 项目文件索引完成（无报错）
- [ ] 创建了第一个 Thread
- [ ] 执行了一个读操作（如列出文件结构）
- [ ] 执行了一个写操作（创建并运行测试文件）
- [ ] CLI 中 `codex --version` 正常输出
- [ ] 环境变量/API Key 配置正确且不泄露在代码中

## 下一步

安装完成后，立即进入 **Codex Commands 与工作流入门**——学习 Codex 的命令系统，掌握驱动 Codex 高效工作的核心操作方式。
