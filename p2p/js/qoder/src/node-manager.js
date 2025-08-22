const DHTClient = require('./dht-client');
const NATTraversal = require('./nat-traversal');
const P2PCommunication = require('./p2p-communication');
const crypto = require('crypto');
const config = require('../config/config');

class NodeManager {
  constructor(options = {}) {
    this.nodeId = options.nodeId || crypto.randomBytes(config.node.nodeIdLength);
    this.port = options.port || config.node.defaultPort;
    this.publicAddress = null;
    this.isRunning = false;
    
    // 初始化组件
    this.dhtClient = new DHTClient(this.nodeId);
    this.natTraversal = new NATTraversal();
    this.p2pComm = new P2PCommunication();
    
    // 连接尝试队列
    this.connectionQueue = new Set();
    this.connectionAttempts = new Map();
    
    // 设置事件处理
    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    // DHT 节点发现事件
    this.dhtClient.on('nodeDiscovered', (nodeInfo) => {
      this.handleNodeDiscovered(nodeInfo);
    });

    // P2P 连接事件
    this.p2pComm.on('peerConnected', (peerId, nodeInfo) => {
      console.log(`✅ 成功连接到节点: ${peerId}`);
      this.connectionQueue.delete(peerId);
      this.connectionAttempts.delete(peerId);
    });

    this.p2pComm.on('peerDisconnected', (peerId) => {
      console.log(`❌ 节点连接断开: ${peerId}`);
    });

    this.p2pComm.on('message', (peerId, message) => {
      this.handleP2PMessage(peerId, message);
    });

    this.p2pComm.on('error', (peerId, error) => {
      console.error(`P2P 连接错误 [${peerId}]:`, error.message);
      this.connectionQueue.delete(peerId);
      
      // 增加连接尝试计数
      const attempts = this.connectionAttempts.get(peerId) || 0;
      this.connectionAttempts.set(peerId, attempts + 1);
    });
  }

  /**
   * 启动节点
   */
  async start() {
    try {
      console.log('🚀 启动 P2P 节点...');
      console.log(`节点 ID: ${this.nodeId.toString('hex')}`);
      
      // 2. 启动 P2P 服务器
      console.log('🔗 启动 P2P 服务器...');
      await this.p2pComm.startServer(this.port);
      
      // 3. 获取公网地址
      console.log('📡 获取公网地址...');
      this.publicAddress = await this.natTraversal.getPublicAddress(this.port + 100);
      console.log(`🌐 公网地址: ${this.publicAddress.address}:${this.publicAddress.port}`);
      
      // 4. 初始化 DHT 客户端
      console.log('🔗 连接 DHT 网络...');
      await this.dhtClient.initialize(this.port + 1000); // DHT 使用不同端口
      
      // 5. 在 DHT 网络中公告自己
      console.log('📢 在 DHT 网络中公告地址...');
      this.dhtClient.announceMyself(this.publicAddress.address, this.port); // 公告 P2P 服务器端口
      
      // 6. 开始查找其他节点
      console.log('🔍 查找网络中的其他节点...');
      this.dhtClient.findNodes();
      
      this.isRunning = true;
      console.log('✅ 节点启动成功！');
      
      // 定期显示状态
      this.startStatusReporting();
      
    } catch (error) {
      console.error('❌ 节点启动失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理发现的新节点
   * @param {Object} nodeInfo 节点信息
   */
  async handleNodeDiscovered(nodeInfo) {
    const peerId = `${nodeInfo.address}:${nodeInfo.port}`;
    
    // 避免连接到自己
    if (nodeInfo.address === this.publicAddress.address && 
        nodeInfo.port === this.port) { // 使用 P2P 服务器端口比较
      return;
    }
    
    // 检查是否已经在连接队列中或已连接
    if (this.connectionQueue.has(peerId) || this.p2pComm.peers.has(peerId)) {
      return;
    }
    
    // 检查连接尝试次数
    const attempts = this.connectionAttempts.get(peerId) || 0;
    if (attempts >= 3) {
      console.log(`⏭️  跳过节点 ${peerId}（已尝试 ${attempts} 次）`);
      return;
    }
    
    console.log(`🤝 尝试连接到新发现的节点: ${peerId}`);
    this.connectionQueue.add(peerId);
    
    try {
      await this.p2pComm.connectToPeer(nodeInfo, true);
    } catch (error) {
      console.warn(`连接到 ${peerId} 失败:`, error.message);
      this.connectionQueue.delete(peerId);
    }
  }

  /**
   * 处理 P2P 消息
   * @param {string} peerId 发送方节点 ID
   * @param {Object} message 消息对象
   */
  handleP2PMessage(peerId, message) {
    // 这里可以添加自定义的消息处理逻辑
    console.log(`📨 处理来自 ${peerId} 的消息 [${message.type}]`);
  }

  /**
   * 发送消息到指定节点
   * @param {string} peerId 目标节点 ID
   * @param {string} type 消息类型
   * @param {Object} data 消息数据
   */
  sendMessage(peerId, type, data) {
    return this.p2pComm.sendMessage(peerId, type, data);
  }

  /**
   * 广播消息到所有连接的节点
   * @param {string} type 消息类型
   * @param {Object} data 消息数据
   */
  broadcastMessage(type, data) {
    return this.p2pComm.broadcastMessage(type, data);
  }

  /**
   * 注册自定义消息处理器
   * @param {string} messageType 消息类型
   * @param {Function} handler 处理函数
   */
  registerMessageHandler(messageType, handler) {
    this.p2pComm.registerMessageHandler(messageType, handler);
  }

  /**
   * 获取节点状态
   * @returns {Object}
   */
  getStatus() {
    const dhtStats = this.dhtClient.getStats();
    const p2pStats = this.p2pComm.getStats();
    
    return {
      nodeId: this.nodeId.toString('hex'),
      isRunning: this.isRunning,
      publicAddress: this.publicAddress,
      localAddress: this.natTraversal.getLocalAddress(),
      dht: dhtStats,
      p2p: p2pStats,
      connectionQueue: this.connectionQueue.size,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }

  /**
   * 开始状态报告
   */
  startStatusReporting() {
    this.startTime = Date.now();
    
    // 每 30 秒显示一次状态
    this.statusInterval = setInterval(() => {
      const status = this.getStatus();
      console.log('\n📊 节点状态报告:');
      console.log(`   DHT 节点数: ${status.dht?.nodes || 0}`);
      console.log(`   已发现节点: ${status.dht?.peers || 0}`);
      console.log(`   P2P 连接数: ${status.p2p.connectedPeers}`);
      console.log(`   待连接队列: ${status.connectionQueue}`);
      console.log(`   运行时间: ${Math.floor(status.uptime / 1000)} 秒`);
    }, 30000);
  }

  /**
   * 获取当前可用的引导节点（用于关闭时显示）
   * @returns {Array}
   */
  getAvailableBootstrapNodes() {
    const dhtNodes = this.dhtClient.getBootstrapNodes();
    const connectedPeers = this.p2pComm.getStats().peers
      .filter(peer => peer.connected)
      .map(peer => ({
        host: peer.id.split(':')[0],
        port: parseInt(peer.id.split(':')[1])
      }));
    
    // 合并并去重
    const allNodes = [...dhtNodes, ...connectedPeers];
    const uniqueNodes = allNodes.filter((node, index, self) => 
      index === self.findIndex(n => n.host === node.host && n.port === node.port)
    );
    
    return uniqueNodes;
  }

  /**
   * 停止节点
   */
  async stop() {
    console.log('🛑 正在停止节点...');
    this.isRunning = false;
    
    // 清理定时器
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
    
    // 获取当前可用的节点作为引导节点
    const availableNodes = this.getAvailableBootstrapNodes();
    
    // 清理连接
    this.p2pComm.destroy();
    this.dhtClient.destroy();
    
    console.log('✅ 节点已停止');
    
    // 显示可用的引导节点
    if (availableNodes.length > 0) {
      console.log('\n🔗 当前可用的引导节点（可用于今后的 DHT BOOTSTRAPS）:');
      availableNodes.forEach((node, index) => {
        console.log(`    { host: '${node.host}', port: ${node.port} }${index < availableNodes.length - 1 ? ',' : ''}`);
      });
    }
    
    return availableNodes;
  }
}

module.exports = NodeManager;