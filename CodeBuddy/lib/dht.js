'use strict';

const DHT = require('bittorrent-dht');
const EventEmitter = require('events');
const debug = require('debug')('p2p-node:dht');
const crypto = require('crypto');
const ip = require('ip');

/**
 * DHT节点发现模块
 * 使用分布式哈希表(DHT)发现网络中的其他节点
 */
class DHTDiscovery extends EventEmitter {
  /**
   * 创建DHT发现实例
   * @param {Object} options - 配置选项
   * @param {string} [options.magnetURI] - 用于节点发现的magnet链接
   * @param {Array<string>} [options.bootstrap] - DHT引导节点
   * @param {number} [options.portStart=20000] - DHT端口范围起始
   * @param {number} [options.portEnd=20100] - DHT端口范围结束
   * @param {number} [options.discoveryInterval=60000] - 节点发现间隔(毫秒)
   */
  constructor(options) {
    super();
    this.options = options || {};
    
    // 解析magnet链接获取infoHash
    this.infoHash = this._parseInfoHash(this.options.magnetURI);
    debug(`Using infoHash: ${this.infoHash}`);
    
    // DHT实例
    this.dht = null;
    
    // 存储已发现的节点
    this.nodes = new Map(); // nodeId -> { address, port, lastSeen }
    
    // 节点发现定时器
    this.discoveryTimer = null;
    
    // 运行状态
    this.isRunning = false;
  }

  /**
   * 从magnet链接解析infoHash
   * @private
   * @param {string} magnetURI - magnet链接
   * @returns {string} - infoHash
   */
  _parseInfoHash(magnetURI) {
    if (!magnetURI) {
      // 如果没有提供magnet链接，生成一个随机的infoHash
      return crypto.randomBytes(20).toString('hex');
    }
    
    try {
      // 从magnet链接中提取xt参数
      const match = magnetURI.match(/xt=urn:btih:([a-fA-F0-9]+)/);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    } catch (err) {
      debug('Failed to parse magnet URI:', err);
    }
    
    // 如果解析失败，生成一个随机的infoHash
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * 启动DHT发现
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      debug('DHT discovery already running');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        debug('Starting DHT discovery');
        
        // 选择一个随机端口
        const port = this._getRandomPort();
        
        // 创建DHT实例
        this.dht = new DHT({
          bootstrap: this.options.bootstrap,
          verify: (infoHash) => {
            // 只处理我们感兴趣的infoHash
            return infoHash.toString('hex') === this.infoHash;
          }
        });
        
        // 监听错误
        this.dht.on('error', (err) => {
          debug('DHT error:', err);
          this.emit('error', err);
        });
        
        // 监听节点发现
        this.dht.on('peer', (peer, infoHash, from) => {
          this._handlePeerDiscovered(peer, infoHash, from);
        });
        
        // 监听DHT就绪
        this.dht.on('ready', () => {
          debug('DHT ready');
          
          // 设置节点发现定时器
          this._setupDiscoveryTimer();
          
          this.isRunning = true;
          resolve();
        });
        
        // 启动DHT
        this.dht.listen(port, () => {
          debug(`DHT listening on port ${port}`);
        });
        
      } catch (err) {
        debug('Failed to start DHT discovery:', err);
        reject(err);
      }
    });
  }

  /**
   * 停止DHT发现
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning || !this.dht) {
      debug('DHT discovery not running');
      return;
    }

    return new Promise((resolve) => {
      debug('Stopping DHT discovery');
      
      // 清除节点发现定时器
      if (this.discoveryTimer) {
        clearInterval(this.discoveryTimer);
        this.discoveryTimer = null;
      }
      
      // 销毁DHT实例
      this.dht.destroy(() => {
        debug('DHT destroyed');
        this.dht = null;
        this.isRunning = false;
        resolve();
      });
    });
  }

  /**
   * 获取随机端口
   * @private
   * @returns {number} - 随机端口
   */
  _getRandomPort() {
    const portStart = this.options.portStart || 20000;
    const portEnd = this.options.portEnd || 20100;
    return Math.floor(Math.random() * (portEnd - portStart + 1)) + portStart;
  }

  /**
   * 设置节点发现定时器
   * @private
   */
  _setupDiscoveryTimer() {
    const interval = this.options.discoveryInterval || 60000;
    
    // 立即执行一次节点发现
    this._findPeers();
    
    // 设置定时器定期执行节点发现
    this.discoveryTimer = setInterval(() => {
      this._findPeers();
    }, interval);
  }

  /**
   * 查找节点
   * @private
   */
  _findPeers() {
    if (!this.isRunning || !this.dht) return;
    
    debug('Finding peers for infoHash:', this.infoHash);
    
    // 在DHT网络中查找节点
    this.dht.lookup(this.infoHash);
  }

  /**
   * 处理发现的节点
   * @private
   * @param {Object} peer - 节点信息
   * @param {Buffer} infoHash - infoHash
   * @param {Object} from - 来源节点
   */
  _handlePeerDiscovered(peer, infoHash, from) {
    const infoHashHex = infoHash.toString('hex');
    
    // 检查infoHash是否匹配
    if (infoHashHex !== this.infoHash) {
      return;
    }
    
    // 检查节点信息是否有效
    if (!peer || !peer.host || !peer.port) {
      return;
    }
    
    // 检查是否是私有IP
    if (ip.isPrivate(peer.host)) {
      debug(`Ignoring peer with private IP: ${peer.host}:${peer.port}`);
      return;
    }
    
    // 生成节点ID
    const nodeId = `${peer.host}:${peer.port}`;
    
    // 检查节点是否已存在
    if (this.nodes.has(nodeId)) {
      // 更新最后活动时间
      const node = this.nodes.get(nodeId);
      node.lastSeen = Date.now();
      return;
    }
    
    // 添加新节点
    this.nodes.set(nodeId, {
      id: nodeId,
      address: peer.host,
      port: peer.port,
      lastSeen: Date.now()
    });
    
    debug(`Discovered peer: ${nodeId}`);
    
    // 触发节点发现事件
    this.emit('node:discovered', {
      id: nodeId,
      address: peer.host,
      port: peer.port
    });
  }

  /**
   * 在DHT网络中宣告节点
   * @param {number} port - 监听端口
   */
  announce(port) {
    if (!this.isRunning || !this.dht) {
      debug('DHT not running, cannot announce');
      return;
    }
    
    if (!port) {
      debug('No port provided for announce');
      return;
    }
    
    debug(`Announcing port ${port} for infoHash ${this.infoHash}`);
    
    // 在DHT网络中宣告节点
    this.dht.announce(this.infoHash, port, (err) => {
      if (err) {
        debug('Failed to announce:', err);
        return;
      }
      
      debug('Successfully announced');
    });
  }

  /**
   * 获取所有已发现的节点
   * @returns {Array<Object>} - 节点列表
   */
  getNodes() {
    const nodes = [];
    
    this.nodes.forEach((node) => {
      nodes.push({
        id: node.id,
        address: node.address,
        port: node.port,
        lastSeen: node.lastSeen
      });
    });
    
    return nodes;
  }

  /**
   * 清理超时的节点
   * @param {number} timeout - 超时时间(毫秒)
   */
  cleanupNodes(timeout) {
    const now = Date.now();
    
    this.nodes.forEach((node, id) => {
      if (now - node.lastSeen > timeout) {
        debug(`Node ${id} timed out, removing`);
        this.nodes.delete(id);
        
        // 触发节点离线事件
        this.emit('node:offline', { id });
      }
    });
  }
}

module.exports = DHTDiscovery;