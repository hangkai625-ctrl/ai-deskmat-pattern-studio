# Deployment Guide

## Fastest option: Render

1. Open https://render.com and create or log in to your account.
2. Click `New` -> `Web Service`.
3. Connect this GitHub repo: `hangkai625-ctrl/ai-deskmat-pattern-studio`.
4. Use these settings:
   - Runtime: Node
   - Build Command: leave empty
   - Start Command: `node server.mjs`
   - Health Check Path: `/api/health`
5. Add environment variables:
   - `IMAGE_API_TOKEN`: your Mooko API token
   - `IMAGE_API_URL`: `https://api.mooko.ai/v1/images/generations`
   - `IMAGE_EDIT_API_URL`: `https://api.mooko.ai/v1/images/edits`
   - `IMAGE_MODEL`: `gpt-image-2-pro`
   - `IMAGE_RESPONSE_FORMAT`: `b64_json`
6. Deploy.

The site URL will look like `https://your-service-name.onrender.com`.

## Railway or other container platforms

Use the included `Dockerfile`. Set the same environment variables and expose the service port from the platform dashboard.

## VPS / Chinese cloud server

1. Install Node.js 20+.
2. Upload or clone the repo.
3. Set environment variables in `.env` or the server panel.
4. Start with `node server.mjs` or PM2:

```bash
pm2 start ecosystem.config.cjs
```

5. Use Nginx or the cloud panel to reverse proxy your domain to the app port.

## Notes

- Do not commit real API keys.
- Image generation depends on the Mooko endpoint being reachable from the hosting region.
- For China mainland access, a mainland or Hong Kong server is usually faster than free overseas hosting.
