const rateLimit = require('express-rate-limit');

const base = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

const clickLimit = rateLimit({
  windowMs: 1_000, // 1 second
  max: 20,        // max 20 clicks/sec
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Click rate too fast.' },
});

module.exports = { base, clickLimit };
