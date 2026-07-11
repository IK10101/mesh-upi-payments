const crypto = require('crypto');

const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

console.log('---Key(hex)---');
console.log(key.toString('hex'));
console.log('---IV(hex)---');
console.log(iv.toString('hex'));

const payload = JSON.stringify({
    senderId: 'user-001',
    receiverId: 'user-002',
    amount: 500
});

const cipher = crypto.createCipheriv('aes-256-gcm', key,iv);
let encrypted = cipher.update(payload,'utf-8','base64');
encrypted += cipher.final('base64');
const authTag = cipher.getAuthTag();

console.log('\n---Encryted(base64)---');
console.log(encrypted);
console.log('---AuthTag(hex)---');
console.log(authTag.toString('hex'));

const decipher  = crypto.createDecipheriv('aes-256-gcm',key,iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted,'base64','utf-8');
decrypted += decipher.final('utf-8');

console.log('\n---Decrypted---');
console.log(decrypted);
console.log(JSON.parse(decrypted));


