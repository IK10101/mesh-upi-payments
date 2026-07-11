const crypto = require('crypto');

// Step 1: Generate an RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048, // key size in bits — 2048 is the current minimum safe standard
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log('--- Public Key ---');
console.log(publicKey);

// Step 2: Encrypt a small message using the public key
const message = 'Send 500 rupees to receiverId=abc123';
const encrypted = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  },
  Buffer.from(message, 'utf8')
);

console.log('\n--- Encrypted (base64) ---');
console.log(encrypted.toString('base64'));

// Step 3: Decrypt using the private key
const decrypted = crypto.privateDecrypt(
  {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  },
  encrypted
);

console.log('\n--- Decrypted ---');
console.log(decrypted.toString('utf8'));