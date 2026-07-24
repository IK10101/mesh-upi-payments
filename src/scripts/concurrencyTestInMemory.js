const { isReplay } = require('../crypto/replayProtection');

async function simulateConcurrentInMemory() {
  const sharedNonce = 'concurrent-inmemory-test-' + Date.now();
  const payload = { nonce: sharedNonce, timestamp: Date.now() };

  console.log(`Firing 5 simultaneous checks against IN-MEMORY Map, nonce: ${sharedNonce}\n`);

  const attempts = Array.from({ length: 5 }, (_, i) => i + 1);


  const results = attempts.map((attemptNumber) => {
    const result = isReplay(payload);
    return { attemptNumber, ...result };
  });

  results.forEach((r) => {
    console.log(
      `Attempt ${r.attemptNumber}: ${r.isReplay ? 'BLOCKED' : 'ALLOWED'}` +
      (r.reason ? ` (${r.reason})` : '')
    );
  });

  const allowedCount = results.filter((r) => !r.isReplay).length;
  console.log(`\nTotal allowed: ${allowedCount}`);
}

simulateConcurrentInMemory();