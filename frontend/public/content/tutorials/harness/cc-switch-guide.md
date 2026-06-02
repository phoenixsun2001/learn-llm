## What is CC Switch

CC Switch 是一个开源的跨平台桌面应用，专为解决 AI 编程 CLI 工具的"供应商管理碎片化"问题而设计。当你同时使用 Claude Code、Codex、Gemini CLI 等多个 AI 编码助手时，每个工具都需要独立配置 API Provider、Key、代理等参数。当你的 API 供应商出现故障，或想从官方 API 切换到第三方代理时，需要逐个修改配置文件——这个过程繁琐且容易出错。

CC Switch 将所有这些配置统一到一个管理界面中，提供一键切换 API 供应商、内置代理高可用、Token 用量追踪和成本估算等功能。它基于 Tauri 2 + React + Rust + SQLite 构建，原生性能，资源占用极低。

**核心价值：**

- 统一管理多个 AI 编码工具的供应商配置，告别分散的配置文件
- 一键切换 API Provider，无需手动编辑环境变量或配置文件
- 内置代理服务实现自动故障转移，保障 AI 编码工具的高可用性
- 实时追踪 Token 用量和成本，让 API 消费一目了然
- 支持 MCP Server、Prompts、Skills 的图形化管理

## Supported Tools and Platforms

CC Switch 支持以下 AI 编码 CLI 工具：

| 工具 | 说明 |
|------|------|
| **Claude Code** | Anthropic 官方 CLI 编码助手 |
| **Codex** | OpenAI 官方桌面/CLI 编码助手 |
| **Gemini CLI** | Google Gemini 命令行工具 |
| **OpenCode** | 开源 AI 编码 CLI 工具 |
| **OpenClaw** | 开源 AI 编程助手 |
| **Hermes Agent** | 开源 AI Agent 框架 |

**支持平台：**

- Windows 10 及以上
- macOS 12 及以上
- Linux（Ubuntu 22.04+ / Debian 12+ / Fedora 40+）

## Installation

### 从 GitHub Releases 安装（推荐）

访问 [GitHub Releases](https://github.com/ccswitch/cc-switch/releases) 页面，下载对应平台的安装包：

**Windows：**

```bash
# 下载 .msi 或 .exe 安装包，双击运行即可
```

**macOS：**

```bash
# 下载 .dmg 文件，拖入 Applications 文件夹
# 如果提示安全问题，在 系统设置 → 隐私与安全性 中允许运行
```

**Linux：**

```bash
# Debian/Ubuntu
sudo dpkg -i cc-switch_*.deb

# Fedora
sudo rpm -i cc-switch_*.rpm

# 或使用 AppImage
chmod +x cc-switch_*.AppImage
./cc-switch_*.AppImage
```

### 从官方站点下载

访问 [ccswitch.io](https://ccswitch.io) 下载最新版本。

安装完成后首次启动，CC Switch 会自动初始化本地 SQLite 数据库，用于存储你的供应商配置和用量数据。所有数据默认存储在本机，不上传到云端。

## Quick Start: Add Your First API Provider

启动 CC Switch 后，按以下步骤添加你的第一个 API 供应商：

### Step 1: 打开供应商管理

点击左侧导航栏的「Providers」进入供应商管理页面。

### Step 2: 添加新供应商

点击「Add Provider」按钮，填写以下信息：

```json
{
  "name": "Anthropic Official",
  "type": "anthropic",
  "base_url": "https://api.anthropic.com",
  "api_key": "sk-ant-api03-xxxxxxxxxxxxx",
  "models": ["claude-sonnet-4-20250514", "claude-opus-4-20250514"],
  "default": true
}
```

- **name**：供应商的显示名称，便于识别
- **type**：供应商类型，支持 anthropic、openai、gemini 等
- **base_url**：API 端点地址
- **api_key**：你的 API Key（加密存储于本地数据库）
- **models**：该供应商支持的模型列表
- **default**：设为默认供应商

### Step 3: 连接到 Claude Code

切换到「Tools」标签页，找到 Claude Code，点击「Connect」。CC Switch 会自动将配置写入 Claude Code 的环境变量或配置文件中。

对于 Claude Code，CC Switch 会管理以下环境变量：

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

配置完成后，你的 Claude Code 就可以使用新添加的供应商了。无需重启终端，配置即时生效。

## Provider Management

### 供应商切换

CC Switch 的核心功能之一是快速切换供应商。在 Providers 页面，每个供应商卡片上都有一个开关按钮。点击即可切换活动状态——当前正在使用的供应商会显示绿色标识。

**常见切换场景：**

- 官方 API 额度耗尽时切换到代理供应商
- 从海外官方 API 切换到国内代理以获得更低延迟
- 在不同模型供应商间灵活切换（如从 Anthropic 切换到兼容 Anthropic API 的第三方模型）

### 供应商模板

对于常用的供应商配置，CC Switch 提供模板功能。在添加供应商时，可以选择预设模板：

- **Anthropic Official**：官方 API，适合海外用户
- **OpenAI Compatible Proxy**：兼容 OpenAI 格式的代理模板
- **Gemini Official**：Google Gemini 官方 API

你也可以将自己的配置保存为模板，方便在不同机器间共享或快速创建新供应商。

### 连接测试

添加或修改供应商后，使用「Test Connection」按钮验证配置是否正确。CC Switch 会发送一个轻量级 API 请求，验证：

1. API 端点可达性
2. API Key 有效性
3. 模型列表可用性

测试结果会显示延迟和可用模型信息。

## Proxy & High Availability

CC Switch 内置了代理服务和高可用机制，这是它区别于其他配置管理工具的亮点功能。

### 内置代理服务

启用代理服务后，CC Switch 在本机启动一个轻量级 HTTP 代理（默认端口 8123），所有 AI 工具通过这个代理访问 API。

**架构示意：**

```text
Claude Code / Codex / Gemini CLI
         │
         ▼
   CC Switch Proxy (localhost:8123)
         │
    ┌────┴────┬─────────┐
    ▼         ▼         ▼
Provider A  Provider B  Provider C
(Anthropic) (Proxy)    (OpenAI)
```

### 自动故障转移（Auto-Failover）

配置多个供应商后，CC Switch 的代理服务会实现自动故障转移：

1. 请求首先发送到主供应商（Priority 最高）
2. 如果主供应商返回 5xx 错误或超时，自动切换到备用供应商
3. 故障转移对 AI 工具完全透明，无需修改任何代码

**配置示例：**

```json
{
  "failover": {
    "enabled": true,
    "retry_count": 3,
    "retry_delay_ms": 1000,
    "fallback_providers": ["proxy-provider-1", "proxy-provider-2"]
  }
}
```

### 熔断器（Circuit Breaker）

当某个供应商连续失败达到阈值，CC Switch 会自动将该供应商标记为"熔断"状态，暂时不再向其发送请求。熔断期间，所有请求路由到备用供应商。

- **半开状态**：熔断后每隔 30 秒发送一个探测请求，如果成功则恢复
- **全开状态**：连续失败 5 次后完全熔断，拒绝所有请求
- **恢复条件**：探测请求连续成功 2 次后恢复正常

这种机制有效避免了级联故障，确保 AI 编码工具的持续可用。

## Token Tracking and Cost Estimation

CC Switch 通过代理层拦截所有 API 请求，自动统计 Token 用量。

### 实时用量统计

在 Dashboard 页面可以查看：

- 每个供应商的 Token 消耗量（Input/Output）
- 每个模型的用量分布
- 按时间维度（小时/天/月）的用量趋势图

### 成本估算

CC Switch 内置了主流模型的定价信息，自动计算 API 使用成本：

```text
Model: claude-sonnet-4-20250514
Input Tokens: 1,250,000
Output Tokens: 380,000
Estimated Cost: $7.65 (Input: $3.75 + Output: $3.90)
```

你可以在设置中自定义模型定价，适配不同供应商的计费策略。

**支持的成本分析维度：**

- 按工具统计（哪个 AI 工具消耗最多）
- 按项目统计（需要配合项目标签使用）
- 按时间段统计（日报/周报/月报）

## MCP Server Management

CC Switch 提供了 MCP（Model Context Protocol）Server 的图形化管理界面。

### 管理 MCP Server

在「MCP」页面可以：

- **添加 MCP Server**：填写 Server 名称、命令、参数和环境变量
- **启用/禁用**：一键开关 MCP Server
- **查看状态**：实时显示 MCP Server 运行状态
- **日志查看**：内置日志面板，方便调试 MCP 连接问题

**配置示例（Filesystem MCP Server）：**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-filesystem", "/path/to/allowed/dir"],
      "env": {}
    }
  }
}
```

添加后，CC Switch 会自动将 MCP 配置同步到对应工具的 `.mcp.json` 配置文件中。

## Prompts and Skills Management

### Prompts 管理

Prompts 是可复用的提示词模板。在「Prompts」页面管理：

- **创建 Prompt 模板**：支持变量占位符 `{{variable}}`
- **分类组织**：按项目或用途分类
- **快速调用**：在支持的 AI 工具中直接引用

**Prompt 模板示例：**

```markdown
你是一个资深的 {{language}} 开发者。请审查以下代码，关注：

1. 安全问题
2. 性能瓶颈
3. 代码可维护性

代码变更：
{{diff}}
```

### Skills 管理

Skills 是包含指令和上下文的可复用能力单元。CC Switch 支持：

- **导入/导出 Skills**：与社区分享或从社区获取 Skills
- **工具关联**：指定 Skills 适用的 AI 工具
- **版本管理**：跟踪 Skills 的更新历史

## Real Workflow Example

以下是一个真实的使用场景：使用 CC Switch 在 Claude Code 的官方 API 和国内代理之间切换。

### 场景设定

你是中国开发者，日常使用 Claude Code。白天官方 API 速度较慢，希望使用国内代理；晚上需要对安全敏感的项目，切换回官方 API。

### 配置步骤

**1. 添加两个供应商：**

```json
// Provider 1: 官方 API
{
  "name": "Anthropic Official",
  "base_url": "https://api.anthropic.com",
  "api_key": "sk-ant-api03-xxxxx",
  "priority": 2
}

// Provider 2: 国内代理
{
  "name": "China Proxy",
  "base_url": "https://api.proxy.example.com",
  "api_key": "sk-proxy-xxxxx",
  "priority": 1
}
```

**2. 配置自动故障转移：**

```json
{
  "failover": {
    "enabled": true,
    "fallback_providers": ["Anthropic Official"],
    "retry_count": 2
  }
}
```

**3. 日常工作流：**

```bash
# 早上开始工作，确认使用代理
# 在 CC Switch 中将 "China Proxy" 设为活跃

# Claude Code 正常使用，请求通过代理转发
$ claude "帮我添加一个登录页面"

# 如果代理出现故障，CC Switch 自动切换到官方 API
# 开发者无需手动干预，工作不中断

# 晚上切换到安全项目
# 在 CC Switch 中切换到 "Anthropic Official"
$ claude "审查这段认证代码的安全性"
```

通过 CC Switch 的用量面板，你可以看到全天两个供应商各自的 Token 消耗和成本，以及故障转移发生的次数和时间。

## Tips and Best Practices

### 安全性

- **API Key 安全**：CC Switch 使用 SQLite 加密存储 API Key。建议为 CC Switch 设置主密码，进一步增强安全性。
- **不要共享数据库文件**：`cc-switch.db` 包含你的 API Key，不要提交到版本控制或分享给他人。
- **定期轮换 API Key**：建议每 90 天轮换一次 API Key。CC Switch 的供应商管理让这一操作变得非常简单。

### 性能优化

- **减少模型选择**：每个供应商只配置常用模型，减少 API 调用时的选择复杂度。
- **合理设置熔断阈值**：根据你的网络环境调整熔断参数。网络不稳定时建议增大 `retry_delay_ms`。
- **代理端口**：如果 8123 端口被占用，在设置中更改为其他可用端口。

### 工作流建议

- **多供应商策略**：至少配置 2 个供应商（官方 + 备用），确保高可用。
- **用量预算**：在设置中配置月度 Token 预算，接近上限时 CC Switch 会发送提醒。
- **标签分类**：为项目打标签，便于按项目维度分析 API 成本。
- **保持更新**：CC Switch 是活跃开发的开源项目，建议关注 GitHub Releases 及时更新，获取新功能和 bug 修复。

### 常见问题

**Q: CC Switch 会影响 AI 工具的性能吗？**

A: 代理层引入的延迟通常在 5-15ms，对实际使用体验几乎无感。CC Switch 使用 Rust 实现代理核心，性能开销极小。

**Q: 可以同时管理多个机器的配置吗？**

A: 当前版本每个 CC Switch 实例管理本机配置。未来版本计划支持配置文件同步。

**Q: 支持哪些 API 格式？**

A: 支持 Anthropic API、OpenAI API（及兼容格式）、Gemini API。大多数兼容 OpenAI API 格式的第三方供应商都可以使用。

## Next Steps

- 访问 [CC Switch GitHub](https://github.com/ccswitch/cc-switch) 了解最新动态
- 阅读 [Claude Code 入门指南](/learn/tutorial/harness/claude-code-intro) 搭配使用
- 阅读 [Codex 核心概念](/learn/tutorial/harness/codex-intro) 了解多工具管理
