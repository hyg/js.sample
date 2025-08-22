const dgram = require('dgram');
const crypto = require('crypto');
const config = require('../config/config');

class NATTraversal {
  constructor() {
    this.publicAddress = null;
    this.localAddress = null;
  }

  /**
   * 获取公网地址和端口
   * @param {number} localPort 本地端口
   * @returns {Promise<{address: string, port: number}>}
   */
  async getPublicAddress(localPort) {
    const stunServers = config.stunServers;
    
    for (const stunServer of stunServers) {
      try {
        const result = await this.querySTUNServer(stunServer.urls, localPort);
        if (result) {
          this.publicAddress = result;
          console.log(`通过 STUN 服务器 ${stunServer.urls} 获取到公网地址: ${result.address}:${result.port}`);
          return result;
        }
      } catch (error) {
        console.warn(`STUN 服务器 ${stunServer.urls} 查询失败:`, error.message);
        continue;
      }
    }
    
    // 如果所有 STUN 服务器都失败，使用本地地址作为备用方案
    console.warn('所有 STUN 服务器都不可用，使用本地地址作为备用方案');
    const localAddr = this.getLocalAddress();
    const fallbackAddress = {
      address: localAddr.address,
      port: localPort
    };
    
    this.publicAddress = fallbackAddress;
    console.log(`使用本地地址: ${fallbackAddress.address}:${fallbackAddress.port}`);
    return fallbackAddress;
  }

  /**
   * 查询 STUN 服务器
   * @param {string} stunUrl STUN 服务器 URL
   * @param {number} localPort 本地端口
   * @returns {Promise<{address: string, port: number}>}
   */
  async querySTUNServer(stunUrl, localPort) {
    return new Promise((resolve, reject) => {
      const url = new URL(stunUrl);
      const stunHost = url.hostname;
      const stunPort = parseInt(url.port) || 3478;
      
      const socket = dgram.createSocket('udp4');
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error('STUN 查询超时'));
      }, 5000);

      socket.bind(localPort);

      socket.on('message', (msg, rinfo) => {
        try {
          const response = this.parseSTUNResponse(msg);
          if (response && response.mappedAddress) {
            clearTimeout(timeout);
            socket.close();
            resolve(response.mappedAddress);
          }
        } catch (error) {
          console.warn('解析 STUN 响应失败:', error.message);
        }
      });

      socket.on('error', (error) => {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      });

      // 发送 STUN 绑定请求
      const request = this.createSTUNBindingRequest();
      socket.send(request, stunPort, stunHost);
    });
  }

  /**
   * 创建 STUN 绑定请求
   * @returns {Buffer}
   */
  createSTUNBindingRequest() {
    const buffer = Buffer.alloc(20);
    
    // STUN 消息类型：绑定请求 (0x0001)
    buffer.writeUInt16BE(0x0001, 0);
    
    // 消息长度：0（无属性）
    buffer.writeUInt16BE(0x0000, 2);
    
    // Magic Cookie
    buffer.writeUInt32BE(0x2112A442, 4);
    
    // 事务 ID（96 位随机数）
    const transactionId = crypto.randomBytes(12);
    transactionId.copy(buffer, 8);
    
    return buffer;
  }

  /**
   * 解析 STUN 响应
   * @param {Buffer} buffer 响应数据
   * @returns {Object}
   */
  parseSTUNResponse(buffer) {
    if (buffer.length < 20) {
      throw new Error('STUN 响应太短');
    }

    const messageType = buffer.readUInt16BE(0);
    const messageLength = buffer.readUInt16BE(2);
    const magicCookie = buffer.readUInt32BE(4);

    // 验证 Magic Cookie
    if (magicCookie !== 0x2112A442) {
      throw new Error('无效的 STUN Magic Cookie');
    }

    // 检查是否为绑定成功响应
    if (messageType !== 0x0101) {
      throw new Error('不是绑定成功响应');
    }

    // 解析属性
    let offset = 20;
    const attributes = {};

    while (offset < buffer.length) {
      if (offset + 4 > buffer.length) break;
      
      const attrType = buffer.readUInt16BE(offset);
      const attrLength = buffer.readUInt16BE(offset + 2);
      
      if (offset + 4 + attrLength > buffer.length) break;
      
      const attrValue = buffer.slice(offset + 4, offset + 4 + attrLength);
      
      // XOR-MAPPED-ADDRESS (0x0020)
      if (attrType === 0x0020 && attrLength >= 8) {
        const family = attrValue.readUInt16BE(1);
        if (family === 0x01) { // IPv4
          const port = attrValue.readUInt16BE(2) ^ 0x2112;
          const address = [
            attrValue.readUInt8(4) ^ 0x21,
            attrValue.readUInt8(5) ^ 0x12,
            attrValue.readUInt8(6) ^ 0xA4,
            attrValue.readUInt8(7) ^ 0x42
          ].join('.');
          
          attributes.mappedAddress = { address, port };
        }
      }
      
      offset += 4 + attrLength;
      // 属性填充到 4 字节边界
      if (attrLength % 4 !== 0) {
        offset += 4 - (attrLength % 4);
      }
    }

    return attributes;
  }

  /**
   * 获取本地地址
   * @returns {Object}
   */
  getLocalAddress() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          this.localAddress = { address: iface.address, port: 0 };
          return this.localAddress;
        }
      }
    }
    
    return { address: '127.0.0.1', port: 0 };
  }
}

module.exports = NATTraversal;