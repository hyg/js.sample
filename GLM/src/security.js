const crypto = require('crypto');

class SecurityManager {
    constructor() {
        this.keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        
        this.sessionKeys = new Map();
    }

    getPublicKey() {
        return this.keyPair.publicKey;
    }

    getPrivateKey() {
        return this.keyPair.privateKey;
    }

    generateSessionKey(peerId) {
        const sessionKey = crypto.randomBytes(32);
        this.sessionKeys.set(peerId, sessionKey);
        return sessionKey;
    }

    encrypt(data, publicKey) {
        const bufferData = Buffer.from(data);
        const encrypted = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            bufferData
        );
        return encrypted.toString('base64');
    }

    decrypt(encryptedData) {
        const buffer = Buffer.from(encryptedData, 'base64');
        const decrypted = crypto.privateDecrypt(
            {
                key: this.keyPair.privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            buffer
        );
        return decrypted.toString();
    }

    sign(data) {
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(data);
        return sign.sign(this.keyPair.privateKey, 'base64');
    }

    verify(data, signature, publicKey) {
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(data);
        return verify.verify(publicKey, signature, 'base64');
    }

    createHandshakeMessage() {
        const handshake = {
            type: 'handshake',
            publicKey: this.getPublicKey(),
            timestamp: Date.now(),
            nodeId: this.generateNodeId()
        };
        
        const signature = this.sign(JSON.stringify(handshake));
        handshake.signature = signature;
        
        return handshake;
    }

    generateNodeId() {
        return crypto.createHash('sha256').update(this.getPublicKey()).digest('hex');
    }
}

module.exports = SecurityManager;