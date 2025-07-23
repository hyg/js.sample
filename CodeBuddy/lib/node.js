'use strict';

const EventEmitter = require('events');
const debug = require('debug')('p2p-node:node');
const crypto = require('crypto');
const DHTDiscovery = require('./dht');
const NATTraversal = require('./nat');
const TCPTransport = require('./tcp-transport');
const UDPTransport = require('./udp-transport');

/**
 * P2P节点管理模块
 * 整合DHT、NAT穿透和传输模块，管理节点的生命周期
 */
class Node extends EventEmitter {
  /**
   * 创建P2P节点实例
   * @param {Object} options - 配置选项
   * @param {Object} options.dht - DHT配置
   * @param {Object} options.nat - NAT穿透配置
   * @param {Object} options.transport - 传输配置
   * @param {Object} options.node - 节点配置
   */
  constructor(options) {
    super();
    this.options = options || {};
    
    // 生成或使用指定的节点ID
    this.id = this.options.node?.id || crypto.randomBytes(20).toString('hex');
    debug(`Creating node with ID: ${this.id}`);
    
    // 初始化DHT发现模块
    this.dht = new DHTDiscovery(this.options.dht);
    
    // 初始化NAT穿透模块
    this.nat = new NATTraversal(this.options.nat);
    
    // 初始化传输模块
    const transportType = this.options.transport?.default || 'tcp';
    if (transportType === 'tcp') {
      this.transport = new TCPTransport(this.options.transport?.tcp);
    } else if (transportType === 'udp') {
      this.transport = new UDPTransport(this.options.transport?.udp);
    } else {
      throw new Error(`Unsupported transport type: ${transportType}`);
    }
    
    // 节点状态
    this.isRunning = false;
    this.publicAddress = null;
    this.publicPort = null;
    
    // 节点连接和消息处理
    this._setupEventHandlers();
  }

  /**
   * 设置事件处理器
   * @private
   */
  _setupEventHandlers() {
    // DHT事件
    this.dht.on('error', (err) => {
      debug('DHT error:', err);
      this.emit('error', { source: 'dht', error: err });
    });
    
    this.dht.on('node:discovered', (node) => {
      debug(`DHT discovered node: ${node.id}`);
      this.emit('node:discovered', node);
      
      // 尝试连接到新发现的节点
      this._connectToNode(node);
    });
    
    this.dht.on('node:offline', (node) => {
      debug(`DHT node offline: ${node.id}`);
      this.emit('node:offline', node);
    });
    
    // NAT事件
    this.nat.on('error', (err) => {
      debug('NAT error:', err);
      this.emit('error', { source: 'nat', error: err });
    });
    
    // 传输事件
    this.transport.on('error', (err) => {
      debug('Transport error:', err);
      this.emit('error', { source: 'transport', error: err });
    });
    
    this.transport.on('connection', (node) => {
      debug(`Connected to node: ${node.id}`);
      this.emit('node:connected', node);
      
      // 发送节点信息
      this._sendNodeInfo(node.id);
    });
    
    this.transport.on('disconnection', (node) => {
      debug(`Disconnected from node: ${node.id}`);
      this.emit('node:disconnected', node);
    });
    
    this.transport.on('message', (message) => {
      debug(`Received message type ${message.type} from ${message.from}`);
      
      // 处理特殊消息类型
      if (message.type === 'node:info') {
        this._handleNodeInfo(message);
        return;
      }
      
      // 转发其他消息类型
      this.emit('message', message);
    });
  }

  /**
   * 启动节点
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      debug('Node already running');
      return;
    }

    debug('Starting node');
    
    try {
      // 启动NAT穿透
      await this.nat.init();
      
      // 获取公网IP
      this.publicAddress = await this.nat.getPublicIp();
      debug(`Public IP: ${this.publicAddress}`);
      
      // 启动传输模块
      await this.transport.start();
      
      // 创建端口映射
      const transportPort = this.options.transport?.tcp?.port || 
                           this.options.transport?.udp?.port || 
                           (this.options.transport?.default === 'tcp' ? 8000 : 8001);
      
      const mapping = await this.nat.createMapping(
        this.options.transport?.default || 'tcp',
        transportPort
      );
      
      this.publicPort = mapping.externalPort;
      debug(`Created port mapping: internal ${transportPort} -> external ${this.publicPort}`);
      
      // 启动DHT发现
      await this.dht.start();
      
      // 在DHT网络中宣告我们的节点
      this.dht.announce(this.publicPort);
      
      // 设置节点发现和存活检测定时器
      this._setupIntervals();
      
      this.isRunning = true;
      debug('Node started successfully');
      
      // 触发启动事件
      this.emit('started', {
        id: this.id,
        publicAddress: this.publicAddress,
        publicPort: this.publicPort
      });
      
    } catch (err) {
      debug('Failed to start node:', err);
      
      // 清理已启动的模块
      await this._cleanup();
      
      throw err;
    }
  }

  /**
   * 停止节点
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning) {
      debug('Node not running');
      return;
    }

    debug('Stopping node');
    
    await this._cleanup();
    
    this.isRunning = false;
    debug('Node stopped');
    
    // 触发停止事件
    this.emit('stopped');
  }

  /**
   * 清理资源
   * @private
   * @returns {Promise<void>}
   */
  async _cleanup() {
    // 清除定时器
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    
    // 停止各模块
    const promises = [];
    
    if (this.dht) {
      promises.push(this.dht.stop().catch(err => debug('Error stopping DHT:', err)));
    }
    
    if (this.transport) {
      promises.push(this.transport.stop().catch(err => debug('Error stopping transport:', err)));
    }
    
    if (this.nat) {
      promises.push(this.nat.close().catch(err => debug('Error closing NAT:', err)));
    }
    
    await Promise.all(promises);
  }

  /**
   * 设置定时器
   * @private
   */
  _setupIntervals() {
    // 节点发现定时器
    const discoveryInterval = this.options.node?.discoveryInterval || 60000;
    this.discoveryInterval = setInterval(() => {
      this._discoverNodes();
    }, discoveryInterval);
    
    // 节点存活检测定时器
    const keepAliveInterval = this.options.node?.keepAliveInterval || 30000;
    this.keepAliveInterval = setInterval(() => {
      this._checkNodesAlive();
    }, keepAliveInterval);
  }

  /**
   * 发现节点
   * @private
   */
  _discoverNodes() {
    if (!this.isRunning) return;
    
    debug('Discovering nodes');
    
    // 在DHT网络中查找节点
    this.dht._findPeers();
    
    // 在DHT网络中重新宣告我们的节点
    this.dht.announce(this.publicPort);
  }

  /**
   * 检查节点存活状态
   * @private
   */
  _checkNodesAlive() {
    if (!this.isRunning) return;
    
    debug('Checking nodes alive');
    
    // 清理超时的DHT节点
    const timeout = this.options.node?.timeout || 90000;
    this.dht.cleanupNodes(timeout);
    
    // 向所有连接的节点发送心跳
    const connections = this.transport.getConnections();
    for (const conn of connections) {
      this.transport.send(conn.id, 'node:heartbeat', {
        timestamp: Date.now()
      }).catch(err => {
        debug(`Failed to send heartbeat to ${conn.id}:`, err);
      });
    }
  }

  /**
   * 连接到节点
   * @private
   * @param {Object} node - 节点信息
   */
  async _connectToNode(node) {
    if (!this.isRunning) return;
    
    // 检查是否已连接
    if (this.transport.isConnected && this.transport.isConnected(node.id)) {
      debug(`Already connected to ${node.id}`);
      return;
    }
    
    debug(`Connecting to node ${node.id}`);
    
    try {
      await this.transport.connect(node.address, node.port);
      debug(`Successfully connected to ${node.id}`);
    } catch (err) {
      debug(`Failed to connect to ${node.id}:`, err);
    }
  }

  /**
   * 发送节点信息
   * @private
   * @param {string} nodeId - 目标节点ID
   */
  async _sendNodeInfo(nodeId) {
    try {
      await this.transport.send(nodeId, 'node:info', {
        id: this.id,
        address: this.publicAddress,
        port: this.publicPort
      });
      debug(`Sent node info to ${nodeId}`);
    } catch (err) {
      debug(`Failed to send node info to ${nodeId}:`, err);
    }
  }

  /**
   * 处理节点信息消息
   * @private
   * @param {Object} message - 消息对象
   */
  _handleNodeInfo(message) {
    const { from, payload } = message;
    
    if (!payload || !payload.id) {
      debug(`Received invalid node info from ${from}`);
      return;
    }
    
    debug(`Received node info from ${from}: id=${payload.id}`);
    
    // 触发节点信息事件
    this.emit('node:info', {
      id: from,
      nodeId: payload.id,
      address: payload.address,
      port: payload.port
    });
  }

  /**
   * 发送消息到指定节点
   * @param {string} nodeId - 目标节点ID
   * @param {string} type - 消息类型
   * @param {Object} payload - 消息内容
   * @returns {Promise<void>}
   */
  async send(nodeId, type, payload) {
    if (!this.isRunning) {
      throw new Error('Node not running');
    }
    
    debug(`Sending message type ${type} to ${nodeId}`);
    
    return this.transport.send(nodeId, type, payload);
  }

  /**
   * 广播消息到所有连接的节点
   * @param {string} type - 消息类型
   * @param {Object} payload - 消息内容
   * @returns {Promise<Object>} - 发送结果
   */
  async broadcast(type, payload) {
    if (!this.isRunning) {
      throw new Error('Node not running');
    }
    
    debug(`Broadcasting message type ${type}`);
    
    return this.transport.broadcast(type, payload);
  }

  /**
   * 获取所有连接的节点
   * @returns {Array<Object>} - 节点列表
   */
  getConnectedNodes() {
    return this.transport.getConnections ? 
           this.transport.getConnections() : 
           this.transport.getNodes();
  }

  /**
   * 获取所有已发现的节点
   * @returns {Array<Object>} - 节点列表
   */
  getDiscoveredNodes() {
    return this.dht.getNodes();
  }
}

module.exports = Node;