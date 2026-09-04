---
title: 定制你的 Agent：CLAUDE.md、Hooks 与子代理（CS146S Week 4）
source: Stanford CS146S · The Modern Software Developer
category: harness
difficulty: intermediate
tags:
  - CLAUDE.md
  - AGENTS.md
  - Hooks
  - Subagents
  - CS146S
---

# 定制你的 Agent：CLAUDE.md、Hooks 与子代理（CS146S Week 4）

CS146S 第二层「武装单个 Agent」的收尾一周。前三周分别搞懂了机制（W1）、上下文与规格（W2）、能力封装（W3），本周把它们落成一个**针对你的项目定制的 Agent**：用 CLAUDE.md / AGENTS.md 注入项目记忆，用 Hooks 建立确定性护栏，用子代理模式实现职责分离。

本周与 Week 2 的洞察同源：**Agent 的能力上限由你给它的上下文、工具和约束决定，而非模型本身。**

## 学习目标

完成本教程后，你将能够：

- 判断什么内容该进 CLAUDE.md/AGENTS.md，什么内容不该——并让这个文件保持「一页以内」
- 用 Hooks 实现两类门禁：自动化（lint/格式化）与阻断（保护路径/危险命令）
- 组建 planner / implementer / reviewer 子代理分工，理解职责分离为什么能提高质量
- 把这三件套组合成项目的「Agent 运行章程」

---

## 一、CLAUDE.md / AGENTS.md：项目记忆怎么写

`CLAUDE.md`（Claude Code）与 `AGENTS.md`（已成为跨工具行业约定，Codex、ZCode 等均识别）是放在仓库里的项目记忆文件，**每次会话开始自动注入上下文**。它是 Agent 的「新人入职文档」。

### 该放什么

1. **命令**：构建、测试、lint、跑单测的准确命令——这是价值密度最高的部分，Agent 每个会话都要用
2. **要紧的约定**：代码风格红线、目录结构规则、分支与提交规范
3. **已知陷阱**：这个项目特有的坑（「勿直接改 schema 生成文件」「测试依赖本地 Docker」）
4. **错误两次法则的沉淀**：Agent 同一个错误犯第二次，纠正就写进这里——让每次事故只发生两次

### 不该放什么

- 大段背景故事与设计哲学（放 docs/，按需读）
- 能从代码/CI 里推断的东西（重复且会过期）
- 一切「希望它顺便注意」的琐碎——**每个无关 token 都在稀释关键规则**

```markdown
# 项目约定（示例骨架）

## 命令
- 前端: cd frontend && npm run build   # 构建即校验
- 后端: cd pipeline && PYTHONPATH=. python tests/test_pipeline.py

## 红线
- 禁止硬编码颜色，一律使用 index.css 的设计 token（var(--token)）
- 禁止修改 schema 生成文件（src/data/*-index.json 由 scripts 同步）
- 提交信息用 conventional commits（feat:/fix:/docs:）

## 已知坑
- Windows 下路径用正斜杠；中文文件内容一律 UTF-8
```

维护心法：**把它当代码评审**——改 CLAUDE.md 的 PR 和改代码的 PR 走同样的流程。内容陈旧的规则比没有规则更糟（白白消耗上下文并制造错误指引）。

## 二、Hooks：确定性的护栏层

CLAUDE.md 是**建议性**的——模型「应该」遵守，但可能违背。Hooks 是**强制性**的——在工具执行的确定性时刻插入你的脚本，让违规不可能发生或立即被纠正。

两类最常用的门禁：

### 1. PostToolUse：编辑后自动质检

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "npx prettier --write \"$CLAUDE_FILE_PATHS\" && npx eslint --fix \"$CLAUDE_FILE_PATHS\""
      }]
    }]
  }
}
```

每次 Agent 编辑文件后自动格式化 + lint 修复。Agent 下一轮读到的就是干净文件——**反馈回路里的 lint 从此不再需要人催**。

### 2. PreToolUse：危险动作阻断

```bash
#!/bin/bash
# 阻止编辑生成文件与被冻结的目录
file=$(jq -r '.tool_input.file_path' < /dev/stdin)
if [[ "$file" == *"src/data/"* ]]; then
  echo "src/data/ 由脚本同步生成，请改用 scripts/sync-index.py" >&2
  exit 2   # exit 2 = 阻断；错误信息会回喂给模型
fi
exit 0
```

设计原则：**构建期 Hook 要快**（只作用于被改的文件）；重检查（全量测试）放到提交或 PR 环节；需要人批准的关口（如生产部署）用「询问」型 Hook——这与 AI 原生 SDLC 里「Hook 做审批门槛」是同一件事。

三层控制各司其职：**Skill 管「怎么做更好」（建议）、CLAUDE.md 管「本项目的约定」（强记忆）、Hooks 管「绝不允许」（强制）**。

## 三、子代理模式：planner / implementer / reviewer

单个会话里，「写代码的自己检查自己」有个结构性弱点：**裁判和运动员共享同一个上下文**——写着写着，实现中的假设会污染对「什么算正确」的判断。子代理（subagent）通过**独立上下文窗口 + 受限工具集**打破这一点。

课程给出的经典三分工：

| 子代理 | 职责 | 工具白名单 | 关键约束 |
|--------|------|-----------|---------|
| **planner** | 读代码、产计划 | 只读（Read/Grep/Glob） | 不许改任何东西；计划要指明验证方式 |
| **implementer** | 按计划实现 | Read/Edit/Write/Bash | 只做计划内的事；偏离要报告 |
| **reviewer** | 审查产出 | 只读 + 测试（Bash 限 make test） | 对照计划审 diff；不修代码，只报告 |

三个子代理的参考定义（`.claude/agents/` 下各一个文件）：

**planner**——只有眼睛和手电筒，没有扳手：

```markdown
---
name: planner
description: 为当前任务产出实现计划。开始任何非平凡改动前使用。
tools: Read, Grep, Glob
---
针对任务产出一份可执行计划。规则：
1. 先用 Read/Grep 摸清相关代码与既有约定（命令、测试入口见 CLAUDE.md）
2. 计划必须包含：要改的文件清单、改动顺序、每一步的验证方式
3. 写明主要风险，以及你考虑过并放弃的备选方案
4. 只产计划，不改任何文件；任务本身不清晰就停下来提问，不要猜
```

**implementer**——按图施工，越界即停：

```markdown
---
name: implementer
description: 严格按已批准的计划实现改动。
tools: Read, Edit, Write, Bash
---
按 plan.md 实现。规则：
1. 只做计划内的事；需要偏离计划时先停下说明原因，报告后再动
2. 小步推进：每完成一个计划项就跑对应验证并提交
3. 不跳过、不修改失败的测试；测试失败修代码，而不是改测试
4. 完成后自述：改了哪些文件、每条计划项分别如何验证通过
```

**reviewer**——拿计划对照 diff 的独立检查者：

```markdown
---
name: reviewer
description: 对照 plan.md 审查当前改动。完成实现后使用。
tools: Read, Grep, Bash
---
对照 plan.md 逐条审查 git diff：
1. 每条计划项是否落实？偏离是否已在提交中说明？
2. 跑 make test；失败项原样报告
3. 检查红线：无硬编码颜色/密钥/无测试裸奔的新端点
只报告，不修复。发现按 Important / Nit 分级，Nit 最多 5 条。
```

三个使用要点：

1. **价值来自隔离，不是「更聪明」**。reviewer 用全新上下文看 diff，不被实现过程的假设污染——这是「独立评审」的工程化
2. **工具白名单就是职责分离**。reviewer 拿不到 Edit，就物理上不可能「顺手改掉让自己为难的地方」
3. **编排可以由主会话做**，也可以进一步让 background agents 并行跑多个 implementer（Week 8 的主题）

## 四、把三件套组合成「Agent 运行章程」

一个完成 Week 4 定制的项目，最终长这样：

```text
repo/
├── CLAUDE.md            # 项目记忆：命令、约定、坑
├── AGENTS.md            # 跨工具同一份约定（内容指向 CLAUDE.md）
├── .claude/
│   ├── settings.json    # Hooks：PostToolUse 质检 + PreToolUse 阻断
│   ├── skills/          # Skills：重复流程的能力包（W3）
│   └── agents/          # planner / implementer / reviewer 定义
└── REVIEW.md            # 评审政策（W6 展开）
```

这四个文件**都是版本控制里的代码**：评审、迭代、回滚，全走既有工程流程。Agent 的行为规范从「口口相传的使用技巧」变成「可审计的仓库资产」——这是个人用法与团队工程的分水岭。

> 💡 本仓库（Learn-LLM）根目录就有一份真实的 AGENTS.md，规定了角色、技术栈、编码标准与设计 token 规则——可以拿来对照本课的「该放什么」清单。

---

## 小结

- CLAUDE.md/AGENTS.md 是 Agent 的入职文档：命令 + 约定 + 已知坑；坚持一页以内，用「错误两次法则」持续沉淀，改它走代码评审
- Hooks 提供确定性护栏：PostToolUse 自动质检、PreToolUse 阻断危险动作、询问型 Hook 做审批门槛
- 控制分层：Skill（建议）→ CLAUDE.md（强记忆）→ Hooks（强制）
- planner/implementer/reviewer 子代理用**独立上下文 + 工具白名单**实现职责分离，价值在于评审不被实现假设污染
- 三件套都进版本控制，Agent 规范从此可审计、可迭代

## 延伸阅读

- [CS146S 课程官网](https://themodernsoftware.dev)
- [上一课：Agent Skills（Week 3）](/tutorials/cs146s-agent-skills)
- [Claude Code Hooks 实战](/tutorials/claude-code-hooks)
- [ZCode 子智能体](/tutorials/zcode-subagents)
- [AI 原生 SDLC 操作手册](/tutorials/ai-native-sdlc-playbook)（CLAUDE.md/Skills/Hooks 三件套在六阶段 SDLC 中的完整用法）
