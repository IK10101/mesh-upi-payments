const { isReplay } = require('./replayProtection');

const payment = {
  nonce: 'abc123',
  timestamp: Date.now()
};

console.log('--- First attempt (should be allowed) ---');
console.log(isReplay(payment));

console.log('\n--- Second attempt, same nonce (should be blocked) ---');
console.log(isReplay(payment));

console.log('\n--- Old timestamp (should be blocked) ---');
const oldPayment = {
  nonce: 'xyz789',
  timestamp: Date.now() - (10 * 60 * 1000) 
};
console.log(isReplay(oldPayment));

console.log('\n--- New unique nonce, fresh timestamp (should be allowed) ---');
const freshPayment = {
  nonce: 'unique-999',
  timestamp: Date.now()
};
console.log(isReplay(freshPayment));