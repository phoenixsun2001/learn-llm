"在我的电脑上明明能跑。"——这是 AI 开发新手最常见的一句辩解，也是生产事故最常见的开场白。AI 时代的开发节奏让"快速出原型"变得空前容易，但**从原型到可部署的产物**之间隔着一整套基础知识：构建、打包、依赖锁定、配置分离。

这是《AI编程全链路》路径的第一篇，我们把"能跑"升级成"能交付、能部署、能迭代"。

## 你将学到

- "源码"与"产物"的区别，为什么部署的是产物而不是源码
- 前端构建：Vite/webpack 把源码变成什么
- 后端打包：依赖锁定（requirements/package-lock）与虚拟环境
- 配置分离：环境变量与 .env，把"秘密"挡在代码库之外
- 一个自查清单：你的项目达到"可部署"标准了吗

## 核心观念：部署的是产物，不是源码

新手最常见的认知错位：把整个项目文件夹拷到服务器上，装一堆全局依赖，然后 `python app.py`。这会在三天后变成一场灾难——服务器上 Python 版本不对、依赖冲突、前端没编译、密码写死在代码里。

正确的思维是**产物思维**：

> 在受控的环境里，把源码**构建**成自包含、可复制、可回滚的**产物**（构建产物 / 容器镜像 / 安装包），部署和迭代的单位是产物。

这个观念贯穿整条路径：本篇讲构建打包，下一篇讲把产物装进容器，之后是上线、自动化与架构。

## 前端构建：源码如何变成网站

以 Vite（本平台使用）为例：

```bash
npm install          # 按 package-lock.json 精确安装依赖
npm run build        # 产出 dist/ 目录
npm run preview      # 本地预览构建产物
```

关键认知：

- `dist/` 里是**纯静态文件**（HTML/CSS/JS），任何静态服务器（Nginx、对象存储、CDN）都能托管。
- 构建时 `import` 的代码被合并压缩，`src/data/*.json` 这类被引入的资源**编译进了 JS 包**——改它们要重新构建，而不是改服务器文件。
- `VITE_` 前缀的环境变量在**构建时**注入，产物一旦生成就是定死的——这就是为什么本平台的 Supabase 配置是构建参数。

## 后端打包：锁死你的依赖

Python 项目的两个致命坏习惯：只交 `requirements.txt` 不锁版本、在系统全局环境里装包。

正确姿势：

```bash
python -m venv .venv                # 虚拟环境：隔离依赖
.venv\Scripts\activate              # Windows 激活（Linux: source .venv/bin/activate）
pip install -r requirements.txt
pip freeze > requirements-lock.txt  # 锁定精确版本
```

要点：

- **锁文件进版本库**（`requirements-lock.txt` / `package-lock.json` / `poetry.lock`），部署时按锁文件安装，保证"我机器上的版本"= "服务器上的版本"。
- 虚拟环境目录（`.venv/`、`node_modules/`）**不进**版本库，靠锁文件重建。
- Python 版本本身也是依赖：声明它（Dockerfile 的 `FROM python:3.12-slim`、`pyproject.toml` 的 requires-python）。

## 配置分离：代码与秘密

任何在开发/测试/生产之间会变的值——数据库地址、API Key、端口、域名——都不该写死在代码里：

- 代码里只读环境变量：`os.environ["ADMIN_TOKEN"]`、`import.meta.env.VITE_X`
- 每个环境一份配置：本地用 `.env`（**gitignore**），服务器用环境变量或受控的 `.env`
- `.env.example` 进版本库当模板，真实 `.env` 永远不进

判断标准：**把仓库公开，会不会出事故？** 会，就说明秘密还在代码里。

## 可部署自查清单

- [ ] 一条命令能构建出产物（`npm run build` / 打包脚本）
- [ ] 依赖有锁文件，且锁文件进了版本库
- [ ] 无任何写死的密钥/密码/内网地址
- [ ] 配置全部走环境变量，`.env.example` 齐全
- [ ] 产物不依赖"我电脑上装过的东西"（全局包、手工补丁）
- [ ] README 写清"如何构建、如何运行、需要哪些环境变量"

## 典型场景

- **场景 A：AI 写的 React 小工具要给同事用。** 别发源码让对方装 Node——`npm run build` 出 `dist/`，扔到任意静态托管（Nginx/内网文件服务/对象存储）发个链接。
- **场景 B：FastAPI + pandas 的数据处理脚本要上线。** 从"全局 pip 装"改为 venv + 锁文件 + 环境变量，下一篇再装进 Docker，才算完成"可部署"改造。
- **场景 C：AI 助手生成的新代码引入了新依赖。** 提交前检查锁文件是否同步更新——漏了它，CI（第四篇）会第一个报错。

## 小结

产物思维是生产可用性的第一块地基：**构建出确定性产物、锁死依赖、分离配置**。做到这三点，你的项目才有资格谈部署。下一篇我们把产物装进容器，让"在我机器上能跑"变成"在哪里都能跑"。

## 延伸阅读

- 下一篇：《容器化实战：Dockerfile 与 docker compose》
- [Vite 构建指南](https://vitejs.dev/guide/build.html)
- [Python venv 官方文档](https://docs.python.org/3/library/venv.html)
- [12-Factor App：配置原则](https://12factor.net/zh_cn/config)
