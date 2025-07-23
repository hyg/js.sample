const crypto = require('crypto');

class CryptoManager {
  constructor(options = {}) {
    this.algorithm = 'aes-256-cbc';
    this.keyLength = 32;
    this.ivLength = 16;
    this.sharedSecret = options.sharedSecret || 'default-shared-secret-key';
    
    // 生成节点密钥对
    this.keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    this.trustedKeys = new Map();
    this.sessionKeys = new Map();
  }

  // 生成节点ID（公钥指纹）
  getNodeId() {
    return crypto.createHash('sha256').update(this.keyPair.publicKey).digest('hex');
  }

  // 获取公钥
  getPublicKey() {
    return this.keyPair.publicKey;
  }

  // 添加可信节点
  addTrustedNode(nodeId, publicKey) {
    this.trustedKeys.set(nodeId, publicKey);
  }

  // 验证节点身份
  verifyNode(nodeId, signature, data) {
    const publicKey = this.trustedKeys.get(nodeId);
    if (!publicKey) return false;

    try {
      return crypto.verify('sha256', Buffer.from(data), publicKey, Buffer.from(signature, 'base64'));
    } catch (error) {
      return false;
    }
  }

  // 签名数据
  signData(data) {
    return crypto.sign('sha256', Buffer.from(data), this.keyPair.privateKey).toString('base64');
  }

  // 加密消息
  encryptMessage(message, recipientPublicKey) {
    try {
      const symmetricKey = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      // 使用对称加密加密消息
      const cipher = crypto.createCipher(this.algorithm, symmetricKey);
      let encrypted = cipher.update(message, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // 使用RSA加密对称密钥
      const encryptedKey = crypto.publicEncrypt(
        { key: recipientPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
        symmetricKey
      );
      
      return {
        encrypted: encrypted,
        key: encryptedKey.toString('base64'),
        iv: iv.toString('base64')
      };
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  // 解密消息
  decryptMessage(encryptedData) {
    try {
      const encryptedKey = Buffer.from(encryptedData.key, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      
      // 使用RSA解密对称密钥
      const symmetricKey = crypto.privateDecrypt(
        { key: this.keyPair.privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
        encryptedKey
      );
      
      // 使用对称密钥解密消息
      const decipher = crypto.createDecipher(this.algorithm, symmetricKey);
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  // 生成会话密钥
  generateSessionKey(nodeId) {
    const sessionKey = crypto.randomBytes(32);
    this.sessionKeys.set(nodeId, sessionKey);
    return sessionKey.toString('base64');
  }

  // 使用会话密钥加密
  encryptWithSession(message, nodeId) {
    const sessionKey = this.sessionKeys.get(nodeId);
    if (!sessionKey) return null;

    const cipher = crypto.createCipher('aes-256-cbc', sessionKey);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  // 使用会话密钥解密
  decryptWithSession(encryptedMessage, nodeId) {
    const sessionKey = this.sessionKeys.get(nodeId);
    if (!sessionKey) return null;

    try {
      const decipher = crypto.createDecipher('aes-256-cbc', sessionKey);
      let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      return null;
    }
  }

  // 哈希消息用于签名
  hashMessage(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  // 验证消息完整性
  verifyIntegrity(message, hash) {
    const calculatedHash = this.hashMessage(message);
    return calculatedHash === hash;
  }

  // 生成挑战码用于身份验证
  generateChallenge() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 验证挑战响应
  verifyChallenge(challenge, response, nodeId) {
    const publicKey = this.trustedKeys.get(nodeId);
    if (!publicKey) return false;

    try {
      const expected = crypto.sign('sha256', Buffer.from(challenge), publicKey);
      return crypto.timingSafeEqual(Buffer.from(response, 'base64'), expected);
    } catch (error) {
      return false;
    }
  }

  // 创建认证消息
  createAuthMessage() {
    const challenge = this.generateChallenge();
    const signature = this.signData(challenge);
    
    return {
      type: 'auth',
      nodeId: this.getNodeId(),
      publicKey: this.getPublicKey(),
      challenge: challenge,
      signature: signature,
      timestamp: Date.now()
    };
  }

  // 验证认证消息
  verifyAuthMessage(authMessage) {
    if (authMessage.type !== 'auth') return false;
    
    try {
      // 验证签名
      const isValid = this.verifyNode(authMessage.nodeId, authMessage.signature, authMessage.challenge);
      
      if (isValid) {
        // 添加为可信节点
        this.addTrustedNode(authMessage.nodeId, authMessage.publicKey);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}

module.exports = CryptoManager;