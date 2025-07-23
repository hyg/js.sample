'use strict';

const natUpnp = require('nat-upnp');
const natPmp = require('nat-pmp');
const EventEmitter = require('events');
const debug = require('debug')('p2p-node:nat');
const ip = require('ip');
const http = require('http');
const https = require('https');
const defaultGateway = require('default-gateway');

/**
 * NAT穿透模块
 * 使用UPnP和NAT-PMP协议创建端口映射
 */
class NATTraversal extends EventEmitter {
  /**
   * 创建NAT穿透实例
   * @param {Object} options - 配置选项
   * @param {boolean} [options.enableUPnP=true] - 是否启用UPnP
   * @param {boolean} [options.enableNATPMP=true] - 是否启用NAT-PMP
   * @param {number} [options.ttl=7200] - 端口映射生存时间(秒)
   */
  constructor(options) {
    super();
    this.options = options || {};
    
    // 默认启用UPnP和NAT-PMP
    this.enableUPnP = this.options.enableUPnP !== false;
    this.enableNATPMP = this.options.enableNATPMP !== false;
    
    // 端口映射生存时间(秒)
    this.ttl = this.options.ttl || 7200;
    
    // UPnP客户端
    this.upnpClient = null;
    
    // NAT-PMP客户端
    this.pmpClient = null;
    
    // 网关IP
    this.gatewayIp = null;
    
    // 公网IP
    this.publicIp = null;
    
    // 存储创建的端口映射
    this.mappings = [];
    
    // 是否已初始化
    this.initialized = false;
  }

  /**
   * 初始化NAT穿透
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      debug('NAT traversal already initialized');
      return;
    }

    debug('Initializing NAT traversal');
    
    try {
      // 获取网关IP
      this.gatewayIp = await this._getGatewayIp();
      debug(`Gateway IP: ${this.gatewayIp}`);
      
      // 初始化UPnP客户端
      if (this.enableUPnP) {
        this._initUPnP();
      }
      
      // 初始化NAT-PMP客户端
      if (this.enableNATPMP && this.gatewayIp) {
        this._initNATPMP();
      }
      
      this.initialized = true;
      debug('NAT traversal initialized');
      
    } catch (err) {
      debug('Failed to initialize NAT traversal:', err);
      throw err;
    }
  }

  /**
   * 关闭NAT穿透
   * @returns {Promise<void>}
   */
  async close() {
    if (!this.initialized) {
      debug('NAT traversal not initialized');
      return;
    }

    debug('Closing NAT traversal');
    
    // 删除所有端口映射
    await this._removeAllMappings();
    
    // 关闭UPnP客户端
    if (this.upnpClient) {
      this.upnpClient.close();
      this.upnpClient = null;
    }
    
    // 关闭NAT-PMP客户端
    if (this.pmpClient) {
      this.pmpClient = null;
    }
    
    this.initialized = false;
    debug('NAT traversal closed');
  }

  /**
   * 获取网关IP
   * @private
   * @returns {Promise<string>} - 网关IP
   */
  async _getGatewayIp() {
    return new Promise((resolve) => {
      // 尝试使用default-gateway获取默认网关
      defaultGateway.v4()
        .then(result => {
          if (result && result.gateway) {
            debug(`Found gateway via default-gateway: ${result.gateway}`);
            resolve(result.gateway);
          } else {
            throw new Error('No gateway found via default-gateway');
          }
        })
        .catch(err => {
          debug('Failed to get gateway via default-gateway:', err);
          
          // 如果无法获取默认网关，尝试使用UPnP获取
          const client = natUpnp.createClient();
          
          client.findGateway((err, gateway) => {
            client.close();
            
            if (err || !gateway) {
              debug('Failed to find gateway:', err);
              resolve(null);
              return;
            }
            
            resolve(gateway);
          });
        });
    });
  }

  /**
   * 初始化UPnP客户端
   * @private
   */
  _initUPnP() {
    debug('Initializing UPnP client');
    this.upnpClient = natUpnp.createClient();
  }

  /**
   * 初始化NAT-PMP客户端
   * @private
   */
  _initNATPMP() {
    debug(`Initializing NAT-PMP client with gateway ${this.gatewayIp}`);
    try {
      this.pmpClient = natPmp.connect(this.gatewayIp);
      
      // 添加错误处理
      this.pmpClient.on('error', (err) => {
        debug(`NAT-PMP client error: ${err.message}`);
        if (err.code === 'EADDRINUSE') {
          debug('Port 5350 is already in use, disabling NAT-PMP');
          this.pmpClient = null;
          this.enableNATPMP = false;
        }
      });
    } catch (err) {
      debug(`Failed to initialize NAT-PMP client: ${err.message}`);
      this.pmpClient = null;
      this.enableNATPMP = false;
    }
  }

  /**
   * 获取公网IP
   * @returns {Promise<string>} - 公网IP
   */
  async getPublicIp() {
    // 如果已经获取过公网IP，直接返回
    if (this.publicIp) {
      return this.publicIp;
    }
    
    debug('Getting public IP');
    
    // 尝试使用UPnP获取公网IP
    if (this.upnpClient) {
      try {
        const ip = await this._getPublicIpUPnP();
        if (ip) {
          this.publicIp = ip;
          return ip;
        }
      } catch (err) {
        debug('Failed to get public IP via UPnP:', err);
      }
    }
    
    // 尝试使用NAT-PMP获取公网IP
    if (this.pmpClient) {
      try {
        const ip = await this._getPublicIpNATPMP();
        if (ip) {
          this.publicIp = ip;
          return ip;
        }
      } catch (err) {
        debug('Failed to get public IP via NAT-PMP:', err);
      }
    }
    
    // 尝试使用外部服务获取公网IP
    try {
      const ip = await this._getPublicIpExternal();
      if (ip) {
        this.publicIp = ip;
        return ip;
      }
    } catch (err) {
      debug('Failed to get public IP via external service:', err);
    }
    
    // 如果所有方法都失败，返回本地IP
    debug('Using local IP as fallback');
    this.publicIp = this._getLocalIp();
    return this.publicIp;
  }

  /**
   * 使用UPnP获取公网IP
   * @private
   * @returns {Promise<string>} - 公网IP
   */
  _getPublicIpUPnP() {
    return new Promise((resolve, reject) => {
      if (!this.upnpClient) {
        reject(new Error('UPnP client not initialized'));
        return;
      }
      
      this.upnpClient.externalIp((err, ip) => {
        if (err || !ip) {
          reject(err || new Error('Failed to get external IP via UPnP'));
          return;
        }
        
        debug(`Got public IP via UPnP: ${ip}`);
        resolve(ip);
      });
    });
  }

  /**
   * 使用NAT-PMP获取公网IP
   * @private
   * @returns {Promise<string>} - 公网IP
   */
  _getPublicIpNATPMP() {
    return new Promise((resolve, reject) => {
      if (!this.pmpClient) {
        reject(new Error('NAT-PMP client not initialized'));
        return;
      }
      
      this.pmpClient.externalIp((err, info) => {
        if (err || !info || !info.ip) {
          reject(err || new Error('Failed to get external IP via NAT-PMP'));
          return;
        }
        
        const ip = info.ip.join('.');
        debug(`Got public IP via NAT-PMP: ${ip}`);
        resolve(ip);
      });
    });
  }

  /**
   * 使用外部服务获取公网IP
   * @private
   * @returns {Promise<string>} - 公网IP
   */
  _getPublicIpExternal() {
    return new Promise((resolve, reject) => {
      // 尝试多个外部服务
      const services = [
        { host: 'api.ipify.org', path: '/', protocol: 'http:' },
        { host: 'icanhazip.com', path: '/', protocol: 'http:' },
        { host: 'ifconfig.me', path: '/ip', protocol: 'http:' }
      ];
      
      // 随机选择一个服务
      const service = services[Math.floor(Math.random() * services.length)];
      
      const options = {
        host: service.host,
        path: service.path,
        timeout: 5000
      };
      
      const protocol = service.protocol === 'https:' ? https : http;
      
      const req = protocol.get(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP Error: ${res.statusCode}`));
          return;
        }
        
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const ip = data.trim();
          
          // 验证IP格式
          if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
            debug(`Got public IP via ${service.host}: ${ip}`);
            resolve(ip);
          } else {
            reject(new Error(`Invalid IP format: ${ip}`));
          }
        });
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.on('timeout', () => {
        req.abort();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * 获取本地IP
   * @private
   * @returns {string} - 本地IP
   */
  _getLocalIp() {
    return ip.address();
  }

  /**
   * 创建端口映射
   * @param {string} protocol - 协议 ('tcp' 或 'udp')
   * @param {number} port - 内部端口
   * @param {number} [externalPort] - 外部端口，如果不指定则使用相同的端口
   * @param {string} [description='P2P Node'] - 映射描述
   * @returns {Promise<Object>} - 映射信息 { protocol, internalPort, externalPort }
   */
  async createMapping(protocol, port, externalPort, description) {
    if (!this.initialized) {
      throw new Error('NAT traversal not initialized');
    }
    
    if (!protocol || !port) {
      throw new Error('Protocol and port are required');
    }
    
    // 如果不指定外部端口，使用相同的端口
    externalPort = externalPort || port;
    description = description || 'P2P Node';
    
    debug(`Creating ${protocol} mapping: ${port} -> ${externalPort}`);
    
    // 尝试使用UPnP创建映射
    if (this.upnpClient) {
      try {
        const mapping = await this._createMappingUPnP(protocol, port, externalPort, description);
        return mapping;
      } catch (err) {
        debug('Failed to create mapping via UPnP:', err);
      }
    }
    
    // 尝试使用NAT-PMP创建映射
    if (this.pmpClient) {
      try {
        const mapping = await this._createMappingNATPMP(protocol, port, externalPort);
        return mapping;
      } catch (err) {
        debug('Failed to create mapping via NAT-PMP:', err);
      }
    }
    
    // 如果所有方法都失败，假设端口已经可用
    debug('No NAT traversal method available, assuming port is already accessible');
    
    const mapping = {
      protocol,
      internalPort: port,
      externalPort: port
    };
    
    this.mappings.push(mapping);
    return mapping;
  }

  /**
   * 使用UPnP创建端口映射
   * @private
   * @param {string} protocol - 协议 ('tcp' 或 'udp')
   * @param {number} port - 内部端口
   * @param {number} externalPort - 外部端口
   * @param {string} description - 映射描述
   * @returns {Promise<Object>} - 映射信息
   */
  _createMappingUPnP(protocol, port, externalPort, description) {
    return new Promise((resolve, reject) => {
      if (!this.upnpClient) {
        reject(new Error('UPnP client not initialized'));
        return;
      }
      
      this.upnpClient.portMapping({
        public: externalPort,
        private: port,
        protocol: protocol,
        ttl: this.ttl,
        description: description
      }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        debug(`Created ${protocol} mapping via UPnP: ${port} -> ${externalPort}`);
        
        const mapping = {
          protocol,
          internalPort: port,
          externalPort,
          method: 'upnp'
        };
        
        this.mappings.push(mapping);
        resolve(mapping);
      });
    });
  }

  /**
   * 使用NAT-PMP创建端口映射
   * @private
   * @param {string} protocol - 协议 ('tcp' 或 'udp')
   * @param {number} port - 内部端口
   * @param {number} externalPort - 外部端口
   * @returns {Promise<Object>} - 映射信息
   */
  _createMappingNATPMP(protocol, port, externalPort) {
    return new Promise((resolve, reject) => {
      if (!this.pmpClient) {
        reject(new Error('NAT-PMP client not initialized'));
        return;
      }
      
      const fn = protocol === 'tcp' ? 'portMapping' : 'portMappingUDP';
      
      this.pmpClient[fn]({
        privatePort: port,
        publicPort: externalPort,
        ttl: this.ttl
      }, (err, info) => {
        if (err) {
          reject(err);
          return;
        }
        
        debug(`Created ${protocol} mapping via NAT-PMP: ${port} -> ${info.mappedPublicPort}`);
        
        const mapping = {
          protocol,
          internalPort: port,
          externalPort: info.mappedPublicPort,
          method: 'pmp'
        };
        
        this.mappings.push(mapping);
        resolve(mapping);
      });
    });
  }

  /**
   * 删除端口映射
   * @param {string} protocol - 协议 ('tcp' 或 'udp')
   * @param {number} port - 内部端口
   * @param {number} [externalPort] - 外部端口，如果不指定则使用相同的端口
   * @returns {Promise<boolean>} - 是否成功删除
   */
  async removeMapping(protocol, port, externalPort) {
    if (!this.initialized) {
      throw new Error('NAT traversal not initialized');
    }
    
    if (!protocol || !port) {
      throw new Error('Protocol and port are required');
    }
    
    // 如果不指定外部端口，使用相同的端口
    externalPort = externalPort || port;
    
    debug(`Removing ${protocol} mapping: ${port} -> ${externalPort}`);
    
    // 查找映射
    const index = this.mappings.findIndex(m => 
      m.protocol === protocol && 
      m.internalPort === port && 
      m.externalPort === externalPort
    );
    
    if (index === -1) {
      debug(`Mapping not found: ${protocol} ${port} -> ${externalPort}`);
      return false;
    }
    
    const mapping = this.mappings[index];
    
    // 根据映射方法删除
    let success = false;
    
    if (mapping.method === 'upnp') {
      success = await this._removeMappingUPnP(protocol, externalPort);
    } else if (mapping.method === 'pmp') {
      success = await this._removeMappingNATPMP(protocol, externalPort);
    } else {
      // 如果没有指定方法，尝试所有方法
      if (this.upnpClient) {
        success = await this._removeMappingUPnP(protocol, externalPort);
      }
      
      if (!success && this.pmpClient) {
        success = await this._removeMappingNATPMP(protocol, externalPort);
      }
    }
    
    if (success) {
      // 从映射列表中移除
      this.mappings.splice(index, 1);
    }
    
    return success;
  }

  /**
   * 使用UPnP删除端口映射
   * @private
   * @param {string} protocol - 协议 ('tcp' 或 'udp')
   * @param {number} externalPort - 外部端口
   * @returns {Promise<boolean>} - 是否成功删除
   */
  _removeMappingUPnP(protocol, externalPort) {
    return new Promise((resolve) => {
      if (!this.upnpClient) {
        resolve(false);
        return;
      }
      
      this.upnpClient.portUnmapping({
        public: externalPort,
        protocol: protocol
      }, (err) => {
        if (err) {
          debug(`Failed to remove ${protocol} mapping via UPnP: ${externalPort}`, err);
          resolve(false);
          return;
        }
        
        debug(`Removed ${protocol} mapping via UPnP: ${externalPort}`);
        resolve(true);
      });
    });
  }

  /**
   * 使用NAT-PMP删除端口映射
   * @private
   * @param {string} protocol - 协议 ('tcp' 或 'udp')
   * @param {number} externalPort - 外部端口
   * @returns {Promise<boolean>} - 是否成功删除
   */
  _removeMappingNATPMP(protocol, externalPort) {
    return new Promise((resolve) => {
      if (!this.pmpClient) {
        resolve(false);
        return;
      }
      
      const fn = protocol === 'tcp' ? 'portMapping' : 'portMappingUDP';
      
      this.pmpClient[fn]({
        privatePort: 0,  // 0表示删除映射
        publicPort: externalPort,
        ttl: 0  // 0表示删除映射
      }, (err) => {
        if (err) {
          debug(`Failed to remove ${protocol} mapping via NAT-PMP: ${externalPort}`, err);
          resolve(false);
          return;
        }
        
        debug(`Removed ${protocol} mapping via NAT-PMP: ${externalPort}`);
        resolve(true);
      });
    });
  }

  /**
   * 删除所有端口映射
   * @private
   * @returns {Promise<void>}
   */
  async _removeAllMappings() {
    debug('Removing all port mappings');
    
    const promises = [];
    
    for (const mapping of this.mappings) {
      promises.push(
        this.removeMapping(mapping.protocol, mapping.internalPort, mapping.externalPort)
      );
    }
    
    await Promise.all(promises);
    
    this.mappings = [];
  }

  /**
   * 刷新所有端口映射
   * 延长端口映射的生存时间
   * @returns {Promise<void>}
   */
  async refreshMappings() {
    if (!this.initialized) {
      throw new Error('NAT traversal not initialized');
    }
    
    debug('Refreshing port mappings');
    
    const promises = [];
    
    for (const mapping of this.mappings) {
      promises.push(
        this.createMapping(
          mapping.protocol,
          mapping.internalPort,
          mapping.externalPort
        ).catch(err => {
          debug(`Failed to refresh mapping: ${mapping.protocol} ${mapping.internalPort} -> ${mapping.externalPort}`, err);
        })
      );
    }
    
    await Promise.all(promises);
  }

  /**
   * 检测NAT类型
   * @returns {Promise<string>} - NAT类型
   */
  async detectNATType() {
    if (!this.initialized) {
      throw new Error('NAT traversal not initialized');
    }
    
    debug('Detecting NAT type');
    
    // 检查是否可以创建端口映射
    let canMap = false;
    
    if (this.upnpClient || this.pmpClient) {
      try {
        // 尝试创建一个临时映射
        const testPort = 19999;
        const mapping = await this.createMapping('tcp', testPort);
        
        if (mapping) {
          canMap = true;
          
          // 删除临时映射
          await this.removeMapping('tcp', testPort, mapping.externalPort);
        }
      } catch (err) {
        debug('Failed to create test mapping:', err);
      }
    }
    
    // 获取公网IP
    let publicIp;
    try {
      publicIp = await this.getPublicIp();
    } catch (err) {
      debug('Failed to get public IP:', err);
    }
    
    // 获取本地IP
    const localIp = this._getLocalIp();
    
    // 判断NAT类型
    if (!publicIp || publicIp === localIp) {
      return 'No NAT';
    } else if (canMap) {
      return 'Full Cone NAT';
    } else {
      return 'Symmetric NAT';
    }
  }
}

module.exports = NATTraversal;