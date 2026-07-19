const { isReplayRedis } = require('../crypto/redisReplayProtection');
const  redis  = require('../redis/client');

async function main() {
    const payload = { nonce: 'redis-test-nonce-1', timestamp: Date.now()};
    console.log('---Attempt 1 (should be allowed)---');
    console.log(await isReplayRedis(payload));

    console.log('---Attempt 2,same nonce (should be blocked)---');
    console.log(await isReplayRedis(payload));

    redis.disconnect();

}

main();