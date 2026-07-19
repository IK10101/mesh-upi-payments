const redis = require('../redis/client');

const FRESHNESS_WINDOW_SECONDS = 5 * 60; 

async function isReplayRedis(payload) {
  const { nonce, timestamp } = payload;

  if (!nonce || !timestamp) {
    return { isReplay: true, reason: 'Missing nonce or timestamp' };
  }

  const now = Date.now();
  const age = now - timestamp;

  if (age > FRESHNESS_WINDOW_SECONDS * 1000) {
    return { isReplay: true, reason: `Payload too old (${Math.round(age / 1000)}s)` };
  }

  const key = `nonce:${nonce}`;
  const result = await redis.set(key, '1', 'EX', FRESHNESS_WINDOW_SECONDS, 'NX');

  if (result === null) {
    return { isReplay: true, reason: 'Nonce already used (Redis)' };
  }

  return { isReplay: false, reason: null };
}

module.exports = { isReplayRedis };