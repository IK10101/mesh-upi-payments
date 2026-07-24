const PAYMENT_PAYLOAD = {
  senderId: 'user-001',
  receiverId: 'user-002',
  amount: 999
};


const { isReplayRedis } = require('../crypto/redisReplayProtection');

async function simulateConcurrentBridgeNodes() {
  const sharedNonce = 'concurrent-test-nonce-' + Date.now();
  const payload = {
    ...PAYMENT_PAYLOAD,
    nonce: sharedNonce,
    timestamp: Date.now()
  };

  console.log(`Firing 5 simultaneous "bridge node" deliveries with nonce: ${sharedNonce}\n`);

  const attempts = Array.from({ length: 5 }, (_, i) => i + 1);

  const results = await Promise.all(
    attempts.map(async (attemptNumber) => {
      const result = await isReplayRedis(payload);
      return { attemptNumber, ...result };
    })
  );

  results.forEach((r) => {
    console.log(
      `Attempt ${r.attemptNumber}: ${r.isReplay ? 'BLOCKED' : 'ALLOWED'}` +
      (r.reason ? ` (${r.reason})` : '')
    );
  });

  const allowedCount = results.filter((r) => !r.isReplay).length;
  console.log(`\nTotal allowed: ${allowedCount} (should be exactly 1)`);
}

simulateConcurrentBridgeNodes()
  .catch((err) => console.error('Error:', err))
  .finally(() => process.exit(0));