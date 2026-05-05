# AI Deskmat Pattern Studio

A lightweight AI image generation web app for deskmat and flat pattern design. It supports two modes:

- Text to image: generate artwork from a prompt.
- Image to image: upload a reference image, then generate a new image guided by the prompt.

The UI is a single page app, and the backend keeps the API token away from the frontend when deployed with environment variables.

## Run locally

```bash
node server.mjs
```

Open `http://localhost:5173`.

## Environment variables

```bash
IMAGE_API_TOKEN=your-bearer-token
IMAGE_API_URL=https://api.mooko.ai/v1/images/generations
IMAGE_EDIT_API_URL=https://api.mooko.ai/v1/images/edits
IMAGE_MODEL=gpt-image-2-pro
IMAGE_SIZE=2048x1152
IMAGE_QUALITY=high
IMAGE_MODERATION=auto
IMAGE_RESPONSE_FORMAT=b64_json
PORT=5173
```

If `IMAGE_API_TOKEN` is not set on the server, users can paste a token in the site settings dialog. For production, set it on the hosting platform instead.

## Deploy

The repo includes:

- `Dockerfile` for container platforms.
- `render.yaml` for Render Blueprint deployment.
- `ecosystem.config.cjs` for PM2 on a VPS.

Health check path: `/api/health`.
