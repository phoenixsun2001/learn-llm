# Phase 3 测试改进待办

> **日期**: 2026-05-30
> **状态**: 待排期
> **来源**: Phase 3 内容管道完整测试

---

## 改进项

### 1. 摘要器 Fallback 质量优化

**问题**: 无 AI API 时，`generate_summary()` 直接截断原文前 200 字符作为摘要。当原文开头是 Markdown 元数据（badge 图片、链接等）时，摘要质量极差。

**示例**: 
```
原文开头: [![GitHub Stars](https://img.shields.io/...)](https://github.com/...)
Fallback 摘要: [![GitHub Stars](https://img.shields.io/...
```

**修复方向**:
- `pipeline/processors/summarizer.py` 的 fallback 分支，在截断前先调用 `strip_html()` 清洗 HTML/Markdown 标记
- 或使用简单的启发式规则：跳过前 N 行的纯链接/图片行，取第一个实质性段落

**影响文件**: `pipeline/processors/summarizer.py`

**优先级**: 中（有 API key 时不影响，纯离线模式体验差）

---

### 2. 分类器关键词 Fallback 覆盖不完整

**问题**: `_keyword_fallback()` 的关键词库覆盖不到所有内容类型。当 LLM 不可用时，某些文章被错误分类为默认的 `practice`。

**当前分类映射**:
| 分类 | 关键词 |
|------|--------|
| principle | transformer, 注意力, rlhf, 训练, 架构, token |
| model | gpt, claude, gemini, deepseek, qwen, llama, 模型对比, 选型 |
| harness | claude code, codex, trae, cursor, copilot, 编码助手, cli, skills |
| workflow | dify, coze, n8n, 工作流, 编排, 低代码 |
| development | langchain, langgraph, rag, mcp, 向量, embedding |
| practice | (default fallback) |

**修复方向**:
- 扩充每个分类的关键词库
- 添加 MCP Server、Agent、Prompt Engineering 等新兴领域关键词
- 考虑对中文分词后用 TF-IDF 做备选分类

**影响文件**: `pipeline/processors/classifier.py`

**优先级**: 低（有 API key 时不影响）

---

### 3. RSS 源可用性监控

**问题**: 4 个默认 RSS 源中，仅 OpenAI Blog 可正常解析，其他 3 个（Anthropic、LangChain、Dify）返回畸形 XML。管道优雅降级但无主动告警。

**抓取结果**:
| 源 | 状态 |
|------|------|
| Anthropic Blog | ❌ 畸形 XML |
| OpenAI Blog | ✅ 20 篇抓取 |
| LangChain Blog | ❌ 畸形 XML |
| Dify Blog | ❌ 语法错误 |

**修复方向**:
- `rss_fetcher.py` 中增加 `error_count` 计数，存入 `rss_sources` 表
- 管理后台仪表盘显示源健康状态（绿色/黄色/红色）
- 连续失败 3 次的源自动禁用并通知

**影响文件**: `pipeline/fetchers/rss_fetcher.py`, `pipeline/admin_dashboard/models.py`, `pipeline/admin_dashboard/templates/dashboard.html`

**优先级**: 高（内容采集是管道入口）

---

### 4. 管道 CLI 进度反馈

**问题**: `--full` 模式处理 20 篇文章时，每篇都要尝试 Ollama（超时 5s×2 次），20 篇×10s = 200s。用户看不到剩余时间预估。

**修复方向**:
- CLI 添加进度条（`tqdm` 库或手动计数器）
- 显示 `[3/20] Processing: 文章标题...`
- `--process-only` 模式目前是空壳，需实现从 staging 目录读取的逻辑

**影响文件**: `pipeline/run_pipeline.py`

**优先级**: 中

---

### 5. 管道输出目录整理

**问题**: `write_material()` 写入的 category 子目录使用英文 slug（如 `llm_basics`），应与 `classifier.py` 中定义的标准 6 分类保持一致。

**标准分类**: `principle`, `model`, `harness`, `workflow`, `development`, `practice`

**修复方向**:
- 在 `writer.py` 中校验 category 是否属于标准分类，否则归入 `practice`
- 或在 `classifier.py` 中确保所有输出路径都返回标准分类值

**影响文件**: `pipeline/output/writer.py`, `pipeline/processors/classifier.py`

**优先级**: 中

---

## 改进优先级汇总

| # | 改进项 | 优先级 | 工作量 |
|---|--------|--------|--------|
| 3 | RSS 源可用性监控 | 🔴 高 | 小 |
| 1 | 摘要器 Fallback 质量 | 🟡 中 | 小 |
| 4 | 管道 CLI 进度反馈 | 🟡 中 | 小 |
| 5 | 输出目录分类校验 | 🟡 中 | 小 |
| 2 | 分类器关键词扩充 | 🟢 低 | 中 |

---

> **下一步**: 进入 Phase 4 后，在合适的时机按优先级修复。
