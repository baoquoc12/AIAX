# Deploy AIAX on Render

This repo includes a Docker-based Render blueprint (`render.yaml`). The Docker image builds the Vue frontend, serves it from the Node backend, and installs `ffmpeg`.

## Quick Deploy

1. Push this repo to GitHub.
2. Open Render Dashboard.
3. Create a new Blueprint or Web Service from the GitHub repo.
4. Render will detect `render.yaml` and build from `Dockerfile`.
5. After deploy, open the Render service URL.

## Required Runtime Settings

The app uses these environment variables on Render:

```env
PORT=10000
SERVER_HOST=0.0.0.0
NODE_ENV=production
APP_LANGUAGE=en
INSECURE_TLS=false
STORAGE_LOCAL_PATH=/data/storage
DATABASE_PATH=/data/drama_generator.db
VIDEO_GENERATION_TIMEOUT_MINUTES=60
```

`PUBLIC_BASE_URL` is optional. If it is not set, the backend uses Render's `RENDER_EXTERNAL_URL` and exposes files as:

```text
https://your-service.onrender.com/static/...
```

## Important Storage Note

The free Render plan uses an ephemeral filesystem. SQLite data and generated media under `/data` can be lost after redeploys or restarts.

For real users, use one of these production options:

- Attach a Render persistent disk to `/data` on a paid web service.
- Move generated images/videos to Cloudinary, Cloudflare R2, or S3.
- Use Postgres instead of local SQLite for multi-user production.

## AI Provider Keys

Do not put AI keys in frontend code. Add provider keys from the app's AI Configuration page after deploy, or later wire them through backend environment variables.
