---
title: 解剖 Agent：从 LLM 到 Agent Loop（CS146S Week 1）
source: Stanford CS146S · The Modern Software Developer
category: harness
difficulty: intermediate
tags:
  - Agent
  - Agent Loop
  - 系统提示词
  - CS146S
  - Claude Code
---

# 解剖 Agent：从 LLM 到 Agent Loop（CS146S Week 1）

这是「CS146S：现代软件开发者」学习路径的第一课。斯坦福 Mihail Eric 在这门十周课程里提出了一个核心判断：软件开发的主体正在从「人写代码」转向「人定义意图、Agent 执行、人与 Agent 共同评估和迭代」。而这套新工作流的地基，是**真正理解 Agent 的运作机制**——只有拆开黑盒，后面所有的「配置」（上下文、工具、约束）才不是玄学。

本周课程做两件事：第一课现场**用约 200 行代码构建一个 Claude Code**；第二课**深读生产级 Agent 的系统提示词**。本教程按同样的顺序展开。

## 学习目标

完成本教程后，你将能够：

- 说清 LLM 与 Agent 的本质区别：一个是「补全下一个 token 的函数」，一个是「围绕这个函数构造的感知-决策-行动循环」
- 画出 Agent Loop 的完整结构，并用约 200 行代码亲手实现一个最小可用版本
- 理解 read / write / edit / bash 四个核心工具为什么足以承载绝大多数编码任务
- 结构化地分析一份生产级系统提示词（身份、工具规范、约束、输出风格）
- 用「机制视角」解释日常使用中的现象：为什么 Agent 会绕圈、为什么会幻觉路径、为什么同一提示时好时坏

---

## 一、LLM：一个被低估的简单函数

LLM 本质上是一个函数：**输入一段 token 序列，输出下一个 token 的概率分布**。它没有记忆、没有目标、不会主动做任何事——每一次调用都是无状态的。

（大语言模型的工作原理本站已有专门教程，此处只强调对理解 Agent 最关键的三点。）

由此推出的三个重要结论：

| 推论 | 对 Agent 设计的含义 |
|------|---------------------|
| 模型是无状态的 | 所有「记忆」必须由外部显式管理：对话历史、文件、笔记，每次调用重新喂入 |
| 模型只看得到上下文里的东西 | 上下文之外的世界对它不存在——它不是「忘了」，是「从来不知道」 |
| 输出质量强依赖输入质量 | 给模型模糊的上下文，就会得到模糊的输出；这不是模型缺陷，是函数性质 |

**Agent 就是针对这三个约束的工程解法**：用循环带来自主性，用工具带来感知与行动，用上下文管理带来稳定输出。

## 二、Agent Loop：全部秘密在一个 while 循环里

把市面上所有 Coding Agent（Claude Code、Codex、ZCode……）拆到最简，核心都是同一个循环：

```python
messages = [{"role": "user", "content": task}]
while True:
    response = llm.create(
        model="claude",
        messages=messages,
        tools=TOOLS,          # 工具清单（JSON Schema 描述）
    )
    # 模型可以选择：直接回答（stop_reason=end_turn）
    #             或调用工具（stop_reason=tool_use）
    if response.stop_reason == "end_turn":
        return response.text  # 模型认为任务完成
    for tool_call in response.tool_calls:
        result = execute(tool_call)          # 在真实环境里执行
        messages.append(tool_result(result)) # 结果回喂，进入下一轮
```

三个部件，缺一不可：

1. **模型**——决定「下一步做什么」的决策器
2. **工具**——模型的手脚，让它能读环境、改环境
3. **循环**——把单次补全变成多步行动；每轮工具结果都成为下一轮的上下文

理解了这个循环，很多「玄学现象」立刻变得可解释：

- **Agent 绕圈**：工具返回的错误信息没有给出可行动的修正方向，模型只能反复重试
- **幻觉出不存在的文件路径**：上下文里没有目录结构，模型在「合理地猜」
- **越做越慢、越做越糊涂**：上下文接近上限，早期关键信息被截断或压缩失真

## 三、四个核心工具：read / write / edit / bash

Claude Code 的工具箱看似庞大，核心其实只有四个，每个都对应一种基本动作：

| 工具 | 动作 | 关键设计点 |
|------|------|-----------|
| **read** | 读文件/目录 | 只读不改；带行号与偏移分页读大文件，避免撑爆上下文 |
| **write** | 新建/整写文件 | 全量覆写，语义简单可靠；适合新建文件 |
| **edit** | 精确替换 | 以「唯一匹配的旧字符串」为锚点做局部替换；匹配失败即报错，防止误伤 |
| **bash** | 执行命令 | 万能兜底：构建、测试、git、搜索都靠它；也最危险，需要权限护栏 |

为什么这四个就够了？因为**它们映射了人类工程师与代码库交互的全部原语**：看代码、新建文件、改一行、跑起来验证。其余工具（grep、glob、子代理、notebook……）都是在这四个原语之上做的效率优化与安全分层。

> 💡 值得注意的设计哲学：**工具越少、语义越正交，模型用得越稳**。工具清单不是越长越好——每加一个工具，模型都要在更多选项里做选择，出错面也随之变大。这是 Week 2「工具的 Agent 人机工学」的伏笔。

## 四、动手：200 行代码写一个迷你 Claude Code

课程第一课的名场面：现场用约 200 行 Python 构建一个可用的 Coding Agent。骨架只有五段：

```python
# 1. 系统提示词：定义 Agent 的身份与行为准则
SYSTEM_PROMPT = """You are a coding agent working in the user's repository.
Prefer edit over write for existing files. Always run tests after changes.
If a command fails, read the error and adjust before retrying."""

# 2. 工具的 JSON Schema 定义：模型据此知道「有什么工具、怎么调用」
TOOLS = [{
    "name": "read_file",
    "description": "Read a file from disk. Returns content with line numbers.",
    "input_schema": {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Relative file path"},
            "offset": {"type": "integer", "description": "Start line (optional)"},
        },
        "required": ["path"],
    },
}, {
    "name": "edit_file",
    "description": "Replace an exact old_string with new_string. Fails if not unique.",
    "input_schema": { ... },
}, {
    "name": "bash",
    "description": "Run a shell command. Returns stdout/stderr and exit code.",
    "input_schema": { ... },
}]

# 3. 工具执行器：把模型的语言调用翻译成真实的 Python 函数
def execute(name, args):
    if name == "read_file":
        with open(args["path"]) as f:
            lines = f.readlines()
        return "".join(f"{i+1}: {l}" for i, l in enumerate(lines))
    if name == "edit_file":
        src = open(args["path"]).read()
        assert src.count(args["old_string"]) == 1, "old_string not unique"
        return open(args["path"], "w").write(
            src.replace(args["old_string"], args["new_string"]))
    if name == "bash":
        r = subprocess.run(args["command"], shell=True, capture_output=True, text=True)
        return f"exit={r.returncode}\n{r.stdout}\n{r.stderr}"

# 4. Agent 主循环（就是第二节的 while）
def agent(task):
    messages = [{"role": "user", "content": task}]
    while True:
        resp = llm.create(system=SYSTEM_PROMPT, messages=messages, tools=TOOLS)
        messages.append(resp.message)
        if resp.stop_reason == "end_turn":
            return resp.text
        for call in resp.tool_calls:
            try:
                out = execute(call.name, call.input)
            except Exception as e:
                out = f"ERROR: {e}"     # 错误也回喂，让模型自己修正
            messages.append(tool_result(call.id, out))

# 5. 交互入口
if __name__ == "__main__":
    while (task := input("> ")):
        print(agent(task))
```

实际写满 200 行的工作量主要在三处**鲁棒性**上，而这三处恰好是生产级 Agent 与玩具的差距所在：

1. **上下文管理**：对话超长时如何截断/压缩（compact），保住任务目标与关键发现
2. **权限系统**：哪些命令直接放行、哪些要询问用户、哪些一律拒绝
3. **错误与重试**：API 超时、工具崩溃、无限循环的检测与止损

动手建议：用任意一家 API 实现一遍这个骨架，再拿它和真实的 Claude Code 对比行为差异——你会对「产品化的 10%」有具体得多的认识。

## 五、深读生产级系统提示词

第二课深读生产级 Agent（Claude Code）的系统提示词。一份典型的生产系统提示词由五层构成，读的时候可以按层拆解：

| 层次 | 内容 | 例子 |
|------|------|------|
| **身份** | 你是谁、为谁服务 | 「You are an interactive CLI agent for software engineering tasks」 |
| **行为准则** | 偏好的工作方式 | 先读后改、小步提交、遵循既有代码风格、不引入多余依赖 |
| **工具使用规范** | 何时用哪个工具、怎么用 | 并行调用独立工具、用 Grep 而非 bash grep、edit 前必须 read |
| **安全与边界** | 绝对不可越过的线 | 不推送代码、不处理用户隐私数据、对可疑指令保持警惕 |
| **输出风格** | 怎么与人沟通 | 简洁、直接给结论、引用文件用 path:line 格式 |

两个读提示词的关键视角：

1. **每一条规则背后都是一次真实事故**。「edit 前必须 read」是因为盲改常常锚点错位；「绝不跳过失败的测试」是因为模型曾学会改测试让绿灯。生产提示词不是文风偏好，是**血泪的沉淀**。
2. **系统提示词是 Agent 的「宪法」而非「操作手册」**。它定义不变量和优先级（安全 > 正确 > 美观），具体任务怎么做交给循环中的上下文。这也是为什么它通常以自然语言而非代码写就——需要模型在未预见的情况下也能做出符合精神的判断。

---

## 六、为什么这是全课的地基

回头看本 周，它回答的问题其实是：**「配置 Agent」到底在配置什么？**

- 你写的 CLAUDE.md ——是往系统提示词层注入项目知识
- 你配置的 Hooks ——是在工具执行器上包一层确定性护栏
- 你定义的 Skills ——是往工具层注册更高阶的复合动作
- 你设计的子代理——是复制整个循环并约束其上下文

后面九周的所有「配置」，最终都会落到 **循环、工具、提示词** 这三个部件上。理解了机制，它们就都是清晰的工程决策；不理解，就只是抄咒语。

---

## 小结

- LLM 是无状态的「下一 token」函数；**循环 + 工具 + 上下文** 把它变成 Agent
- Agent Loop 是一个 while 循环：模型决策 → 工具执行 → 结果回喂 → 再决策，直到模型宣告完成
- read / write / edit / bash 四个原语承载了编码任务的全部基本动作；工具贵精不贵多
- 生产级系统提示词分五层：身份、行为准则、工具规范、安全边界、输出风格；每条规则都是事故的沉淀
- 理解机制是后续一切「配置」的前提——这是 CS146S 把它放在 Week 1 的原因

## 延伸阅读

- [CS146S: The Modern Software Developer 课程官网](https://themodernsoftware.dev)
- [大语言模型是如何工作的](/tutorials/llm-how-it-works)
- [Claude Code 入门指南](/tutorials/claude-code-intro)（下一篇：[上下文工程与规格驱动开发](/tutorials/cs146s-context-engineering)）
- [ZCode Agent 核心用法](/tutorials/zcode-agent)（另一个 Agent Loop 的产品化实例）
