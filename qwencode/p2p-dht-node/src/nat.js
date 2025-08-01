// NAT穿透模块
const natUpnp = require('nat-upnp');
const config = require('./config');

class NATHandler {
  constructor() {
    this.client = null;
    this.mappings = new Map(); // 存储端口映射
  }

  // 初始化NAT客户端
  async init() {
    if (config.nat.enableUPnP || config.nat.enablePMP) {
      this.client = natUpnp.createClient();
      console.log('NAT客户端初始化成功');
    } else {
      console.log('NAT穿透已禁用');
    }
  }

  // 创建端口映射
  async mapPort(internalPort, externalPort, description = 'P2P Node') {
    if (!this.client) {
      throw new Error('NAT客户端未初始化');
    }

    return new Promise((resolve, reject) => {
      this.client.portMapping({
        public: externalPort,
        private: internalPort,
        ttl: 0, // 永久映射
        description: description
      }, (err) => {
        if (err) {
          console.error(`端口映射失败 ${internalPort} -> ${externalPort}:`, err);
          reject(err);
        } else {
          console.log(`端口映射成功 ${internalPort} -> ${externalPort}`);
          this.mappings.set(internalPort, externalPort);
          resolve(externalPort);
        }
      });
    });
  }

  // 删除端口映射
  async unmapPort(internalPort) {
    if (!this.client) {
      throw new Error('NAT客户端未初始化');
    }

    const externalPort = this.mappings.get(internalPort);
    if (!externalPort) {
      throw new Error(`未找到内部端口 ${internalPort} 的映射`);
    }

    return new Promise((resolve, reject) => {
      this.client.portUnmapping({
        public: externalPort,
        private: internalPort
      }, (err) => {
        if (err) {
          console.error(`删除端口映射失败 ${internalPort} -> ${externalPort}:`, err);
          reject(err);
        } else {
          console.log(`删除端口映射成功 ${internalPort} -> ${externalPort}`);
          this.mappings.delete(internalPort);
          resolve();
        }
      });
    });
  }

  // 获取外部IP地址
  async getExternalIP() {
    if (!this.client) {
      throw new Error('NAT客户端未初始化');
    }

    return new Promise((resolve, reject) => {
      this.client.externalIp((err, ip) => {
        if (err) {
          console.error('获取外部IP地址失败:', err);
          reject(err);
        } else {
          console.log(`外部IP地址: ${ip}`);
          resolve(ip);
        }
      });
    });
  }

  // 关闭NAT客户端
  async close() {
    if (this.client) {
      this.client.close();
      console.log('NAT客户端已关闭');
    }
  }
}

module.exports = NATHandler;