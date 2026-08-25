FLUX 是 Black Forest Labs（BFL）推出的生图模型系列——这家公司由 Stable Diffusion 论文的核心作者创立，可以理解为"SD 原班人马的二代作品"。2024 年 FLUX.1 发布时，它在提示词遵循、人体结构（尤其是手）、图内文字渲染上直接刷新了开源生图的上限；之后的 **FLUX.2** 又把多参考图、更高分辨率与更强调词能力带入开源权重。

这篇教程讲清 FLUX 系列的版本差异、能力特点、硬件门槛与许可证红线。

## 你将学到

- FLUX.1 各变体（dev / schnell / pro）的区别与许可证差异
- FLUX.2 相对一代的升级点
- FLUX 与 Stable Diffusion 的架构与体验差异
- 用 diffusers 跑通 FLUX 生图与显存优化手段

## 版本地图：变体名决定一切

FLUX 的命名规则你必须先搞清楚，因为**变体名直接决定许可证**：

| 变体 | 开放性 | 许可证 | 定位 |
|------|--------|--------|------|
| FLUX.1/2 **[dev]** | 开放权重下载 | **非商用**（商用需授权/API） | 质量旗舰，研究与个人创作 |
| FLUX.1 **[schnell]** | 开放权重 | Apache-2.0 | 蒸馏加速版，可商用 |
| **[pro]** 系 | 仅 API | 商业闭源 | 官方托管最高质量 |

**最常见的踩坑**：拿 `[dev]` 直接上商业项目。个人学习、开源项目演示没问题；公司产品要商用，要么用 `[schnell]`，要么走 BFL 官方 API/购买授权。

## FLUX.1：一代标杆

- **架构**：MMDiT 双流 Transformer（12B 参数），配合一系列蒸馏变体。
- **强项**：
  - **提示词遵循**：长句、多元素、空间关系（"左边的桌上放着一杯…"）的执行度远超同期 SD。
  - **图内文字**：海报标语、招牌这类"文字渲染"任务，一代就把开源水平拉到可用。
  - **手部/解剖结构**： notoriously 难画的手，FLUX 明显更稳。
- **门槛**：12B 全精度需要 24G 级显存；社区量化版（fp8/nf4/GGUF）可压到 8–12G，质量损失有限。

## FLUX.2：当前开源旗舰

相对一代的主要升级（以官方开放权重与文档为准）：

- **多参考图输入**：不只是文生图，可给多张参考图做风格/主体引导，向"可控生成"再进一步。
- **更强的提示词遵循与文字渲染**：长文本、多语言（含中文场景）表现继续提升。
- **更高原生分辨率**与更完整的编辑能力（局部重绘、扩图等一体化）。
- **生态位**：ComfyUI 与 diffusers 均第一时间支持，工作流资产在快速积累。

选型建议：显存与许可证允许时，**优先 FLUX.2 [dev]；要商用且预算有限，用 schnell 系或评估 API**。

## 与 Stable Diffusion 的体感差异

| 维度 | SDXL/SD3.5 | FLUX.1/2 |
|------|------------|----------|
| 提示词风格 | 关键词堆砌 + 加权语法 | **自然语言长句**效果最好 |
| LoRA/生态 | 极厚（十几年资产） | 增长快但更薄 |
| 图内文字 | 勉强 | 强项 |
| 显存 | 8–16G | 12–24G（量化后 8G+） |
| 许可证 | 社区许可（相对宽松） | dev 非商用，需看清变体 |

实操上两者是**互补**关系：要生态玩法、微调资产用 SD；要一次到位的成图质量、文字渲染用 FLUX。

## 上手示例（diffusers）

```python
import torch
from diffusers import FluxPipeline

pipe = FluxPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-dev",
    torch_dtype=torch.bfloat16,
).to("cuda")
# 显存不足时：
# pipe.enable_model_cpu_offload()   # 12G 也能跑，速度换空间

image = pipe(
    prompt='A minimalist poster with the text "Learn LLM" in bold serif type, cream background',
    guidance_scale=3.5,
    num_inference_steps=28,
).images[0]
image.save("flux.png")
```

注意 FLUX 的 `guidance_scale` 习惯值在 2–4 之间（不是 SD 的 7–9），提示词写自然长句效果更好。

## 典型场景

- **海报/封面生成**：图内文字是刚需 → FLUX 几乎是开源唯一解。
- **高保真电商/人像**：FLUX.2 + 少量 LoRA 风格微调，接近商业素材质量。
- **可控创作流水线**：FLUX.2 多参考图 + ComfyUI 节点，做风格统一的系列图。

## 小结

FLUX 用一代时间证明了"开源也能有旗舰质量"，FLUX.2 则把开源生图推进到多参考、强文字的新阶段。用它记住三件事：**变体名决定许可证（dev 非商用）、自然语言提示词、量化解决显存**。

## 延伸阅读

- [black-forest-labs GitHub](https://github.com/black-forest-labs)
- [FLUX 官方文档与 API](https://docs.bfl.ai/)
- 下一篇：《国产生图模型：Qwen-Image、Kolors 与混元图像》
