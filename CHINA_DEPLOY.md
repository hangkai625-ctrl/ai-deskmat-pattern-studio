# China-friendly Deployment Notes

For users in China mainland, choose a server close to your users, such as:

- Alibaba Cloud ECS
- Tencent Cloud Lighthouse or CVM
- Huawei Cloud ECS
- Baidu Cloud
- Hong Kong VPS if ICP filing is not ready

## Recommended setup

- Node.js 20 or newer
- PM2 to keep the app running
- Nginx reverse proxy
- HTTPS certificate from the cloud provider or Let's Encrypt

## Start command

```bash
node server.mjs
```

or with PM2:

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## Environment variables

Set these on the server or in your cloud panel:

```bash
IMAGE_API_TOKEN=your-token
IMAGE_API_URL=https://api.mooko.ai/v1/images/generations
IMAGE_EDIT_API_URL=https://api.mooko.ai/v1/images/edits
IMAGE_MODEL=gpt-image-2-pro
IMAGE_RESPONSE_FORMAT=b64_json
PORT=5173
```

## Important

- If the Mooko API is only reachable from specific regions, deploy the server in a region that can access it.
- If you bind a mainland China domain to a mainland server, ICP filing is usually required.
- Keep the API token only in server environment variables.
