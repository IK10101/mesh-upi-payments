const {PrismaClient} = require('@prisma/client');
const {PrismaPg} = require('@prisma/adapter-pg');
const crypto = require('crypto');
const fs = require('fs');
const {encryptPayload} = require('../crypto/hybridEncryption');
const { isReplayRedis } = require('../crypto/redisReplayProtection');
const { increment } = require('../metrics/counters');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter});
const publicKey = fs.readFileSync('server-public-key.pem', 'utf-8');

async function createPayment(senderId, receiverId, amount) {
  const payment = {
    senderId,
    receiverId,
    amount,
    nonce: crypto.randomBytes(8).toString('hex'),
    timestamp: Date.now()
  };

  const replayCheck = await isReplayRedis(payment);
  if (replayCheck.isReplay) {
    increment('paymentsRejectedReplay');
    return { success: false, reason: replayCheck.reason };
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
    increment('paymentsSettled');
    return { success: true, payment: saved };
  } catch (err) {
    if (err.code === 'P2002') {
      increment('paymentsRejectedReplay');
      return { success: false, reason: 'Duplicate nonce (database constraint)' };
    }
    increment('paymentsFailed');
    throw err;
  }
}

async function getPaymentById(id) {
  return prisma.payment.findUnique({ where: { id } });
}

module.exports = { createPayment, getPaymentById };