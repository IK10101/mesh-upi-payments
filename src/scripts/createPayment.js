require('dotenv').config();
const { isReplay } = require('../crypto/replayProtection');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
const crypto = require('crypto');
const { encryptPayload } = require('../crypto/hybridEncryption');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const publicKey = fs.readFileSync('server-public-key.pem', 'utf8');

async function createPayment(senderId, receiverId, amount) {
  const payment = {
    senderId,
    receiverId,
    amount,
    nonce: crypto.randomBytes(8).toString('hex'),
    timestamp: Date.now()
  };

  const replayCheck = isReplay(payment);
  if (replayCheck.isReplay) {
    console.log('Payment rejected as replay:', replayCheck.reason);
    return;
  }

  const encrypted = encryptPayload(payment, publicKey);

  try {
  const saved = await prisma.payment.create({
    data: {
      senderId,
      receiverId,
      amount,
      nonce: payment.nonce,
      status: 'pending',
      encryptedData: encrypted.encryptedData,
      encryptedKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      authTag: encrypted.authTag
    }
  });

  console.log('Payment saved to database: ', saved);
  console.log('\nEncrypted package (what a bridge node would actually carry):', encrypted);
  } catch (err) {
  if (err.code === 'P2002') {
    console.log('Payment rejected: nonce already exists in database (backup layer caught it)');
  } else {
    throw err;
  }
}
}

createPayment('user-001','user-002',500)
    .catch((err) => console.error('Error creating payment: ', err))
    .finally(() => prisma.$disconnect());
