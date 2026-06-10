require('dotenv').config();
const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const cron         = require('node-cron');

const authRoutes  = require('./routes/auth');
const gameRoutes  = require('./routes/game');
const crewRoutes  = require('./routes/crew');
const ratsRoutes  = require('./routes/rats');
const shopRoutes  = require('./routes/shop');
const { initSocket } = require('./socket');
const { getRedis }   = require('./db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
});

// ---- Middleware ----
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());

// ---- Routes ----
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth',   authRoutes);
app.use('/game',   gameRoutes);
app.use('/crew',   crewRoutes);
app.use('/rats',   ratsRoutes);
app.use('/shop',   shopRoutes);

// ---- Socket.io ----
initSocket(io);

// ---- Daily shop refresh (midnight UTC) ----
cron.schedule('0 0 * * *', async () => {
  try {
    const redis = getRedis();
    await redis.del('shop:daily');
    console.log('[cron] Daily shop cleared');
  } catch (e) {
    console.error('[cron] shop clear error', e.message);
  }
});

// ---- Start ----
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`ScrapRats backend running on :${PORT}`));
