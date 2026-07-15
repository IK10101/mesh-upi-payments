const crypto = require('crypto');
const fs = require('fs');

const {publicKey,privateKey} = crypto.generateKeyPairSync('rsa',{
    modulusLength: 2048,
    publicKeyEncoding: {type: 'spki', format: 'pem'},
    privateKeyEncoding: {type: 'pkcs8', format: 'pem'}
})

fs.writeFileSync('serverPublicKey.pem',publicKey);
fs.writeFileSync('serverPrivateKey.pem',privateKey);

console.log('Server key pair generated and saved');


