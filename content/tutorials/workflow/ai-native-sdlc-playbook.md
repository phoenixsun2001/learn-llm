---
title: AI 原生 SDLC 操作手册：用 Claude 重塑软件开发生命周期
source: Anthropic Claude Blog
category: workflow
difficulty: advanced
tags:
  - SDLC
  - AI 原生
  - Claude Code
  - 工程效能
  - 治理
---

# AI 原生 SDLC 操作手册：用 Claude 重塑软件开发生命周期

AI 让写代码的速度提升了一个数量级，但围绕代码的**流程**——审批、评审、交接、合规检查——还停留在人工时代。结果就是：代码不再是瓶颈，瓶颈转移到了构建环节前后的「人工速度」步骤上。

本教程基于 Anthropic Applied AI 团队 2026 年 8 月发布的 [The AI-Native SDLC Playbook](https://claude.com/blog/the-ai-native-sdlc-playbook)，系统讲解如何把软件开发生命周期（SDLC）的六个阶段——**计划、设计、构建、测试、部署、运维**——改造成 AI 深度参与、人类守住判断节点的闭环流程，并给出每个阶段可直接照抄的落地配置。

## 学习目标

完成本教程后，你将能够：

- 理解为什么「代码不再是瓶颈」会颠覆传统 SDLC 的设计假设
- 掌握 AI 原生 SDLC 的核心主线：**工件链（artifact chain）**——`intent.md` → `spec.md` → `plan.md` → 代码与测试 → PR → 事故记录
- 学会每个阶段的关键打法：意图捕获、单会话需求设计、plan mode 先行、自验证反馈回路、双向评审、控制带闭环
- 用 `CLAUDE.md`、Skills、Hooks 三件套把团队知识与护栏变成代码
- 为每个阶段选择**先导指标**与**滞后指标**，用数据验证流程改造的收益

---

## 一、代码不再是瓶颈：三个新事实

传统 SDLC 的所有仪式——PRD、估点、评审会——都是为了对齐「以周和月计」的开发周期而设计的，因为那时**写代码是最贵的一步**。当 Agent 能把构建压缩到几小时，三件事同时发生：

1. **瓶颈左移和右移**。计划、评审、测试、部署仍以人工速度运转，构建再快也快不过整条流水线最慢的一环。
2. **控制手段失配**。逐行人工评审在人写代码的时代是合理的；当 diff 的大部分由 Agent 产出，逐行评审既跟不上也不适用。
3. **治理成本上升**。例外事项仍要走每周/每月一次的委员会，排队的时间抵消了 AI 带来的提速。

一个典型例子是安全评审：安全团队是按人的产出规模配置的。Agent 把代码产量放大数倍后，要么评审队列爆炸，要么代码带着未评审的风险上线——受监管的组织两者都不能接受。**结论：SDLC 流程本身需要一场与编码环节同等力度的改造。**

---

## 二、什么是 AI 原生 SDLC

AI 原生 SDLC 不是在旧流程里塞进一个 AI 工具，而是**保留旧流程的控制目标、更换实现手段**：

- 流程从**线性流转**变成**闭环**：运维阶段发现的问题以新的 `intent.md` 形式重新进入计划阶段
- 阶段之间靠**提交工件**自动触发：一个被接受的 `intent.md` 触发需求设计，一份批准的 `spec.md` 触发计划模式，一个合并的 PR 触发流水线
- AI 嵌入每一个点，但**人类保留所有需要判断力的决策**

### 传统 SDLC vs AI 原生 SDLC

| 阶段 | 传统 SDLC | AI 原生 SDLC |
|------|-----------|--------------|
| 计划 | 委员会收集需求，工作坊与签核层层提炼，人工撰写文档 | Claude 直接从源头综合痛点，产出人和机器都能读、都能执行的 `intent.md` |
| 设计 | 分析师写规格，设计师再解析成设计 | 需求与设计压缩为一次与 Agent 的协作会话，由版本化在 git 里的 Skills 约束 |
| 构建 | 手写测试与代码，文档事后补 | AI 生成测试与代码，机构知识以 `CLAUDE.md` 和 Skills 的形式版本化维护 |
| 测试 | 阶段边界上的 QA 门禁 | **持续评测（evals）**编织进实现过程 |
| 部署 | 人工逐行评审，治理靠评审周期 | 分层 Agent 评审 + 人工评审只留给受监管与关键代码；治理由 Hooks 在**行为发生时**强制执行 |
| 运维 | 人盯生产环境找 bug | Agent 监控线上，控制带被突破即自动诊断并写回新的 `intent.md` |

### 贯穿主线：工件链

右列的每一行都以「**提交一个工件到版本控制**」收尾，下一阶段以「读取它」开始：

```text
intent.md → spec.md → plan.md → 代码 diff + 测试 → PR + 评审记录 → 事故记录
   ↑                                                              │
   └──────────────── 运维阶段的发现重新进入循环 ←──────────────────┘
```

- 早期阶段的工件是 **.md 文件**——因为产品负责人和 Agent 都能读、都能基于它行动
- 从构建阶段起，工件是**代码及其记录**；提交历史本身就是审计线索：谁要了什么、Agent 产出了什么、谁批准的
- 人的注意力跟随工件走：不再从零开始每个阶段，而是**集中在门槛（gate）上，评审 Agent 标记出来的东西**

---

## 三、六个阶段的关键打法

以下每个打法都包含：变的是什么、怎么上手、怎么执行、治理考量、怎么度量。它们是模块化的——可以从任意一个没有前置依赖的打法开始。

### 阶段 1：Plan —— 把想法落成 intent.md

**变化**：想法不再等人「写上去」。提出者（可以是非工程师）和 Claude 头脑风暴，用自己的语言产出一份 proto-spec，保存为版本化的 `intent.md`，写清**要什么、为什么、在什么约束下**。

**上手**：前置依赖为无。基础设施是：非工程师的 Claude 访问权限（claude.ai 或 Cowork）、约定的 `intent.md` 模板、一个产品负责人盯着的共享仓库（最简单的形态是产品仓库里的 `intent/` 目录）。不会用 git 的贡献者可以由连接器代为提交。

**执行步骤**：

1. 提出者用自己的话向 Claude 描述问题——做不到什么、影响谁、什么样算更好、什么不在范围内，不要求正式语言
2. 头脑风暴直到想法具体：Claude 会像分析师一样追问范围、用户、约束和成功标准
3. 让 Claude 按组织模板（可封装为 Skill）写出 `intent.md`
4. 提出者修正 Claude 理解错的地方
5. 提交。作者与时间戳进入记录，产品负责人从这里接手

**示例**：

```markdown
# Intent: 理赔进度自助查询
作者: J. Ortiz（理赔运营）。状态: 草稿。

## 问题
客户打电话到客服中心查询理赔进度。
坐席约三分之一的通话时间耗在纯进度查询上。

## 期望结果
客户在门户里看到理赔状态、下一步和预计日期。

## 影响的用户与系统
理赔坐席、门户团队、理赔核心 API。

## 约束
门户会话不新增 PII 字段。仅使用现有认证方式。

## 待解问题
第三方公估师是否也需要访问？
```

**度量**：先导指标是从首次对话到 `intent.md` 提交的耗时（预期从数周的澄清周期降到小时级）；滞后指标是「存活率」——被产品负责人接受进入设计阶段的 intent 占比。

### 阶段 2：Design —— 需求与设计合并为一次会话

**变化**：分析师写需求、设计师做设计的两阶段，压缩为**一次提示驱动的会话**。Claude 读取被接受的 `intent.md`，在组织 Skills（品牌、安全、合规、UX）的约束下产出需求与设计规格，并**标记出关注点**。

**上手**：前置依赖是 intent.md 流程 + 以 Skill 形式写好的各类政策。基础设施只需要一个有 Claude 访问权限的产品负责人，不需要工程能力。前端类需求可以先用 Claude Design 从 `intent.md` 出设计稿，迭代满意后导出到 Claude Code 实施。

**执行步骤**：

1. 产品负责人发起会话，附上 `intent.md`
2. 提示词指向 `intent.md`、点名列出约束、要求标记关注点。先手动跑，再固化成组织级斜杠命令，最终让「intent 被接受」自动触发一次非交互任务，产出的 `spec.md` 以 PR 形式提交
3. 产品负责人对照原始想法审查规格：是否解决了陈述的问题，待解问题是否被回答或延续
4. **优先处理被标记的关注点**——它们就是分析师过去会升级的问题，逐个与政策负责人解决
5. `spec.md` 与 `intent.md` 一起提交，这对文件记录了「要什么」和「决定了什么」
6. 是否进入构建由人类 teammate 决定（高风险项咨询技术负责人）

**提示词示例**：

```markdown
读取附带的 intent.md，为将其集成进现有代码库产出一份需求与设计规格。
运用你可用的 skills，使方案符合我们的品牌指南、安全政策与 UX 标准。
完整地将规格写为 spec.md，可直接交给工程团队。
清晰描述任何关注点，尤其是无法同时满足相互冲突政策之处。
```

**治理**：政策不再是几周后的评审会上才被发现，而是在写规格的**当下**被读取并应用。规格、产出它的提示词、生效的 Skill 版本全部进入版本控制。

**度量**：先导指标是同一变更从 `intent.md` 提交到 `spec.md` 提交的间隔；滞后指标是构建开始后的需求返工次数（`spec.md` 在 `plan.md` 首次提交之后还有多少次提交）。

### 阶段 3：Build —— 没有被接受的计划，就不动手

构建阶段是打法最多的阶段，核心原则：**一切实现始于一份书面计划；机构知识变成文件；护栏以代码而非习惯的形式运行。**

#### 3.1 Plan Mode 作为默认起点

工程师以 [plan mode](https://code.claude.com/docs/en/permission-modes) 启动 Claude Code 会话：Claude 只读代码库、不改任何东西，产出一份点名「改哪些文件、按什么顺序、用什么测试证明」的计划，工程师反复质询（这个改动可能破坏什么？哪一步风险最大？放弃了哪些备选？）直到满意，批准后提交为 `plan.md`，之后才放手实现。

```markdown
# Plan: 理赔进度自助查询（来自 intent.md 2026-06-02）

## 改动的文件
portal/src/claims/StatusPanel.tsx（新增）、claims-api/routes/status.py、
claims-api/tests/test_status.py

## 工作顺序
1. 在现有认证之后新增 status 端点
2. 面板对接端点
3. 接入门户导航

## 风险
理赔核心 API 限流 50 rps；面板必须做缓存。

## 证明
test_status.py 覆盖四种理赔状态；截图与批准的设计稿一致。
```

后续 PR 评审会拿最终的 diff 对照这份 `plan.md`；实现偏离计划时，同一提交里更新计划（可以用 Hook 强制两者同步）。

#### 3.2 Auto 模式

随着护栏成熟（调教好的 `CLAUDE.md`、编码政策的 Skills、阻断危险操作的 Hooks、可运行的测试套件），常规工作（规格紧凑、爆炸半径小、测试已覆盖的改动）可以切到自动接受模式。工程师的重心从「盯着 Agent 的每次编辑」转向「**更长自主会话之后的工件评审**」。配合 worktree 使用时还能在个人与团队层面并行，这是第六阶段全自主闭环的基础。

#### 3.3 CLAUDE.md：新入职工程师需要的一切

[`CLAUDE.md`](https://code.claude.com/docs/en/memory) 把「过去存在人脑和 wiki 里」的知识变成 Agent 每次会话开头都会读的文件：

1. 在仓库里跑 `/init`，让 Claude 生成初版
2. 裁剪到「新人第一天需要的」：构建/测试/lint 命令、要紧的约定、Claude 常犯的错
3. 提交到仓库根目录，像代码一样评审变更
4. **错误两次法则**：Claude 同一个错误犯第二次，纠正就写进 `CLAUDE.md`
5. 保持在一页以内——陈旧的内容在白白占用上下文

#### 3.4 Skills：机构知识的载体

经验法则：**必须被一致执行的知识写成 Skill；属于仓库工作约定的内容进 `CLAUDE.md`**。一个 Skill 是 `.claude/skills/<name>/` 下带 frontmatter 的 `SKILL.md`，写明何时触发、做什么；放进仓库随代码分发，或通过插件市场全组织分发。政策变更时改 Skill、政策负责人签核，工程师下次会话自动拿到新版本。

注意：Skill 是**建议性控制**——让违规变得罕见；必须「零例外」的政策，后面用 Hook 兜底，让违规接近不可能。

#### 3.5 Hooks：构建期的确定性护栏

Skill 之外，[Hooks](https://code.claude.com/docs/en/hooks) 提供确定性的一层：阻止编辑受保护路径（生成代码、冻结包）、文件编辑后自动跑格式化和 lint、防止凭据进入 diff。构建期 Hook 要**快且只作用于变更的文件**；完整测试套件等重检查放到提交或 PR 环节；需要人批准的 Hook 属于第五阶段的门槛。

#### 3.6 并行会话与子代理

- **并行会话**：另一个完整的 Claude Code 实例，在自己的 [git worktree](https://code.claude.com/docs/en/worktrees) 里做独立任务，互相不知晓，只由驾驭它们的工程师协调
- **子代理（subagent）**：单个会话内限定作用域的帮手，有自己的上下文窗口与工具白名单，适合在多个任务里反复出现的工作（如验证应用行为）

起步建议 2~3 个并行会话，上限是「一个人能认真评审几路」。把重复工作定义成 `.claude/agents/` 下的子代理并提交进 git，例如：

```markdown
---
name: verifier
description: 在会话报告完成前，运行应用并检查改动是否生效
tools: Bash, Read
---
用 make run 启动应用。演练被改动的行为及最相邻的两个流程。
报告你跑了什么、看到了什么、以及任何与 plan.md 不符的行为。
不要修复任何东西；只报告。
```

**侧记：遗留系统与事实源**。多数组织的工件已经在 Jira、Figma、变更委员会里，AI 原生 SDLC 要与它们共存。规则是**给每类工件指定唯一的事实源**：仓库为源（遗留系统引用 commit 里的文件）、遗留系统为源（markdown 是工作副本，通过 MCP 连接器读写回去）、或最低限度的双向链接（工件记录工单号，工单记录 commit SHA）。

### 阶段 4：Test —— 让会话先检查自己

#### 4.1 给 Claude 一个反馈回路

**任何任务都要给 Claude 一种自验手段**——测试、构建或截图对比。会话在人看到之前先跑检查、修自己的错，到达工程师手里的产出已经通过了检查。落地要点：

1. 把「验证工作」封装成单命令（`make test` / `npm test`），失败即非零退出
2. `CLAUDE.md` 的 Commands 段列出每条命令和健康输出的样例
3. 完成标准要**可量化**：「test_status.py 全部通过」「截图与设计稿一致」「端点返回 200 且带新字段」
4. 修 bug 先写失败测试：让 Claude 把 bug 复现成测试、确认按预期失败、提交，然后才修——且不许改测试（用 Hook 拦截测试文件的编辑）
5. UI 工作用视觉闭环：给 Claude 浏览器/截图工具和设计稿，实现→截图→对比→调整，两三轮属正常
6. 在 `CLAUDE.md` 里写明「报告完成前必须跑完三项检查并粘贴输出；测试失败修代码，不是修测试」

```markdown
## 验证你的工作

- 构建: make build（必须以 "Build succeeded" 结束）
- 测试: make test（全绿；绝不跳过或删除失败的测试）
- Lint: make lint（零警告）

报告任何任务完成前运行以上三项并粘贴输出。
如果测试失败，修复代码，而不是测试。
```

反馈回路 ≠ verifier 子代理：回路贯穿整个任务反复运转；verifier 是会话认为完成后、用**全新上下文**做最终检查的一种打包方式——判决不被「写出这段代码的假设」染色。

#### 4.2 持续评测（Evals）进 CI

Evals 是 AI 原生版的阶段门禁 QA：**每当驱动 Agent 的配置（模型、提示词、`CLAUDE.md`、Skills、Hooks）变化，就跑一套真实任务**，确认 Agent 仍达标。

1. 平台工程师从近期工作里收集 20~50 个真实任务及其验收标准
2. 每个任务写成一个 eval：提示词 + 定义「可接受」的检查
3. 套件在 CI 里非交互运行：按计划表 + 任何 `CLAUDE.md`/`.claude/**` 变更触发
4. 用结果门禁配置变更——某个 Skill 改动让通过率下降，先评审再合并
5. **每个生产事故都沉淀为一条 eval**，成为永久回归测试

```yaml
name: Agent evals
on:
  pull_request:
    paths: ['CLAUDE.md', '.claude/**']
  schedule:
    - cron: '0 2 * * *'
jobs:
  evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g @anthropic-ai/claude-code
      - name: Run eval suite
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          for eval in evals/*.json; do
            claude -p "$(jq -r '.prompt' $eval)" \
              --allowedTools "Read,Edit,Bash(make test)" \
              --output-format json > result.json
            ./evals/check.sh "$eval" result.json
          done
```

### 阶段 5：Deploy —— 双向评审，治理随行为落地

**总原则：Agent 在生产门槛之前可以做一切，越过门槛一步都不行。**

#### 5.1 Claude 进入评审回路

Claude 双向参与评审：按组织政策评审**别人的** PR，也处理**自己** PR 上的评审意见。所有 PR 得到同一套评审 pass（Bug 与逻辑错误 / 安全与漏洞 / 对照 `spec.md` 与 `plan.md` 的合规性），发现按严重度排序；人类评审上移一层，只判断**意图与风险**。写代码的 Agent 无权批准自己的代码，职责分离得以保留；批准仍来自分支保护下的 code owner。

落地要点：

1. 托管 Code Review 服务最快上手；要控制流水线就走自家 CI 里的 [claude-code-action](https://code.claude.com/docs/en/github-actions)
2. 技术负责人把评审政策写成仓库根目录的 `REVIEW.md`：定义 pass 划分、什么算 Important 什么算 Nit、Nit 上限、哪些不报告（生成文件、CI 已覆盖项）
3. 评审意见 `@claude` 即可让 Claude 修改并推送，PR 线程同时记录请求与变更；Claude 开的 PR 甚至可以让它「看护」到只剩 code owner 批准
4. **评审发现反哺 `CLAUDE.md`**：同一错误被评审标记第二次，纠正进 `CLAUDE.md`，从此在写代码时就被拦住

```markdown
# 评审指令

## Passes
跑三个 pass，每条发现标注所属 pass：
- Bugs: 逻辑错误、边界破损、隐蔽回归
- Security: 注入风险、认证缺口、日志中的 PII
- Compliance: 改动与 spec.md、plan.md 及设计原则一致

## Important 的定义
只把会破坏行为、泄露数据或违反政策的发现标为 Important。
风格与命名是 Nit。

## Nit 上限
每次评审最多报五条 Nit；其余汇总为计数。

## 不要报告
src/gen/ 下的生成文件，以及 CI 已强制执行的任何内容。
```

#### 5.2 Hooks 作为审批门槛

构建期的 Hook 允许/阻断动作、无需人参与；把 Hook 的第三种能力——**询问（ask）**——用在发布门禁上：动作暂停，直到指定的人批准。

```bash
#!/bin/bash
# 生产部署需要具名的发布授权
cmd=$(jq -r '.tool_input.command' < /dev/stdin)
if [[ "$cmd" == *"deploy"* && "$cmd" == *"production"* ]]; then
   if [ -z "$RELEASE_APPROVAL" ]; then
     echo "生产部署需要发布授权。" >&2
     exit 2 # exit 2 阻断动作；消息会传给 Claude
   fi
fi
exit 0
```

团队级 Hook 进 git 里的 `.claude/settings.json`；**不可协商的 Hook 放进平台/IT 管理员持有的托管设置**，个别工程师关不掉。受监管企业还可以叠加：权限允许/拒绝清单、操作系统级沙箱与域白名单、凭据路径拒绝、仅允许托管 Hooks / MCP / 经审批的插件市场、最低版本门槛——原文给出了完整配置示例，每一项都有明确的控制语义（此处不展开，建议按数据分级裁剪而非照抄）。

#### 5.3 CI/CD 集成

1. 从**只读的判断型步骤**起步：`claude -p` 分诊失败构建、总结 flaky 测试、起草 changelog
2. 写操作放在既有门槛之后：修 lint、更新生成文档、处理 `@claude` 评审意见——Agent 的一切写入都以 PR 到达，没有直推 main 的路径
3. 执行沙箱化：容器 + 网络策略 + 短时效作用域令牌，默认不持有生产凭据
4. 部署通过 **MCP 暴露成工具**：deploy / status / rollback 按环境分级授权，Agent 的部署能力是白名单而不是带凭据的 shell 脚本
5. **按环境分层自治**：开发环境自由部署；生产环境 Agent 只准备发布、发布经理授权、Hook 强制门槛；staging 居中
6. **回滚是彩排最多的路径**：一条 Agent 能执行的命令，常在 staging 演练——第六阶段的闭环会调用它

```yaml
- name: Triage failed build
  if: failure()
  run: >
    claude -p "读取 out/build.log。找出最可能的原因，判断失败
    是 flaky 还是真实回归，为 PR 线程写三行总结。" >> triage.md
```

### 阶段 6：Maintain —— 闭环

#### 6.1 控制带与自动闭环

前五个阶段每次都需要人发起；这个阶段让**触发器在没有人参与的路径上调用 Claude**，把发现写回 `intent.md`，循环重新开始。

关键设计：**检测保持确定性，模型只在被触发后进场**。

1. 选一个有稳定滚动基线的指标（CI 测试失败率、部署后 5xx 率、PR 周期时间）
2. 检测脚本用滚动窗口的均值和标准差划出控制带（可配 Western Electric 规则），脚本本身版本化、有单元测试、**不含任何模型**
3. 响应分层写进版本化配置：1σ 只记日志；2σ 调用 Claude 只读诊断；3σ Claude 可以行动——但只能开 PR 进评审门槛，或触发预先批准的 runbook
4. 触发层可以是定时工作流、监控系统的 webhook 或内网 Cron；Claude 无状态运行（CI 上的非交互步骤或沙箱容器里的 Agent SDK 服务）
5. Agent 把诊断按阶段 1 的格式写成 `intent.md`（异常与证据、期望结果、受影响系统、待解问题），发现像任何需求一样走流水线
6. 服务负责人分诊队列：立即修、排期、驳回——驳回用于调优控制带、降噪
7. 修复上线后为该事故加一条 eval（阶段 4），同类问题从此有回归保护

```yaml
metric: ci_test_failure_rate
baseline: rolling_30d
rules: western_electric
tiers:
  1sigma: { action: log }
  2sigma: { action: diagnose,
            tools: "Read,Grep,Bash(gh run view *)" }
  3sigma: { action: propose,
            routes: [pull_request, runbook:rollback-deploy] }
```

典型效果：CI 失败率破 3σ，Agent 隔离 flaky 测试或开 revert PR，由评审门槛裁决；部署后 5xx 破 3σ 且窗口内有部署，Agent 触发现有的回滚流水线；PR 周期时间触发漂移规则，Agent 给工程负责人写报告——这套 harness 对流程指标同样有效。

#### 6.2 Claude 值班（Claude Tag）

事故也会从 Slack/Teams 到来。Claude Tag（公测中）让 Claude 以自己的身份成为频道成员：晚上十点的紧急修复消息有了第一响应者，对话与机构知识留在频道里，任何人可以引导响应，频道历史本身就是审计线索。Claude 通过 MCP 确认指标回到基线、把复盘写进版本化的 lessons 文件。小而边界清晰的修复直接以 PR 过评审门槛；更大的工作写成 `intent.md` 进入阶段 1——**循环开始自我喂养**。

---

## 四、怎么渐进采用

原文的打法之间有明确的依赖关系（依赖图），几条实用的采用顺序：

1. **从零前置的打法开始**：`CLAUDE.md`、intent.md 流程、Skills、Hooks 都可以直接启动——它们是其他一切的地基
2. **工件链优先**：即使只落地「intent → spec → plan → PR 对照评审」这一条线，也能拿到大部分收益，因为审计与追溯的骨架先立起来了
3. **反馈回路先于自治**：会话能自验（阶段 4）之后，auto 模式和并行会话（阶段 3）才安全；评审与门槛（阶段 5）就位之后，CI/CD 自动化才有意义
4. **闭环最后**：阶段 6 依赖前面所有阶段——它调用的正是 intent 格式、评审门槛与回滚路径

> 💡 对独立开发者的裁剪版：一个人也能跑通这条链——`intent.md`/`spec.md` 帮你想清楚再动手，`CLAUDE.md` + 计划模式让 Agent 不跑偏，`make test` 式反馈回路 + 截图对比是最便宜的自验，evals 用十几条真实任务防配置回归。治理部分（托管设置、分层授权）可以等你有了第一个协作者或客户审计要求时再补。

---

## 五、与本平台其他教程的关系

| 概念 | 关系 |
|------|------|
| [Loop Engineering（循环工程）](/tutorials/loop-engineering) | 本教程的闭环是其「外循环」在**组织级 SDLC** 上的完整实例化：工件链就是外循环的编排载体，阶段 3 的自验回路就是内循环 |
| Claude Code 系列 | 阶段 3 是 Claude Code 核心特性（plan mode、CLAUDE.md、Skills、Hooks、worktrees、subagents）的**流程化用法总纲** |
| TDD | 阶段 4 的「bug 先写失败测试、Agent 不得改测试」是 TDD 红绿循环在 Agent 时代的加固版 |

---

## 小结

- 传统 SDLC 为「写代码最贵」的时代设计；Agent 时代**代码不再是瓶颈，流程才是**
- AI 原生 SDLC = 线性流程变闭环 + 每阶段提交**工件**（`.md` → 代码 → 记录）自动触发下一阶段
- 六阶段打法：**Plan** 落 intent.md → **Design** 单会话产 spec.md → **Build** 计划先行 + 知识文件化（`CLAUDE.md`/Skills/Hooks）→ **Test** 自验回路 + 持续评测 → **Deploy** 双向评审 + Hooks 门槛 + 分层自治 → **Maintain** 确定性检测 + Agent 闭环
- 人类始终保留判断：接受/拒绝工件、批准发布、分诊发现
- 每个打法都要配**先导 + 滞后指标**，用 git 历史、PR 元数据和事故单直接度量
- 采用顺序跟着依赖走：零前置的地基先行，工件链优先，反馈回路先于自治，闭环殿后

## 延伸阅读

- [The AI-Native SDLC playbook（Anthropic 官方原文）](https://claude.com/blog/the-ai-native-sdlc-playbook)
- [Loop Engineering（循环工程）：用 AI 重塑软件工程范式](/tutorials/loop-engineering)
- [Claude Code 入门指南](/tutorials/claude-code-intro)
- [Claude Code 日常工作流](/tutorials/claude-code-daily)
