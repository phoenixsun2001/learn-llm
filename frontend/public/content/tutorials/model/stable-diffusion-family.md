如果说开源生图有一个"共同起点"，那就是 Stable Diffusion。从 2022 年 SD 1.4/1.5 开源至今，它培养了一整代生成式媒体开发者：LoRA 微调、ControlNet 控制、海量社区模型……几乎所有生图工作流的概念都源于这个生态。

这篇教程带你系统过一遍 SD 家族的演进、架构变化、生态玩法与上手路径，帮你判断该从哪一代切入。

## 你将学到

- SD 家族三代（1.5 → SDXL → SD3/3.5）的架构与定位差异
- LoRA、ControlNet、VAE、checkpoint 等生态核心概念
- 用 diffusers 十行代码跑通 SD 生图
- 各代模型的显存档位与选型建议

## 家族演进：三代三个时代

### 第一代：SD 1.5 —— 生态之源

- **架构**：Latent Diffusion（VAE + UNet），512×512 原生。
- **地位**：虽然质量已落后，但它**显存要求低（6G 即可）、微调工具链最全、社区资产天文数字**。今天仍有大量生产工作流跑在 1.5 的各种衍生 checkpoint 上。
- **适合**：入门学习原理、低配显卡、需要海量风格 LoRA 的场景。

### 第二代：SDXL —— 生产力主力

- **架构**：放大版 UNet + 双文本编码器（CLIP + OpenCLIP），原生 1024×1024。
- **地位**：质量对 1.5 是代际提升，显存 8–12G 可跑，是目前**社区微调与商用落地最均衡的一代**。SDXL Turbo/Lightning 等蒸馏版可做到秒级出图。
- **适合**：大多数生产场景的默认起点。

### 第三代：SD3 / SD3.5 —— DiT 时代

- **架构**：抛弃 UNet，改用 **MMDiT**（Multimodal Diffusion Transformer），与 FLUX 同代的 Transformer 架构，多模态理解与文字渲染大幅增强。
- **地位**：Stability 对开源阵营的"抗旗回应"。SD3.5 提供大中小多个尺寸，质量追平第一梯队。
- **注意**：社区生态仍在追赶 SDXL；许可证为 Stability 社区许可，商用有条件。
- **适合**：追求新架构能力、愿意自己搭工作流的团队。

## 生态核心概念

理解这五个词，你就懂了 SD 生态的一半：

- **Checkpoint（底模）**：完整模型权重。换 checkpoint = 换"画师"。社区站上海量风格底模都基于 SD1.5/SDXL 微调而来。
- **LoRA**：小型插件权重（通常几十 MB），在底模上叠加特定风格/人物/构图，训练成本低（消费级显卡可训）。生图工作流里常同时挂多个 LoRA 并调权重。
- **ControlNet**：用**条件图**（骨架、边缘、深度、涂鸦）精确控制构图。这是 SD 生态"可控生成"的杀手锏，做设计稿、保持人物姿态全靠它。
- **VAE**：潜空间与像素空间的编解码器。换更好的 VAE 能明显改善细节与色彩（尤其 1.5 时代）。
- **提示词语法**：`(word:1.2)` 加权、负面提示词（negative prompt）等约定俗成的控制手段。

## 十行代码上手（diffusers）

```python
import torch
from diffusers import StableDiffusionXLPipeline

pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16, variant="fp16",
).to("cuda")

image = pipe(
    prompt="a cinematic photo of a lighthouse at dusk, dramatic light",
    negative_prompt="blurry, low quality, watermark",
    num_inference_steps=30,
).images[0]
image.save("out.png")
```

要点：`float16` 让显存减半；换 SD3.5 只需换成对应的 `StableDiffusion3Pipeline`；批量化就把 `pipe` 复用起来，别每次重建。

## 显存与选型建议

| 模型 | 显存（FP16 参考） | 建议 |
|------|:---:|------|
| SD 1.5 | 4–6G | 学原理、玩 LoRA、低配机 |
| SDXL | 8–12G | 生产默认选择 |
| SDXL Turbo/Lightning | 6–8G | 实时/批量场景 |
| SD3.5 | 10–24G（按尺寸） | 追新架构、高质量 |

显存不够时的三板斧：**量化**（fp8/nf4）、**CPU offload**（`enable_model_cpu_offload()`）、**VAE tiling**（大分辨率省显存）。

## 典型场景

- **电商素材批量生成**：SDXL + 风格 LoRA + ControlNet 控构图，脚本批量出图再人工筛。
- **角色/IP 形象定制**：自训 LoRA（几十张图即可），多场景复用同一角色。
- **设计稿填色/扩图**：ControlNet 的 sketch/lineart 预处理器 + inpainting 管线。

## 小结

SD 家族的三代对应三种选择：**1.5 学生态、SDXL 做生产、SD3.5 尝新架构**。它的真正护城河不是单模型质量，而是 LoRA/ControlNet/checkpoint 构成的生态网络——这也是为什么哪怕 FLUX 质量更强，SD 仍是大多数工作流的底座。

## 延伸阅读

- [Stable Diffusion 官方仓库（Stability-AI）](https://github.com/Stability-AI)
- [diffusers SDXL 文档](https://huggingface.co/docs/diffusers/using-diffusers/sdxl)
- 本路径下一篇：《FLUX 系列：开源生图旗舰》
