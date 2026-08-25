模型选好了，接下来是工程问题：怎么把"跑一个模型"变成"一条可复用、可批量、可交付的生成流水线"？答案是 **ComfyUI**（可视化工作流）与 **diffusers**（代码管线）这两件武器——前者负责快速搭建与调试，后者负责生产化与集成。

这篇教程覆盖安装部署、核心概念、典型工作流与生产化路径。

## 你将学到

- ComfyUI 的节点式工作流模型与安装部署（本地/云端）
- 从文生图到图生视频的典型工作流结构
- 工作流的分享、复用与 API 化
- diffusers 与 ComfyUI 的分工：何时写代码、何时拖节点

## ComfyUI：为什么它是事实标准

ComfyUI 用**节点图**描述生成流程：每个节点做一件事（加载模型 → 编码提示词 → 采样 → 解码 → 保存），节点间连线传递数据。它成为开源生成社区事实标准的原因：

- **任何新模型/新玩法（LoRA、ControlNet、放大、视频）发布当天就有节点支持**。
- **工作流即文件**：一张 `.json` 图完整记录流程，社区直接分享复现。
- **天生支持多模型混搭**：SD 出草图 + FLUX 精修 + 模型放大，拖几条线就通。
- **自带 API**：保存的 workflow 可被 HTTP 调用，变成生产服务。

## 安装部署

### 方式一：桌面版（推荐入门）

官方桌面客户端（Windows/macOS）自带便携环境与模型管理器，装完即用。首次启动时下载对应平台的 ComfyUI 核心，然后在 Manager 里装常用扩展。

### 方式二：手动 / 便携包

```bash
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI
pip install -r requirements.txt
python main.py --listen 0.0.0.0 --port 8188
```

`--listen` 允许局域网访问，是云服务器部署的常用姿势。

### 方式三：云端 GPU

国内可用 AutoDL、仙宫云等按小时租卡（镜像市场多有 ComfyUI 现成镜像），海外有 RunPod 等。云端跑通工作流 → 导出 `.json` → 回本地或生产环境复用。

**模型文件放置**：下载的 checkpoint/LoRA/VAE 按 `ComfyUI/models/{checkpoints,loras,vae,...}` 目录归类，管理器能自动发现。

## 核心概念：一张图看懂节点

一条最简文生图工作流：

```text
[Load Checkpoint] ──┬→ [CLIP Text Encode (正向)] ──┐
                    │                                ├→ [KSampler] → [VAE Decode] → [Save Image]
                    └→ [CLIP Text Encode (负向)] ──┘
```

常用节点家族：

- **加载类**：Load Checkpoint / LoRA / VAE / ControlNet 模型
- **条件类**：文本编码、ControlNet 应用（喂骨架/深度/边缘图）
- **采样类**：KSampler（步数、CFG、采样器、种子——种子固定=可复现）
- **解码与后处理**：VAE Decode、放大（Upscale）、Save

进阶后你会自然接触：区域控制、IPAdapter（参考图风格迁移）、inpaint/outpaint（局部重绘/扩图）、AnimateDiff 与视频模型节点。

## 典型工作流三则

1. **生产级文生图**：Checkpoint + 双 LoRA（风格/角色，带权重）+ 负向提示词 + 高分辨率放大（两段式：低分辨率生成 → 超分）。
2. **图生视频流水线**：图模型出首帧 → I2V 节点（Wan/混元）驱动运动 → 抽帧检查 → 视频保存节点。
3. **可控设计稿**：ControlNet（lineart/depth）锁构图 + 提示词换材质风格，做"同构不同皮"的系列图。

## API 化：从工具到服务

ComfyUI 每次运行都带完整工作流数据，开启 API 模式后可被程序调用：

1. 在界面启用开发者模式，导出 **API 格式**的 workflow JSON。
2. 服务端 `POST /prompt` 提交该 JSON（参数如图上占位符替换提示词）。
3. 轮询 `/history/{prompt_id}` 取结果文件路径。

生产建议：ComfyUI 前面套一层自己的 FastAPI 网关（鉴权、限流、任务队列），ComfyUI 只当"渲染引擎"。

## diffusers vs ComfyUI：怎么分工

| 场景 | 用什么 |
|------|--------|
| 探索玩法、调工作流、复用社区图 | ComfyUI |
| 需要精确控制、嵌入业务代码 | diffusers |
| 批量生产、服务集成 | diffusers（或 ComfyUI API + 网关） |
| 团队协作沉淀"生成配方" | ComfyUI workflow JSON 进版本库 |

实践上两者混用：**ComfyUI 定配方 → diffusers 做产品化**。

## 典型场景

- **内容团队素材站**：ComfyUI 云端多卡跑批 + 网关排队，设计师网页提交参数取成品。
- **AI 摄影棚**：FLUX/Qwen-Image 出图 → 局部重绘修瑕 → 放大交付，全流程一张 workflow。
- **视频创作流水线**：生图首帧 → Wan I2V → 自动拼装导出，节点串起来一次跑完。

## 小结

ComfyUI 与 diffusers 是开源生成世界的"工作台"与"车床"：前者用节点图把复杂流水线变成可分享的 JSON，后者用代码把流水线变成可集成的服务。**先用 ComfyUI 跑通想法，再用 diffusers/API 落地生产**——这套组合拳能把你从"会跑模型"带到"能交付产品"。

## 延伸阅读

- [ComfyUI 官方文档](https://docs.comfy.org/)
- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [diffusers 文档](https://huggingface.co/docs/diffusers/)
- 回看本路径首篇：《开源生图与生视频模型全景》
