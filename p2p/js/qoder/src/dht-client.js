const dgram = require('dgram');
const crypto = require('crypto');
const config = require('../config/config');

/**
 * 简化的 bencode 编码器
 */
class Bencode {
  static encode(data) {
    if (typeof data === 'string') {
      return Buffer.from(`${data.length}:${data}`);
    } else if (typeof data === 'number') {
      return Buffer.from(`i${data}e`);
    } else if (Array.isArray(data)) {
      const items = data.map(item => this.encode(item));
      return Buffer.concat([Buffer.from('l'), ...items, Buffer.from('e')]);
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data).sort();
      const items = [];
      for (const key of keys) {
        items.push(this.encode(key));
        items.push(this.encode(data[key]));
      }
      return Buffer.concat([Buffer.from('d'), ...items, Buffer.from('e')]);
    }
    return Buffer.alloc(0);
  }

  static decode(buffer) {
    // 简化的解码实现
    const str = buffer.toString();
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  }
}

class DHTClient {
  constructor(nodeId) {
    this.nodeId = nodeId || crypto.randomBytes(config.node.nodeIdLength);
    this.socket = null;
    this.isReady = false;
    this.announceInterval = null;
    this.discoveredNodes = new Map();
    this.callbacks = {
      onNodeDiscovered: null,
      onNodeAnnounced: null
    };
    this.transactionId = 0;
    this.bootstrapNodes = config.dhtBootstrapNodes;
    this.connectedNodes = new Set();
  }

  /**
   * 初始化 DHT 客户端
   * @param {number} port 监听端口
   * @returns {Promise<void>}
   */
  async initialize(port) {
    return new Promise((resolve, reject) => {
      try {
        this.socket = dgram.createSocket('udp4');
        
        this.socket.on('error', (error) => {
          console.error('DHT 套接字错误:', error.message);
          if (!this.isReady) {
            reject(error);
          }
        });

        this.socket.on('message', (msg, rinfo) => {
          this.handleMessage(msg, rinfo);
        });

        this.socket.on('listening', () => {
          const address = this.socket.address();
          console.log('DHT 网络连接就绪');
          console.log(`节点 ID: ${this.nodeId.toString('hex')}`);
          console.log(`DHT 监听端口: ${address.port}`);
          this.isReady = true;
          
          // 连接到引导节点
          this.connectToBootstrapNodes();
          resolve();
        });

        this.socket.bind(port);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 连接到引导节点
   */
  connectToBootstrapNodes() {
    console.log('连接到 DHT 引导节点...');
    
    this.bootstrapNodes.forEach((node, index) => {
      setTimeout(() => {
        this.pingNode(node.host, node.port);
      }, index * 1000); // 错开发送时间
    });
  }

  /**
   * Ping 节点
   * @param {string} host 目标主机
   * @param {number} port 目标端口
   */
  pingNode(host, port) {
    const transactionId = Buffer.from(`${this.transactionId++}`);
    const query = {
      t: transactionId,
      y: 'q',
      q: 'ping',
      a: {
        id: this.nodeId
      }
    };

    const encoded = Bencode.encode(query);
    this.socket.send(encoded, port, host, (error) => {
      if (error) {
        console.warn(`Ping ${host}:${port} 失败:`, error.message);
      } else {
        console.log(`已 ping ${host}:${port}`);
      }
    });
  }

  /**
   * 处理接收到的消息
   * @param {Buffer} msg 消息内容
   * @param {Object} rinfo 发送方信息
   */
  handleMessage(msg, rinfo) {
    try {
      const data = Bencode.decode(msg);
      
      if (data.y === 'r') {
        // 响应消息
        this.handleResponse(data, rinfo);
      } else if (data.y === 'q') {
        // 查询消息
        this.handleQuery(data, rinfo);
      }
    } catch (error) {
      console.warn('解析 DHT 消息失败:', error.message);
    }
  }

  /**
   * 处理响应消息
   * @param {Object} data 消息数据
   * @param {Object} rinfo 发送方信息
   */
  handleResponse(data, rinfo) {
    const nodeKey = `${rinfo.address}:${rinfo.port}`;
    
    if (!this.connectedNodes.has(nodeKey)) {
      console.log(`发现 DHT 节点: ${nodeKey}`);
      this.connectedNodes.add(nodeKey);
      
      // 模拟发现其他 P2P 节点
      const nodeInfo = {
        address: rinfo.address,
        port: rinfo.port - 1000, // 假设 P2P 端口比 DHT 端口小 1000
        infoHash: 'simulated',
        discoveredAt: new Date(),
        from: rinfo
      };
      
      // 延迟一段时间后触发节点发现事件
      setTimeout(() => {
        this.handleNodeAnnounce(Buffer.from('test'), nodeInfo, rinfo);
      }, 2000);
    }
  }

  /**
   * 处理查询消息
   * @param {Object} data 消息数据
   * @param {Object} rinfo 发送方信息
   */
  handleQuery(data, rinfo) {
    // 响应 ping 查询
    if (data.q === 'ping') {
      const response = {
        t: data.t,
        y: 'r',
        r: {
          id: this.nodeId
        }
      };
      
      const encoded = Bencode.encode(response);
      this.socket.send(encoded, rinfo.port, rinfo.address);
    }
  }

  /**
   * 在 DHT 网络中公告自己的地址
   * @param {string} publicAddress 公网地址
   * @param {number} publicPort 公网端口
   */
  announceMyself(publicAddress, publicPort) {
    if (!this.isReady) {
      console.warn('DHT 未就绪，无法公告');
      return;
    }

    console.log(`在 DHT 网络中公告地址: ${publicAddress}:${publicPort}`);
    
    // 向已连接的节点公告自己
    this.connectedNodes.forEach(nodeKey => {
      const [host, port] = nodeKey.split(':');
      this.announceToNode(host, parseInt(port), publicAddress, publicPort);
    });
    
    if (this.callbacks.onNodeAnnounced) {
      this.callbacks.onNodeAnnounced({ address: publicAddress, port: publicPort });
    }

    // 设置定期公告
    if (this.announceInterval) {
      clearInterval(this.announceInterval);
    }

    this.announceInterval = setInterval(() => {
      this.connectedNodes.forEach(nodeKey => {
        const [host, port] = nodeKey.split(':');
        this.announceToNode(host, parseInt(port), publicAddress, publicPort);
      });
      console.log('定期地址公告完成');
    }, config.node.announceInterval);
  }

  /**
   * 向指定节点公告
   * @param {string} host 目标主机
   * @param {number} port 目标端口
   * @param {string} publicAddress 公告的地址
   * @param {number} publicPort 公告的端口
   */
  announceToNode(host, port, publicAddress, publicPort) {
    const transactionId = Buffer.from(`${this.transactionId++}`);
    const query = {
      t: transactionId,
      y: 'q',
      q: 'announce_peer',
      a: {
        id: this.nodeId,
        info_hash: this.generateInfoHash(),
        port: publicPort,
        token: 'test'
      }
    };

    const encoded = Bencode.encode(query);
    this.socket.send(encoded, port, host);
  }

  /**
   * 查找其他节点
   * @param {Buffer} targetInfoHash 目标信息哈希（可选）
   */
  findNodes(targetInfoHash) {
    if (!this.isReady) {
      console.warn('DHT 未就绪，无法查找节点');
      return;
    }

    console.log('开始查找网络中的其他节点...');
    
    // 向引导节点查询更多节点
    this.bootstrapNodes.forEach((node, index) => {
      setTimeout(() => {
        this.findNodesFromPeer(node.host, node.port);
      }, index * 500);
    });
  }

  /**
   * 从指定节点查找更多节点
   * @param {string} host 目标主机
   * @param {number} port 目标端口
   */
  findNodesFromPeer(host, port) {
    const transactionId = Buffer.from(`${this.transactionId++}`);
    const query = {
      t: transactionId,
      y: 'q',
      q: 'find_node',
      a: {
        id: this.nodeId,
        target: crypto.randomBytes(20)
      }
    };

    const encoded = Bencode.encode(query);
    this.socket.send(encoded, port, host);
  }

  /**
   * 处理节点公告
   * @param {Buffer} infoHash 信息哈希
   * @param {Object} peer 节点信息
   * @param {Object} from 来源地址
   */
  handleNodeAnnounce(infoHash, peer, from) {
    const nodeKey = `${peer.address}:${peer.port}`;
    
    if (!this.discoveredNodes.has(nodeKey)) {
      console.log(`发现新节点: ${peer.address}:${peer.port}`);
      
      const nodeInfo = {
        address: peer.address,
        port: peer.port,
        infoHash: infoHash.toString('hex'),
        discoveredAt: new Date(),
        from: from
      };
      
      this.discoveredNodes.set(nodeKey, nodeInfo);
      
      if (this.callbacks.onNodeDiscovered) {
        this.callbacks.onNodeDiscovered(nodeInfo);
      }
    }
  }

  /**
   * 生成信息哈希
   * @returns {Buffer}
   */
  generateInfoHash() {
    const data = 'p2p-node-network';
    return crypto.createHash('sha1').update(data).digest();
  }

  /**
   * 获取已发现的节点列表
   * @returns {Array}
   */
  getDiscoveredNodes() {
    return Array.from(this.discoveredNodes.values());
  }

  /**
   * 设置回调函数
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    if (event === 'nodeDiscovered') {
      this.callbacks.onNodeDiscovered = callback;
    } else if (event === 'nodeAnnounced') {
      this.callbacks.onNodeAnnounced = callback;
    }
  }

  /**
   * 获取 DHT 网络统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      nodes: this.connectedNodes.size,
      peers: this.discoveredNodes.size,
      isReady: this.isReady,
      nodeId: this.nodeId.toString('hex'),
      address: this.socket ? this.socket.address() : null
    };
  }

  /**
   * 获取当前可用的引导节点
   * @returns {Array}
   */
  getBootstrapNodes() {
    return Array.from(this.connectedNodes).map(nodeKey => {
      const [host, port] = nodeKey.split(':');
      return { host, port: parseInt(port) };
    });
  }

  /**
   * 销毁 DHT 客户端
   */
  destroy() {
    if (this.announceInterval) {
      clearInterval(this.announceInterval);
      this.announceInterval = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isReady = false;
    this.discoveredNodes.clear();
    this.connectedNodes.clear();
  }
}

module.exports = DHTClient;