镜像构建好了，接下来回答用户那句话："网址是什么？"——把服务放到服务器上、配上域名和 HTTPS、让外网稳定访问，这一步叫**上线**。很多 AI 项目死在这里：不是代码不行，而是没人会把"容器"变成"用户能访问的网站"。

本篇覆盖上线的完整链路：服务器准备、端口与防火墙、Nginx 反向代理、域名解析、HTTPS 证书。本平台的线上部署（前端 8001、后端 8400、Nginx 反代）会作为贯穿案例。

## 你将学到

- 上线的标准链路：服务器 → 端口 → 反向代理 → 域名 → HTTPS
- Nginx 反向代理的配置写法（静态站点 + API 转发）
- 域名解析与 HTTPS 证书（Let's Encrypt 自动续期）
- 部署后的验证清单

## 上线链路全景

用户在浏览器输入 `https://yourapp.com` 之后发生的事：

```text
DNS 解析 → 你的服务器公网 IP
        → 服务器 80/443 端口（防火墙放行）
        → Nginx（反向代理）
             ├─ 静态资源：直接返回（前端产物）
             └─ /api/*：转发给内部容器（如 127.0.0.1:8400）
        → HTTPS 由 Nginx 统一终结
```

核心思想：**对外只暴露 80/443 的 Nginx，所有应用容器藏在内部网络**。安全、灵活、换后端不动域名。

## 第一步：服务器与端口

- 一台有公网 IP 的云服务器（2C4G 起步够跑本平台这种静态+API 应用；GPU 推理按需另算）。
- 安全组/防火墙只放行：`22`（SSH，建议限源 IP）、`80`、`443`。**应用端口（如 8400）不对公网开放**，只让 Nginx 在本机转发。
- 装好 Docker 与 compose 插件，`docker compose up -d` 把服务跑起来（此时只能 `curl 127.0.0.1:8400` 本机验证）。

## 第二步：Nginx 反向代理

本平台的真实结构可以直接套用：前端是 nginx 容器（宿主 8001），后端是 FastAPI 容器（宿主 8400）。在宿主机（或网关容器）的 Nginx 上：

```nginx
server {
    listen 80;
    server_name yourapp.com;

    # 前端：反代到前端容器
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
    }

    # 后端 API：按路径分流
    location /api/ {
        proxy_pass http://127.0.0.1:8400;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;   # 让后端拿到真实客户端 IP
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket（AI 流式对话常用）需要升级头
    location /ws/ {
        proxy_pass http://127.0.0.1:8400;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

三个高频坑：忘了 `X-Real-IP`（后端日志全是 127.0.0.1）、流式响应被缓冲（加 `proxy_buffering off;`，AI 打字机效果卡顿的元凶）、上传大文件 413（`client_max_body_size 50m;`）。

## 第三步：域名解析

在域名服务商处加两条记录：

| 类型 | 主机记录 | 值 | 说明 |
|------|---------|-----|------|
| A | `@` | 服务器公网 IP | 根域名 |
| A | `www` | 同上 | www 变体 |

国内服务器+已备案域名才开放 80/443；不想备案就用香港/海外节点。生效几分钟到几小时不等（`nslookup yourapp.com` 验证）。

## 第四步：HTTPS（Let's Encrypt）

免费证书 + 自动续期，一行命令的事：

```bash
# 安装 certbot 后：
certbot --nginx -d yourapp.com -d www.yourapp.com
```

certbot 会自动改写 Nginx 配置：80 跳转 443、挂载证书、设置续期（cron/systemd timer 自动跑）。此后 HTTP 自动 301 到 HTTPS。

证书相关的两条纪律：**到期前自动续期要验证过一次**（`certbot renew --dry-run`）；私钥 `.pem` 文件权限收紧，且永不进代码库。

## 上线验证清单

- [ ] `https://yourapp.com` 打开正常，HTTP 自动跳 HTTPS
- [ ] API 经域名可访问（`https://yourapp.com/api/...`），返回符合预期
- [ ] 后端日志里能看到真实客户端 IP
- [ ] 直接访问 `:8400` 等应用端口从公网**打不通**（安全组验证）
- [ ] `docker compose ps` 全部 Up；`docker inspect --format '{{.State.Health.Status}}'` 或日志无异常
- [ ] 服务器重启后服务自动恢复（`restart: unless-stopped` + compose 自启）

## 典型场景

- **场景 A：AI 聊天应用（流式 SSE）。** Nginx 反代到 FastAPI，务必 `proxy_buffering off`，否则打字机效果变成"卡半天一次蹦一大段"。
- **场景 B：内网工具先不买域名。** 跳过 DNS/HTTPS，直接 `http://内网IP:8001` 用起；但端口仍建议走 Nginx 统一入口，为将来上域名留路。
- **场景 C：一台服务器跑多个应用。** Nginx 按域名分 `server{}` 块（虚拟主机），`app-a.com` 与 `app-b.com` 各反代到不同容器，互不干扰。

## 小结

上线的标准姿势五步走：**服务器就绪 → 应用容器化跑起来 → Nginx 统一入口反代 → 域名解析 → HTTPS 自动化**。之后每次迭代就是"重新构建镜像 → 重启容器"，为下一篇的 CI/CD 自动化铺平了道路。

## 延伸阅读

- 下一篇：《CI/CD 入门：自动化构建、测试与发布》
- [Nginx 反向代理指南](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Certbot 官方](https://certbot.eff.org/)
- 本平台仓库 `frontend/nginx.conf`：容器内 nginx 配置实例
