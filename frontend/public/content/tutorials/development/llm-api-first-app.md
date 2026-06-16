如果你从来没有调用过大语言模型（LLM）的 API，这篇教程会带你从零跑通第一个真实可运行的应用。我们不讲概念堆砌，而是直接写代码：拿到 API Key、发出第一次请求、理解消息结构、加上流式输出和错误处理，最后封装成一个可以用的"一句话摘要器"。

这里有一个关键事实你需要先记住：**"OpenAI 兼容接口"已经成为行业事实标准**。智谱（GLM）、DeepSeek、Moonshot、零一万物、阿里百炼……几乎所有国产厂商，以及大量海外服务，都提供了与 OpenAI 完全相同的接口格式。这意味着你只要学会这一套调用方式，换一个 base_url 和 api_key 就能在不同模型之间无缝切换，迁移成本几乎为零。

## 你将学到

- 如何获取 API Key 并安全地管理它
- 用 Python 发出第一次 chat completion 请求
- system / user / assistant 三种消息角色的作用
- 流式输出（streaming）的用法和体验差异
- 温度（temperature）等关键参数对结果的影响
- 处理超时、限流（429）、网络错误的实用模式
- 把所学整合成一个可运行的"一句话摘要器"小应用

## 准备工作：获取 API Key

我们以"OpenAI 兼容接口"为统一模式。无论你用哪家厂商，流程都一样：

1. 在厂商控制台注册账号（智谱开放平台、DeepSeek 开放平台、OpenAI 等任选其一）。
2. 创建一个 API Key，复制保存——它只在创建时显示一次。
3. 记下对应的 base_url，例如：
   - 智谱 GLM：https://open.bigmodel.cn/api/paas/v4
   - DeepSeek：https://api.deepseek.com
   - OpenAI：https://api.openai.com/v1

**安全第一**：永远不要把 API Key 写死在代码里或提交到 Git。我们用环境变量来管理。

先安装依赖。官方 SDK openai 同时支持任何兼容服务：

```bash
pip install openai python-dotenv
```

在项目根目录创建 .env 文件（记得加进 .gitignore）：

```text
# 替换为你自己的 Key 和对应的 base_url
LLM_API_KEY=sk-your-real-key-here
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-4-flash
```

> 提示：glm-4-flash 是智谱的免费档模型，非常适合练习。换 DeepSeek 就填 deepseek-chat，换 OpenAI 就填 gpt-4o-mini。

## 第一次调用：发出你的第一条消息

创建 hello.py，先跑通最简单的调用：

```python
import os
from dotenv import load_dotenv
from openai import OpenAI

# 1. 加载 .env 里的环境变量
load_dotenv()

# 2. 创建客户端——注意 base_url 决定了你打向哪个服务
client = OpenAI(
    api_key=os.getenv("LLM_API_KEY"),
    base_url=os.getenv("LLM_BASE_URL"),
)

# 3. 发起一次 chat completion
response = client.chat.completions.create(
    model=os.getenv("LLM_MODEL"),
    messages=[
        {"role": "user", "content": "用一句话解释什么是大语言模型。"},
    ],
)

# 4. 从响应里取出文本
print(response.choices[0].message.content)
```

运行 python hello.py，你将看到一行模型返回的解释。如果报错 AuthenticationError，说明 Key 不对；如果 ConnectionError，多半是 base_url 写错或网络不通。

这就是所有 LLM 应用的起点——一个函数调用，进去一段文字，出来一段文字。

## 理解消息结构：三种角色

messages 是一个列表，每条消息都有 role（角色）和 content（内容）。理解三种角色是写好应用的基础：

| 角色 | 作用 | 例子 |
|------|------|------|
| **system** | 设定模型的行为和身份，全局生效 | "你是一名资深翻译，只输出译文。" |
| **user** | 用户的输入 | "把这句话翻成英文：今天天气真好。" |
| **assistant** | 模型之前的回复，用于多轮对话 | "The weather is nice today." |

system 消息通常放在列表第一位，它决定了模型"扮演谁、怎么做"。下面是一个带角色的例子：

```python
messages = [
    {"role": "system", "content": "你是一名严格的产品评审，回答不超过 30 字，直指问题。"},
    {"role": "user", "content": "我的 App 首页有 8 个弹窗，用户怎么看？"},
]
```

多轮对话就是把历史的 assistant 消息也加进列表里，模型会据此延续上下文。

## 流式输出：让响应"打字机式"出现

默认情况下，API 会等模型把整段话全部生成完再一次性返回。这对长文本来说等待感很差。开启流式输出后，模型会一边生成一边把"碎片"（chunk）推送给你，前端就能做到像 ChatGPT 那样的逐字显示。

```python
stream = client.chat.completions.create(
    model=os.getenv("LLM_MODEL"),
    messages=[
        {"role": "user", "content": "写一首关于程序员的四行短诗。"},
    ],
    stream=True,  # 关键：开启流式
)

for chunk in stream:
    # 每个 chunk 里可能包含一小段 token
    piece = chunk.choices[0].delta.content
    if piece:
        print(piece, end="", flush=True)
print()  # 最后换行
```

实践建议：**面向用户的产品一律用流式**，面向后台批处理的任务用非流式即可。

## 关键参数：temperature 和 max_tokens

两个最常用的参数会影响生成结果：

- **temperature**（0~2）：控制随机性。0 几乎确定性、每次回答都一样，适合翻译、抽取这类需要稳定的任务；0.7~1.0 适合一般对话；更高则更"发散"，但容易跑题。
- **max_tokens**：限制模型最多生成多少 token，用来控制成本和响应长度。

```python
response = client.chat.completions.create(
    model=os.getenv("LLM_MODEL"),
    messages=[{"role": "user", "content": "讲个程序员冷笑话。"}],
    temperature=0.8,
    max_tokens=200,
)
```

> 小技巧：调试时把 temperature=0，这样每次结果稳定，方便对比 prompt 改动的效果。

## 错误处理：生产代码的必备项

网络和 API 永远会失败——超时、限流（HTTP 429）、Key 失效、服务端错误（5xx）。生产代码必须处理这些情况。openai SDK 自带指数退避重试，我们再包一层友好的错误提示：

```python
import time
from openai import OpenAI, APIError, RateLimitError, APITimeoutError

def chat(client, model, messages, max_retries=3):
    for attempt in range(1, max_retries + 1):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                timeout=30,  # 单次请求超时秒数
            )
            return resp.choices[0].message.content
        except APITimeoutError:
            print(f"[超时] 第 {attempt} 次重试...")
        except RateLimitError:
            wait = 2 ** attempt  # 指数退避
            print(f"[限流] 等待 {wait}s 后重试...")
            time.sleep(wait)
        except APIError as e:
            print(f"[API错误] {e}")
            raise
        time.sleep(1)
    raise RuntimeError("请求失败，已达到最大重试次数")
```

要点：超时设上限、限流用指数退避、其他错误立即抛出而不是无限重试——避免掩盖真实问题。

## 整合：一个可运行的"一句话摘要器"

把前面学到的全部整合起来，做一个真实可用的小工具——输入一段长文，输出一句话摘要。创建 summarizer.py：

```python
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("LLM_API_KEY"),
    base_url=os.getenv("LLM_BASE_URL"),
)
MODEL = os.getenv("LLM_MODEL")

def summarize(text):
    """把任意长文压缩成一句话摘要，流式返回。"""
    messages = [
        {
            "role": "system",
            "content": (
                "你是一名资深编辑。用一句不超过 40 字的中文概括"
                "用户给出的文本核心信息，不要补充原文没有的内容。"
            ),
        },
        {"role": "user", "content": text},
    ]
    stream = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.2,  # 摘要需要稳定
        stream=True,
    )
    result = []
    for chunk in stream:
        piece = chunk.choices[0].delta.content
        if piece:
            print(piece, end="", flush=True)
            result.append(piece)
    print()
    return "".join(result)

if __name__ == "__main__":
    article = (
        "大型语言模型通过预测下一个词的方式在海量文本上训练，"
        "从而获得语言理解与生成能力。它并非真正理解含义，"
        "而是基于统计规律给出最可能的续写。"
    )
    summarize(article)
```

运行 python summarizer.py，你会看到摘要像打字一样逐字出现。把 article 换成任意一段新闻、技术博客或会议纪要，它都能给你一句话总结。

这就是你的第一个 AI 应用。它小，但五脏俱全：有 system 角色设定、有参数控制、有流式输出、有可复用的函数封装。把它接进一个 Web 接口、一个微信机器人、一个命令行工具，都是顺理成章的下一步。

## 小结

- "OpenAI 兼容接口"是事实标准，换 base_url 和 api_key 就能切换厂商，代码无需改动。
- messages 用 system / user / assistant 三种角色组织对话，system 决定模型身份。
- stream=True 让响应逐字返回，体验远好于等待整段。
- temperature 控制随机性，需要稳定结果（摘要、抽取）就调低。
- 生产代码必须处理超时、限流和重试，openai SDK 自带退避机制。

## 延伸阅读

- [OpenAI API 参考文档](https://platform.openai.com/docs/api-reference/chat)
- [智谱 GLM 开放平台文档](https://open.bigmodel.cn/dev/api)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs)
- [OpenAI Cookbook 实用示例集](https://cookbook.openai.com/)
