# AI Deskmat Pattern Studio

公司局域网内使用的 AI 图像生成工具，支持文生图和图生图。项目只部署在公司电脑或公司内网服务器上，不需要公网、云服务器、自动部署或内网穿透。

## 运行方式

1. 准备 Node.js 20 或更新版本。
2. 配置中转站 API Key。
3. 启动服务。

Windows 推荐先双击：

```text
setup-api-key.cmd
```

按提示粘贴中转站 API Key。它只会写入本机 `.env` 文件，不会出现在前端页面，也不会上传到 GitHub。

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

然后双击启动：

```text
start-lan.cmd
```

也可以用命令行启动：

```bash
node server.mjs
```

启动窗口必须保持打开；关闭窗口后网站就会停止。

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

## 无法访问时检查

- 运行网站的命令行窗口是否还开着。
- 本机能否打开 `http://localhost:3000/api/health`。
- 同事访问的 IP 是否是运行网站那台电脑的内网 IPv4。
- Windows 防火墙是否允许 Node.js 或 `3000` 端口。
- 同事电脑和运行网站的电脑是否在同一个公司局域网/VPN 内。

## 注意事项

- API Key 只放在服务端 `.env` 文件里。
- 前端页面不会输入、保存或发送 API Key。
- 不要把 `.env` 上传到 GitHub。
- 如果只允许本机访问，把 `.env` 里的 `HOST` 改成 `127.0.0.1`。
