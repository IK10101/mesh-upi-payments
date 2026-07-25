const fs = require('fs');
const crypto = require('crypto');
const { encryptPayload,decryptPayload} = require('../crypto/hybridEncryption');
const { isReplayRedis} = require('../crypto/redisReplayProtection');

const publicKey = fs.readFileSync('server-public-key.pem','utf-8');
const privateKey = fs.readFileSync('server-private-key.pem','utf-8');

function senderCreatesPayment(senderId, receiverId, amount) {
  const payment = {
    senderId,
    receiverId,
    amount,
    nonce: crypto.randomBytes(8).toString('hex'),
    timestamp: Date.now()
  };
  console.log('[Sender] Created payment:', payment);
  const encrypted = encryptPayload(payment, publicKey);
  console.log('[Sender] Encrypted, ready to hand to bridge node.\n');
  return encrypted;
}

function bridgeNodeRelay(nodeName, encryptedPackage) {
  console.log(`[${nodeName}] Received encrypted package, forwarding blindly.`);
  console.log(`[${nodeName}] (I cannot read this - I only have ciphertext bytes)\n`);
  return encryptedPackage; // just passes it along unchanged
}

async function serverReceivesPayment(encryptedPackage) {
  console.log('[Server] Received package, decrypting...');
  const payment = decryptPayload(encryptedPackage, privateKey);
  console.log('[Server] Decrypted payment:', payment);

  const replayCheck = await isReplayRedis(payment);
  if (replayCheck.isReplay) {
    console.log('[Server] REJECTED as replay:', replayCheck.reason);
    return;
  }

  console.log('[Server] Payment accepted and would now be settled.\n');
}

async function main() {
  console.log('=== Simulating mesh payment: Sender -> Bridge A -> Bridge B -> Server ===\n');

  const encrypted = senderCreatesPayment('user-001', 'user-002', 750);
  const afterBridgeA = bridgeNodeRelay('Bridge Node A', encrypted);
  const afterBridgeB = bridgeNodeRelay('Bridge Node B', afterBridgeA);
  await serverReceivesPayment(afterBridgeB);
}

main().catch((err) => console.error('Error:', err));






