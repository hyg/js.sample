const crypto = require('crypto');

class StunClient {
  constructor(socket, stunServer = 'stun.miwifi.com', stunPort = 3478) {
    this.socket = socket;
    this.stunServer = stunServer;  // STUN服务器地址
    this.stunPort = stunPort;      // STUN服务器端口
  }

  getPublicAddress() {
    return new Promise((resolve, reject) => {
      // 生成随机事务ID
      const transactionId = crypto.randomBytes(12);
      const message = Buffer.concat([
        Buffer.from([0x00, 0x01, 0x00, 0x00]), // STUN Binding Request
        Buffer.from([0x21, 0x12, 0xA4, 0x42]), // Magic Cookie
        transactionId
      ]);

      // 监听STUN响应
      const stunHandler = (msg, rinfo) => {
        // 检查是否是STUN响应
        if (msg.length < 20) return;
        
        const type = msg.readUInt16BE(0);
        const magicCookie = msg.readUInt32BE(4);
        const responseTransactionId = msg.slice(8, 20);
        
        if (type === 0x0101 && magicCookie === 0x2112A442 && responseTransactionId.equals(transactionId)) {
          // 解析XOR-MAPPED-ADDRESS属性
          let offset = 20;
          while (offset < msg.length) {
            const attrType = msg.readUInt16BE(offset);
            const attrLen = msg.readUInt16BE(offset + 2);
            offset += 4;
            
            if (attrType === 0x0020) { // XOR-MAPPED-ADDRESS
              const port = msg.readUInt16BE(offset + 2) ^ 0x2112;
              const ip = [
                msg.readUInt8(offset + 4) ^ 0x21,
                msg.readUInt8(offset + 5) ^ 0x12,
                msg.readUInt8(offset + 6) ^ 0xA4,
                msg.readUInt8(offset + 7) ^ 0x42
              ].join('.');
              
              // 移除监听器
              this.socket.removeListener('message', stunHandler);
              resolve({ ip, port });
              return;
            }
            offset += attrLen;
            // 填充字节
            if (attrLen % 4 !== 0) {
              offset += 4 - (attrLen % 4);
            }
          }
        }
      };

      this.socket.on('message', stunHandler);
      
      // 设置超时
      setTimeout(() => {
        this.socket.removeListener('message', stunHandler);
        reject(new Error('STUN request timeout'));
      }, 5000);

      // 发送STUN请求
      this.socket.send(message, this.stunPort, this.stunServer, (err) => {
        if (err) {
          this.socket.removeListener('message', stunHandler);
          reject(err);
        }
      });
    });
  }
}

module.exports = StunClient;