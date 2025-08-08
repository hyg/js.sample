const crypto = require('crypto')
// 从“房间名/密钥字符串”派生 32 字节 topic（符合 Hyperswarm 要求）
exports.topicFromString = (s) =>
    crypto.createHash('sha256').update(s).digest()