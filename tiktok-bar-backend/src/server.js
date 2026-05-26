import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import http from 'node:http';
import os from 'node:os';
import { Server } from 'socket.io';
import { TikTokLiveService } from './tiktokLiveService.js';

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const configuredOrigins = FRONTEND_ORIGIN.split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowsAnyOrigin = configuredOrigins.includes('*');
const corsOrigin = allowsAnyOrigin
  ? true
  : (origin, callback) => {
      if (!origin || configuredOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by FRONTEND_ORIGIN`));
    };

const getNetworkUrls = () =>
  Object.values(os.networkInterfaces())
    .flat()
    .filter((network) => network?.family === 'IPv4' && !network.internal)
    .map((network) => `http://${network.address}:${PORT}`);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const tiktokLive = new TikTokLiveService({ io });

app.get('/health', (_req, res) => {
  res.json({ ok: true, status: tiktokLive.getStatus() });
});

app.get('/tiktok/status', (_req, res) => {
  res.json(tiktokLive.getStatus());
});

app.post('/tiktok/connect', async (req, res) => {
  try {
    const status = await tiktokLive.connect(req.body?.username || process.env.TIKTOK_USERNAME, {
      sessionId: process.env.TIKTOK_SESSION_ID,
      ttTargetIdc: process.env.TIKTOK_TARGET_IDC,
    });
    res.json(status);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/tiktok/disconnect', async (_req, res) => {
  await tiktokLive.disconnect();
  res.json(tiktokLive.getStatus());
});

io.on('connection', (socket) => {
  socket.emit('tiktok:status', tiktokLive.getStatus());

  socket.on('tiktok:connect', async ({ username } = {}, callback) => {
    try {
      const status = await tiktokLive.connect(username || process.env.TIKTOK_USERNAME, {
        sessionId: process.env.TIKTOK_SESSION_ID,
        ttTargetIdc: process.env.TIKTOK_TARGET_IDC,
      });
      callback?.({ ok: true, status });
    } catch (error) {
      callback?.({ ok: false, message: error.message });
    }
  });

  socket.on('tiktok:disconnect', async (callback) => {
    await tiktokLive.disconnect();
    callback?.({ ok: true, status: tiktokLive.getStatus() });
  });
});

server.listen(PORT, HOST, async () => {
  console.log(`Backend listening on http://${HOST}:${PORT}`);
  getNetworkUrls().forEach((url) => console.log(`Backend LAN URL: ${url}`));
  console.log(`Socket.IO accepts origin: ${FRONTEND_ORIGIN}`);

  if (process.env.TIKTOK_USERNAME) {
    try {
      await tiktokLive.connect(process.env.TIKTOK_USERNAME, {
        sessionId: process.env.TIKTOK_SESSION_ID,
        ttTargetIdc: process.env.TIKTOK_TARGET_IDC,
      });
    } catch (error) {
      console.error(`Auto-connect failed for @${process.env.TIKTOK_USERNAME}:`, error.message);
    }
  }
});

const shutdown = async () => {
  await tiktokLive.disconnect(false);
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
