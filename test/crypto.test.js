const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { encryptPayload, decryptPayload } = require('../src/crypto/hybridEncryption');
const { isReplay } = require('../src/crypto/replayProtection');


const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

test('hybrid encryption round-trip: decrypted payload matches original', () => {
  const payment = { senderId: 'a', receiverId: 'b', amount: 500 };
  const encrypted = encryptPayload(payment, publicKey);
  const decrypted = decryptPayload(encrypted, privateKey);

  assert.deepStrictEqual(decrypted, payment);
});

test('hybrid encryption: tampering with ciphertext causes decryption to throw', () => {
  const payment = { senderId: 'a', receiverId: 'b', amount: 500 };
  const encrypted = encryptPayload(payment, publicKey);

  const chars = encrypted.encryptedData.split('');
  const idx = Math.floor(chars.length / 2);
  chars[idx] = chars[idx] === 'A' ? 'B' : 'A';
  encrypted.encryptedData = chars.join('');

  assert.throws(() => decryptPayload(encrypted, privateKey));
});

test('replay protection: first use of a nonce is allowed', () => {
  const result = isReplay({ nonce: 'test-nonce-1', timestamp: Date.now() });
  assert.strictEqual(result.isReplay, false);
});

test('replay protection: reusing the same nonce is blocked', () => {
  const payload = { nonce: 'test-nonce-2', timestamp: Date.now() };
  isReplay(payload); 
  const second = isReplay(payload); 

  assert.strictEqual(second.isReplay, true);
  assert.strictEqual(second.reason, 'Nonce has already been seen');
});

test('replay protection: old timestamp is rejected', () => {
  const oldPayload = {
    nonce: 'test-nonce-3',
    timestamp: Date.now() - (10 * 60 * 1000) 
  };
  const result = isReplay(oldPayload);

  assert.strictEqual(result.isReplay, true);
  assert.match(result.reason, /too old/);
});