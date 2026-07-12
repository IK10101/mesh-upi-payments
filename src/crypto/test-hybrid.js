const crypto = require('crypto');
const { encryptPayload, decryptPayload } = require('./hybridEncryption');


const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const payment = {
  senderId: 'user-001',
  receiverId: 'user-002',
  amount: 500,
  nonce: crypto.randomBytes(8).toString('hex'),
  timestamp: Date.now()
};

console.log('--- Original Payment ---');
console.log(payment);

const encrypted = encryptPayload(payment, publicKey);
console.log('\n--- Encrypted Package ---');
console.log(encrypted);

const decrypted = decryptPayload(encrypted, privateKey);
console.log('\n--- Decrypted Payment ---');
console.log(decrypted);

console.log('\n--- Match? ---');
console.log(JSON.stringify(payment) === JSON.stringify(decrypted));