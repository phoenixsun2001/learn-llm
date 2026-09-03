---
title: Agent Skills：把工作流编码为可复用能力（CS146S Week 3）
source: Stanford CS146S · The Modern Software Developer
category: harness
difficulty: intermediate
tags:
  - Agent Skills
  - SKILL.md
  - CLI
  - 工作流复用
  - CS146S
---

# Agent Skills：把工作流编码为可复用能力（CS146S Week 3）

CS146S 第三周继续「武装单个 Agent」。Week 2 解决了「一次任务怎么给对上下文」，本周解决「**重复性工作流怎么固化下来，让每次都不用重新教**」。答案是 Agent Skills：用 `SKILL.md` 加脚手架脚本，把团队的流程知识编码成 Agent 可发现、可执行、可分发的**能力包**。

## 学习目标

完成本教程后，你将能够：

- 理解 Skill 的定位：它补上了「提示词太轻、写死工具太重」之间的空档
- 掌握 SKILL.md 的结构与渐进式披露（progressive disclosure）机制
- 知道什么时候 Skill 该配脚本、什么时候纯指令就够
- 理解课程强调的 CLI 工作方式：为什么 Agent 时代命令行工具重新吃香
- 亲手设计一个可直接落地的仓库级 Skill

---

## 一、Skill 解决什么问题

先看三个候选方案为什么都不够：

| 方案 | 问题 |
|------|------|
| 每次把流程写进提示词 | 重复劳动；不同人写的不一致；上下文被流程描述挤占 |
| 写进 CLAUDE.md | 项目记忆适合「约定」（怎么做测试），不适合「操作手册」（怎么发一个版）——塞多了挤占每次会话 |
| 写成传统脚本 | 流程里的判断点（「如果没有 changelog 就先生成」）脚本写起来僵硬，人又得回来接管 |

Skill 的形态恰好补空档：**一个带 frontmatter 的 Markdown 文件（可附脚本与资源）**。Markdown 部分给模型「怎么做的指令与判断规则」，脚本部分处理「不需要智力的确定性步骤」。模型只在用到时才加载它——不占平时上下文。

## 二、SKILL.md 的结构与渐进式披露

一个 Skill 是一个目录，最少只有一个 SKILL.md：

```text
.claude/skills/release-checklist/
├── SKILL.md            # 必需：元数据 + 指令正文
├── scripts/
│   └── changelog.py    # 可选：确定性步骤脚本化
└── references/
    └── policy.md       # 可选：按需加载的详细参考
```

SKILL.md 的写法：

```markdown
---
name: release-checklist
description: 执行仓库发版检查。当用户要求发布版本、打 tag 或生成 changelog 时使用。
---

# 发版检查流程

## 步骤
1. 运行 scripts/changelog.py 生成 changelog 草稿（确定性步骤，不要手写）
2. 通读 diff，确认没有未跟踪的调试代码
3. 检查版本号三处一致性：package.json、changelog、git tag
4. 跑完整测试套件；任何失败都终止发版并报告

## 判断规则
- 如果 changelog.py 不可运行：按 git log 手工整理，并在报告里注明
- 如果存在未发布的破坏性变更：先询问用户，不要自行决定主版本号
```

关键机制是**渐进式披露**——上下文分三级加载：

1. **常驻层**：只有 name + description 进入系统提示词（几十个 token），模型据此判断「当前任务要不要用这个 Skill」
2. **触发层**：命中后整个 SKILL.md 正文加载进上下文
3. **按需层**：正文里引用的 references/ 文件与脚本，执行到相关步骤才读

这意味着**你可以安全地安装几十个 Skill 而不撑爆上下文**——description 写得好坏直接决定 Skill 会不会被正确触发。

## 三、什么时候配脚本

经验法则：**流程中可确定性验证的步骤交给脚本，需要判断的部分留在 Markdown。**

- ✅ 脚本化：格式转换、生成 boilerplate、跑检查并汇总结果、调用内部 API
- ❌ 脚本化：理解需求、权衡方案、决定要不要发版——这些写成「判断规则」指导模型

脚本对 Agent 还有一个额外好处：**输出稳定**。让模型手写 changelog 十次会有十个版本；让脚本生成十次是一致的。可预测性本身就是质量。

## 四、CLI 工作方式：Agent 时代的命令行复兴

本周另一个重点：课程为什么强调「CLI 工作方式」。因为对 Agent 而言，CLI 是最友好的接口形态：

| 维度 | CLI | GUI |
|------|-----|-----|
| 可调用 | 天然：bash 一行 | 需要 DOM/视觉层的 brittle 自动化 |
| 可组合 | 管道、重定向、退出码 | 封闭的界面流程 |
| 可验证 | 退出码 + stdout 机器可判 | 需要「看」结果 |
| 文档化 | `--help` 即接口说明 | 靠截图与视频 |

这给我们的启示是双向的：

1. **为 Agent 优化你的工具**：如果你维护一个内部平台，提供一个 `yourtool cli` 比只提供网页对 Agent 友好得多——网页是给人看的，命令是给 Agent 用的
2. **把流程封装成命令**：`.claude/commands/`（斜杠命令）与 Skill 的区别主要是触发方式——命令是用户显式调用，Skill 是模型按需发现。重复执行的团队流程两者都值得做

## 五、实战：设计一个仓库级 Skill

以「给本仓库新增一篇教程」为例（Learn-LLM 真实存在的重复流程）：

```markdown
---
name: add-tutorial
description: 按仓库规范新增一篇教程，并同步全部索引。当用户要求添加教程时使用。
---

# 新增教程流程

## 步骤
1. 确认分类（principle/model/harness/workflow/development/practice），
   在 content/tutorials/<分类>/ 下创建 <slug>.md，frontmatter 必含
   title/source/category/difficulty/tags
2. 用 scripts/sync-index.py 同步三份教程索引与 search-index
3. 将 md 复制到 frontend/public/content/tutorials/<分类>/
4. 校验：python -c "import json,glob;[json.load(open(p,encoding='utf-8'))
   for p in glob.glob('**/index.json',recursive=True)]"

## 判断规则
- 如果用户没给分类：按内容主题推荐并说明理由，等确认再动手
- 如果 slug 与现有教程冲突：报告冲突，建议加前缀
- 教程长度不足 60 行：警告用户内容可能过薄
```

注意三个设计点：**description 写清触发时机**；**确定性步骤（同步索引、复制、校验）指明具体命令**；**判断点（分类、冲突）显式定义默认行为**。这就是一个合格的 Skill——同一个团队里任何人、任何会话，得到的执行都一致。

> 💡 Skill 是**建议性控制**：它让正确做法变得容易，但不能保证执行。必须「零例外」的规则（如禁止推 main）要用 Hooks 兜底——这正是下周的主题。

---

## 小结

- Skill = SKILL.md（指令与判断规则）+ 可选脚本与参考文件，填补「提示词太轻、硬编码太重」的空档
- 渐进式披露分三级：description 常驻、正文触发加载、references 按需读取——所以可以放心装很多 Skill
- 可确定性验证的步骤脚本化（输出稳定），需要判断的部分写成判断规则
- CLI 是 Agent 时代最友好的接口：可调用、可组合、可验证、`--help` 即文档
- 好的 Skill 让「任何会话都按同一套流程办事」——这是把个人经验变成团队资产的最小单元

## 延伸阅读

- [CS146S 课程官网](https://themodernsoftware.dev)
- [上一课：上下文工程与规格驱动开发（Week 2）](/tutorials/cs146s-context-engineering)
- [Codex Skills 与 MCP 集成](/tutorials/codex-skills)
- [Claude Code 日常工作流](/tutorials/claude-code-daily)
