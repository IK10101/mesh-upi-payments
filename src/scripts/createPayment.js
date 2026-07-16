require('dotenv').config();
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

  const encrypted = encryptPayload(payment, publicKey);

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

console.log('Payment saved to database: ',saved);

console.log('\nEncrypted package (what a bridge node would actually carry):',encrypted);
}

createPayment('user-001','user-002',500)
    .catch((err) => console.error('Error creating payment: ', err))
    .finally(() => prisma.$disconnect());
