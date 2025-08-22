const net = require('net');
const crypto = require('crypto');
const config = require('../config/config');

class P2PCommunication {
  constructor() {
    this.peers = new Map();
    this.messageHandlers = new Map();
    this.connectionCallbacks = {
      onPeerConnected: null,
      onPeerDisconnected: null,
      onMessage: null,
      onError: null
    };
    this.server = null;
    this.isListening = false;
    
    // 注册默认消息处理器
    this.setupDefaultHandlers();
  }

  /**
   * 设置默认的消息处理器
   */
  setupDefaultHandlers() {
    this.registerMessageHandler(config.p2p.messageTypes.PING, (data, peerId) => {
      console.log(`收到来自 ${peerId} 的 PING`);
      this.sendMessage(peerId, config.p2p.messageTypes.PONG, { timestamp: Date.now() });
    });

    this.registerMessageHandler(config.p2p.messageTypes.PONG, (data, peerId) => {
      console.log(`收到来自 ${peerId} 的 PONG`);
    });

    this.registerMessageHandler(config.p2p.messageTypes.HELLO, (data, peerId) => {
      console.log(`收到来自 ${peerId} 的问候: ${data.message}`);
    });
  }

  /**
   * 启动 P2P 服务器
   * @param {number} port 监听端口
   */
  startServer(port) {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        this.handleIncomingConnection(socket);
      });

      this.server.on('error', (error) => {
        console.error('P2P 服务器错误:', error.message);
        reject(error);
      });

      this.server.listen(port, () => {
        console.log(`P2P 服务器监听端口: ${port}`);
        this.isListening = true;
        resolve();
      });
    });
  }

  /**
   * 处理传入的连接
   * @param {net.Socket} socket TCP 套接字
   */
  handleIncomingConnection(socket) {
    const peerId = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`接受来自 ${peerId} 的连接`);

    // 设置套接字选项
    socket.setKeepAlive(true);
    socket.setTimeout(config.node.connectionTimeout);

    const peerConnection = {
      socket: socket,
      peerId: peerId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      isConnected: true
    };

    this.peers.set(peerId, peerConnection);

    // 监听数据
    socket.on('data', (data) => {
      this.handleMessage(peerId, data);
    });

    // 监听连接关闭
    socket.on('close', () => {
      console.log(`连接 ${peerId} 已关闭`);
      this.peers.delete(peerId);
      if (this.connectionCallbacks.onPeerDisconnected) {
        this.connectionCallbacks.onPeerDisconnected(peerId);
      }
    });

    // 监听错误
    socket.on('error', (error) => {
      console.error(`连接 ${peerId} 错误:`, error.message);
      this.peers.delete(peerId);
      if (this.connectionCallbacks.onError) {
        this.connectionCallbacks.onError(peerId, error);
      }
    });

    // 触发连接回调
    if (this.connectionCallbacks.onPeerConnected) {
      this.connectionCallbacks.onPeerConnected(peerId, { address: socket.remoteAddress, port: socket.remotePort });
    }

    // 发送问候消息
    setTimeout(() => {
      this.sendMessage(peerId, config.p2p.messageTypes.HELLO, {
        message: '你好！我是一个 P2P 节点',
        timestamp: Date.now()
      });
    }, 1000);
  }

  /**
   * 创建到其他节点的连接
   * @param {Object} nodeInfo 目标节点信息
   * @param {boolean} isInitiator 是否为发起方
   * @returns {Promise<string>} 返回 peer ID
   */
  async connectToPeer(nodeInfo, isInitiator = true) {
    return new Promise((resolve, reject) => {
      const peerId = `${nodeInfo.address}:${nodeInfo.port}`;
      
      if (this.peers.has(peerId)) {
        console.log(`已经存在到 ${peerId} 的连接`);
        resolve(peerId);
        return;
      }

      console.log(`发起到 ${peerId} 的连接...`);

      const socket = new net.Socket();
      socket.setKeepAlive(true);
      socket.setTimeout(config.node.connectionTimeout);

      // 设置超时
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error(`连接到 ${peerId} 超时`));
      }, config.node.connectionTimeout);

      // 监听连接建立事件
      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log(`与 ${peerId} 的连接已建立`);
        
        const peerConnection = {
          socket: socket,
          peerId: peerId,
          nodeInfo: nodeInfo,
          connectedAt: new Date(),
          lastActivity: new Date(),
          isConnected: true
        };

        this.peers.set(peerId, peerConnection);

        if (this.connectionCallbacks.onPeerConnected) {
          this.connectionCallbacks.onPeerConnected(peerId, nodeInfo);
        }

        // 发送问候消息
        this.sendMessage(peerId, config.p2p.messageTypes.HELLO, {
          message: '你好！我是一个 P2P 节点',
          timestamp: Date.now()
        });

        resolve(peerId);
      });

      // 监听数据接收事件
      socket.on('data', (data) => {
        this.handleMessage(peerId, data);
      });

      // 监听错误事件
      socket.on('error', (error) => {
        clearTimeout(timeout);
        console.error(`与 ${peerId} 的连接出错:`, error.message);
        this.peers.delete(peerId);
        
        if (this.connectionCallbacks.onError) {
          this.connectionCallbacks.onError(peerId, error);
        }
        
        if (!this.peers.has(peerId)) {
          reject(error);
        }
      });

      // 监听连接关闭事件
      socket.on('close', () => {
        clearTimeout(timeout);
        console.log(`与 ${peerId} 的连接已关闭`);
        this.peers.delete(peerId);
        
        if (this.connectionCallbacks.onPeerDisconnected) {
          this.connectionCallbacks.onPeerDisconnected(peerId);
        }
      });

      // 监听超时事件
      socket.on('timeout', () => {
        console.warn(`连接到 ${peerId} 超时`);
        socket.destroy();
      });

      // 建立连接
      socket.connect(nodeInfo.port, nodeInfo.address);
    });
  }

  /**
   * 发送消息到指定节点
   * @param {string} peerId 目标节点 ID
   * @param {string} type 消息类型
   * @param {Object} data 消息数据
   */
  sendMessage(peerId, type, data) {
    const peerConnection = this.peers.get(peerId);
    if (!peerConnection || !peerConnection.isConnected) {
      console.warn(`无法向 ${peerId} 发送消息：连接不存在或未连接`);
      return false;
    }

    const message = {
      id: crypto.randomUUID(),
      type: type,
      data: data,
      timestamp: Date.now()
    };

    try {
      const messageStr = JSON.stringify(message);
      const messageBuffer = Buffer.from(messageStr + '\n', 'utf8'); // 使用换行符作为消息分隔符
      peerConnection.socket.write(messageBuffer);
      peerConnection.lastActivity = new Date();
      
      console.log(`向 ${peerId} 发送消息 [${type}]:`, data);
      return true;
    } catch (error) {
      console.error(`向 ${peerId} 发送消息失败:`, error.message);
      return false;
    }
  }

  /**
   * 广播消息到所有连接的节点
   * @param {string} type 消息类型
   * @param {Object} data 消息数据
   */
  broadcastMessage(type, data) {
    const connectedPeers = Array.from(this.peers.keys()).filter(peerId => {
      const peerConnection = this.peers.get(peerId);
      return peerConnection && peerConnection.isConnected;
    });

    console.log(`广播消息 [${type}] 到 ${connectedPeers.length} 个节点`);
    
    connectedPeers.forEach(peerId => {
      this.sendMessage(peerId, type, data);
    });

    return connectedPeers.length;
  }

  /**
   * 处理接收到的消息
   * @param {string} peerId 发送方节点 ID
   * @param {Buffer} data 消息数据
   */
  handleMessage(peerId, data) {
    try {
      // 将接收到的数据转换为字符串并按行分割
      const messages = data.toString('utf8').split('\n').filter(line => line.trim());
      
      messages.forEach(messageStr => {
        try {
          const message = JSON.parse(messageStr);
          
          console.log(`收到来自 ${peerId} 的消息 [${message.type}]:`, message.data);
          
          // 更新活动时间
          const peerConnection = this.peers.get(peerId);
          if (peerConnection) {
            peerConnection.lastActivity = new Date();
          }

          // 调用消息处理器
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data, peerId, message);
          } else {
            console.warn(`未知的消息类型: ${message.type}`);
          }

          // 调用通用消息回调
          if (this.connectionCallbacks.onMessage) {
            this.connectionCallbacks.onMessage(peerId, message);
          }
        } catch (parseError) {
          console.warn(`解析单条消息失败:`, parseError.message);
        }
      });

    } catch (error) {
      console.error(`解析来自 ${peerId} 的消息失败:`, error.message);
    }
  }

  /**
   * 注册消息处理器
   * @param {string} messageType 消息类型
   * @param {Function} handler 处理函数
   */
  registerMessageHandler(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
    console.log(`已注册消息处理器: ${messageType}`);
  }

  /**
   * 设置连接回调
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  on(event, callback) {
    if (this.connectionCallbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
      this.connectionCallbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback;
    }
  }

  /**
   * 断开与指定节点的连接
   * @param {string} peerId 节点 ID
   */
  disconnectPeer(peerId) {
    const peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      console.log(`断开与 ${peerId} 的连接`);
      peerConnection.socket.destroy();
      this.peers.delete(peerId);
    }
  }

  /**
   * 获取连接统计信息
   * @returns {Object}
   */
  getStats() {
    const connectedPeers = Array.from(this.peers.values()).filter(peer => 
      peer.isConnected
    );

    return {
      totalPeers: this.peers.size,
      connectedPeers: connectedPeers.length,
      messageHandlers: this.messageHandlers.size,
      peers: Array.from(this.peers.entries()).map(([peerId, peer]) => ({
        id: peerId,
        connected: peer.isConnected,
        connectedAt: peer.connectedAt,
        lastActivity: peer.lastActivity,
        nodeInfo: peer.nodeInfo
      }))
    };
  }

  /**
   * 清理所有连接
   */
  destroy() {
    console.log('清理所有 P2P 连接...');
    
    this.peers.forEach((peerConnection, peerId) => {
      peerConnection.socket.destroy();
    });
    
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    
    this.peers.clear();
    this.messageHandlers.clear();
    this.isListening = false;
  }
}

module.exports = P2PCommunication;