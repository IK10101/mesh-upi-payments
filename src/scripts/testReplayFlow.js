require('dotenv').config();

const {PrismaClient} = require('@prisma/client');
const {PrismaPg} = require('@prisma/adapter-pg');
const fs = require('fs');
const crypto = require('crypto');
const {encryptPayload} = require('../crypto/hybridEncryption');
const { isReplay } = require('../crypto/replayProtection');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const publicKey = fs.readFileSync('server-public-key.pem', 'utf8');

async function attemptPayment(nonce) {
    const payment = {
        senderId: 'user-001',
        receiverId: 'user-002',
        amount: 500,
        nonce: nonce,
        timestamp: Date.now()
    };

    const replayCheck = isReplay(payment);
    if (replayCheck.isReplay) {
        console.log('BLOCKED(in memory):', replayCheck.reason);
        return;
    }

    const encrypted = encryptPayload(payment, publicKey);

    try {
    await prisma.payment.create({
      data: {
        senderId: payment.senderId,
        receiverId: payment.receiverId,
        amount: payment.amount,
        nonce: payment.nonce,
        status: 'pending',
        encryptedData: encrypted.encryptedData,
        encryptedKey: encrypted.encryptedKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      }
    });
    console.log('SAVED successfully with nonce:', nonce);
    } catch (err) {
    if (err.code === 'P2002') {
      console.log('BLOCKED (database unique constraint) for nonce:', nonce);
    } else {
      throw err;
    }
  }
}

async function main() {
  const fixedNonce = 'test-nonce-fixed-001';

  console.log('--- Attempt 1 (should succeed) ---');
  await attemptPayment(fixedNonce);

  console.log('\n--- Attempt 2, same nonce, same process (should be blocked in-memory) ---');
  await attemptPayment(fixedNonce);
}

main()
  .catch((err) => console.error('Unexpected error:', err))
  .finally(() => prisma.$disconnect());
