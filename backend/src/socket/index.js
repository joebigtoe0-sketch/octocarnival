const jwt    = require('jsonwebtoken');
const { query, getRedis } = require('../db');

const CHAT_HISTORY_LIMIT = 50;

function initSocket(io) {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.request.headers?.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      socket.userId   = null;
      socket.username = 'Anonymous';
      return next();
    }
    try {
      const payload    = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId    = payload.sub;
      return next();
    } catch {
      socket.userId   = null;
      socket.username = 'Anonymous';
      return next();
    }
  });

  // Subscribe to Redis Pub/Sub for drop announcements
  const redis = getRedis();
  const sub   = redis.duplicate();
  sub.subscribe('drop:announce', (err) => {
    if (err) console.error('[socket] Redis sub error', err.message);
  });
  sub.on('message', (_channel, message) => {
    try {
      const data = JSON.parse(message);
      io.to('global').emit('drop:epic+', data);
    } catch {}
  });

  io.on('connection', async (socket) => {
    socket.join('global');
    if (socket.userId) socket.join(`user:${socket.userId}`);

    // Resolve username
    if (socket.userId) {
      query('SELECT username FROM users WHERE id=$1', [socket.userId])
        .then(({ rows }) => { socket.username = rows[0]?.username || 'Unknown'; })
        .catch(() => {});
    }

    // Send recent chat history
    try {
      const { rows } = await query(
        `SELECT username, message, created_at FROM chat_messages
         ORDER BY created_at DESC LIMIT $1`, [CHAT_HISTORY_LIMIT]
      );
      socket.emit('chat:history', rows.reverse());
    } catch {}

    // ---- Chat ----
    socket.on('chat:message', async ({ text }) => {
      if (!text || typeof text !== 'string') return;
      const clean = text.slice(0, 120).trim();
      if (!clean) return;
      const msg = { user: socket.username, text: clean, ts: Date.now() };
      io.to('global').emit('chat:message', msg);
      if (socket.userId) {
        query(
          'INSERT INTO chat_messages (user_id, username, message) VALUES ($1,$2,$3)',
          [socket.userId, socket.username, clean]
        ).catch(() => {});
      }
    });

    // ---- Sewer Surge (premium event: Redis flag) ----
    socket.on('surge:buy', async () => {
      if (!socket.userId) return;
      const r = getRedis();
      await r.setex('sewer:surge', 300, socket.userId).catch(() => {});
      io.to('global').emit('surge:start', { by: socket.username, duration: 300 });
      setTimeout(() => io.to('global').emit('surge:end'), 300_000);
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { initSocket };
