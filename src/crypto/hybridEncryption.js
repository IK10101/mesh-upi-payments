const crypto = require('crypto');

function encryptPayload(payload,publicKeyPem){
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    
    const cipher = crypto.createCipheriv('aes-256-gcm',aesKey,iv);
    const plaintext = JSON.stringify(payload);
    let encryptedData = cipher.update(plaintext,'utf8','base64');
    encryptedData += cipher.final('base64');
    const authTag = cipher.getAuthTag()

    const encryptedKey = crypto.publicEncrypt({
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'

    }, aesKey);

    return{
        encryptedData,                          
    encryptedKey: encryptedKey.toString('base64'), 
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
    };
}

function decryptPayload(encryptedPackage, privateKeyPem) {
  const { encryptedData, encryptedKey, iv, authTag } = encryptedPackage;


  const aesKey = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(encryptedKey, 'base64')
  );

  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

module.exports = { encryptPayload, decryptPayload };