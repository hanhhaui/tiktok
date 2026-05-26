# TikTok Bar

Monorepo for the TikTok Bar frontend and backend.

## Projects

- `tiktok-bar-frontend`: Vite React frontend.
- `tiktok-bar-backend`: Express + Socket.IO backend for TikTok LIVE events.

## Local Development

Backend:

```bash
cd tiktok-bar-backend
npm install
copy .env.example .env
npm run dev
```

Frontend:

```bash
cd tiktok-bar-frontend
npm install
copy .env.example .env
npm run dev
```

## Production

GitHub Actions deploys the frontend to GitHub Pages and publishes a backend Docker image to GitHub Container Registry.

Set this GitHub secret before production use:

- `VITE_SOCKET_URL`: public backend URL used by the frontend.

Backend runtime environment variables:

- `PORT`
- `HOST`
- `FRONTEND_ORIGIN`
- `TIKTOK_USERNAME`
- `TIKTOK_SESSION_ID`
- `TIKTOK_TARGET_IDC`
