import Redis from 'ioredis';

let redis;

async function bootstrap(redisConfig) {
  const { host, port, username, password } = redisConfig;
  let isReady = false;

  if (redis) {
    // Redis is already connected
    return;
  }

  redis = new Redis({
    host,
    port,
    username,
    password,
  });

  redis.on('ready', () => {
    console.info('✅ Redis is ready!');
    isReady = true;
  });

  redis.on('error', (error) => {
    console.error(error);
  });

  // Wait until redis is ready so the connection is not used before it is established
  let TTL = 30;
  while (!isReady) {
    await _sleep(1000);
    if (--TTL < 1) {
      throw new Error('Redis is not connecting (waited for 30 seconds)');
    }
  }
}

function disconnect() {
  redis.disconnect();
}

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a key with given value and time to live (optional).
 * 
 * @param {string} key   Name for the new key.
 * @param {string} value Value to save to given key.
 * @param {number} [TTL] Seconds to expire key in.
 */
async function createKey(key, value, TTL) {
  return redis.set(key, value, 'EX', TTL);
}

/**
 * Returns value of given key.
 * 
 * @param {string} key Key's name.
 */
async function getKey(key) {
  return redis.get(key);
}

export default {
  bootstrap,
  disconnect,
  createKey,
  getKey,
};
