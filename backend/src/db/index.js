const { Pool } = require('pg');
const Redis    = require('ioredis');

let pool   = null;
let redis  = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    pool.on('error', err => console.error('[pg] idle client error', err.message));
  }
  return pool;
}

function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
    redis.on('error', err => console.error('[redis] error', err.message));
  }
  return redis;
}

async function query(sql, params) {
  return getPool().query(sql, params);
}

module.exports = { getPool, getRedis, query };
