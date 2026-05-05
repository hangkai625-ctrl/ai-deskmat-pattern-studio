# AI Deskmat Pattern Studio

公司局域网内使用的 AI 图像生成工具，支持文生图和图生图。项目只需要部署在公司电脑或公司内网服务器上，不需要公网、云服务器、自动部署或内网穿透。

## 运行方式

1. 准备 Node.js 20 或更新版本。
2. 在项目根目录创建 `.env` 文件。
3. 把服务端 API Key 写入 `.env`。
4. 启动服务。

`.env` 示例：

```env
IMAGE_API_TOKEN=your-bearer-token
IMAGE_API_URL=https://api.mooko.ai/v1/images/generations
IMAGE_EDIT_API_URL=https://api.mooko.ai/v1/images/edits
IMAGE_MODEL=gpt-image-2-pro
IMAGE_SIZE=2048x1152
IMAGE_QUALITY=high
IMAGE_MODERATION=auto
IMAGE_RESPONSE_FORMAT=b64_json
HOST=0.0.0.0
PORT=3000
```

启动命令：

```bash
node server.mjs
```

本机访问：

```text
http://localhost:3000
```

公司同事访问：

```text
http://公司电脑或内网服务器IP:3000
```

例如：

```text
http://192.168.1.88:3000
```

## 查找内网 IP

Windows：

```powershell
ipconfig
```

找到 `IPv4 地址`，通常类似 `192.168.1.xxx` 或 `10.x.x.x`。

macOS / Linux：

```bash
ifconfig
```

或：

```bash
ip addr
```

## 注意事项

- API Key 只放在服务端 `.env` 文件里。
- 前端页面不会输入、保存或发送 API Key。
- 不要把 `.env` 上传到 GitHub。
- 如果同事打不开，检查公司电脑防火墙是否允许 `3000` 端口。
- 如果只允许本机访问，把 `.env` 里的 `HOST` 改成 `127.0.0.1`。
