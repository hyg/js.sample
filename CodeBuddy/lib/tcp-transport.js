'use strict';

const net = require('net');
const EventEmitter = require('events');
const debug = require('debug')('p2p-node:tcp');
const crypto = require('crypto');

/**
 * TCP传输模块
 * 使用TCP协议进行节点间通信
 */
class TCPTransport extends EventEmitter {
  /**
   * 创建TCP传输实例
   * @param {Object} options - 配置选项
   * @param {number} [options.port=8000] - 监听端口
   * @param {number} [options.timeout=5000] - 连接超时时间(ms)
   */
  constructor(options) {
    super();
    this.options = options || {};
    this.port = this.options.port || 8000;
    this.timeout = this.options.timeout || 5000;
    
    this.server = null;
    this.connections = new Map(); // 存储连接 {nodeId: {socket, address, port, connected}}
    this.pendingMessages = new Map(); // 存储待确认的消息 {messageId: {timestamp, callback}}
    this.isRunning = false;
  }

  /**
   * 启动TCP服务器
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      debug('TCP transport already running');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        debug(`Starting TCP server on port ${this.port}`);
        
        this.server = net.createServer((socket) => {
          this._handleConnection(socket);
        });
        
        // 监听错误
        this.server.on('error', (err) => {
          debug('TCP server error:', err);
          this.emit('error', err);
        });
        
        // 启动服务器
        this.server.listen(this.port, () => {
          debug(`TCP server listening on port ${this.port}`);
          this.isRunning = true;
          resolve();
        });
        
      } catch (err) {
        debug('Failed to start TCP server:', err);
        reject(err);
      }
    });
  }

  /**
   * 停止TCP服务器
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning || !this.server) {
      debug('TCP transport not running');
      return;
    }

    return new Promise((resolve) => {
      debug('Stopping TCP server');
      
      // 关闭所有连接
      for (const [nodeId, conn] of this.connections.entries()) {
        if (conn.socket && !conn.socket.destroyed) {
          debug(`Closing connection to ${nodeId}`);
          conn.socket.destroy();
        }
      }
      
      // 清空连接列表
      this.connections.clear();
      
      // 清空待确认消息列表
      this.pendingMessages.clear();
      
      // 关闭服务器
      this.server.close(() => {
        debug('TCP server closed');
        this.server = null;
        this.isRunning = false;
        resolve();
      });
    });
  }

  /**
   * 处理新的连接
   * @private
   * @param {net.Socket} socket - 连接的socket
   */
  _handleConnection(socket) {
    const remoteAddress = socket.remoteAddress;
    const remotePort = socket.remotePort;
    const nodeId = `${remoteAddress}:${remotePort}`;
    
    debug(`New connection from ${nodeId}`);
    
    // 设置编码
    socket.setEncoding('utf8');
    
    // 设置超时
    socket.setTimeout(this.timeout);
    
    // 存储连接
    this.connections.set(nodeId, {
      socket,
      address: remoteAddress,
      port: remotePort,
      connected: true
    });
    
    // 监听数据
    socket.on('data', (data) => {
      try {
        const messages = this._parseMessages(data);
        
        for (const message of messages) {
          this._handleMessage(nodeId, message);
        }
      } catch (err) {
        debug(`Error parsing message from ${nodeId}:`, err);
      }
    });
    
    // 监听错误
    socket.on('error', (err) => {
      debug(`Socket error from ${nodeId}:`, err);
      this._handleDisconnect(nodeId, err);
    });
    
    // 监听关闭
    socket.on('close', () => {
      debug(`Connection closed from ${nodeId}`);
      this._handleDisconnect(nodeId);
    });
    
    // 监听超时
    socket.on('timeout', () => {
      debug(`Connection timeout from ${nodeId}`);
      socket.end();
      this._handleDisconnect(nodeId, new Error('Connection timeout'));
    });
    
    // 触发连接事件
    this.emit('connection', { id: nodeId, address: remoteAddress, port: remotePort });
  }

  /**
   * 处理连接断开
   * @private
   * @param {string} nodeId - 节点ID
   * @param {Error} [error] - 错误对象
   */
  _handleDisconnect(nodeId, error) {
    const conn = this.connections.get(nodeId);
    
    if (conn) {
      // 标记为断开连接
      conn.connected = false;
      
      // 触发断开连接事件
      this.emit('disconnection', { id: nodeId, error });
      
      // 从连接列表中移除
      this.connections.delete(nodeId);
    }
  }

  /**
   * 解析接收到的消息
   * @private
   * @param {string} data - 接收到的数据
   * @returns {Array<Object>} - 解析后的消息对象数组
   */
  _parseMessages(data) {
    const messages = [];
    
    // 尝试解析JSON
    try {
      // 检查是否有多个JSON对象（可能是多条消息连在一起）
      const jsonObjects = data.split('\n').filter(str => str.trim());
      
      for (const jsonStr of jsonObjects) {
        if (jsonStr.trim()) {
          const message = JSON.parse(jsonStr);
          messages.push(message);
        }
      }
    } catch (err) {
      debug('Error parsing message:', err);
      throw err;
    }
    
    return messages;
  }

  /**
   * 处理接收到的消息
   * @private
   * @param {string} nodeId - 发送消息的节点ID
   * @param {Object} message - 消息对象
   */
  _handleMessage(nodeId, message) {
    // 检查消息类型
    if (!message.type) {
      debug(`Received message without type from ${nodeId}`);
      return;
    }
    
    debug(`Received message type ${message.type} from ${nodeId}`);
    
    // 处理确认消息
    if (message.type === 'ack') {
      this._handleAck(message);
      return;
    }
    
    // 发送确认消息
    if (message.id) {
      this._sendAck(nodeId, message.id);
    }
    
    // 触发消息事件
    this.emit('message', {
      from: nodeId,
      ...message
    });
  }

  /**
   * 处理确认消息
   * @private
   * @param {Object} message - 确认消息
   */
  _handleAck(message) {
    const { id } = message;
    
    if (!id || !this.pendingMessages.has(id)) {
      return;
    }
    
    const pending = this.pendingMessages.get(id);
    
    // 调用回调函数
    if (pending.callback) {
      pending.callback(null);
    }
    
    // 从待确认消息列表中移除
    this.pendingMessages.delete(id);
  }

  /**
   * 发送确认消息
   * @private
   * @param {string} nodeId - 节点ID
   * @param {string} messageId - 消息ID
   */
  _sendAck(nodeId, messageId) {
    const ackMessage = {
      type: 'ack',
      id: messageId
    };
    
    this._sendRaw(nodeId, ackMessage);
  }

  /**
   * 连接到远程节点
   * @param {string} address - 远程节点地址
   * @param {number} port - 远程节点端口
   * @returns {Promise<string>} - 连接成功后返回节点ID
   */
  async connect(address, port) {
    const nodeId = `${address}:${port}`;
    
    // 检查是否已连接
    if (this.connections.has(nodeId) && this.connections.get(nodeId).connected) {
      debug(`Already connected to ${nodeId}`);
      return nodeId;
    }
    
    debug(`Connecting to ${nodeId}`);
    
    return new Promise((resolve, reject) => {
      try {
        const socket = new net.Socket();
        
        // 设置编码
        socket.setEncoding('utf8');
        
        // 设置超时
        socket.setTimeout(this.timeout);
        
        // 连接成功处理
        socket.on('connect', () => {
          debug(`Successfully connected to ${nodeId}`);
          
          // 存储连接
          this.connections.set(nodeId, {
            socket,
            address,
            port,
            connected: true
          });
          
          // 监听数据
          socket.on('data', (data) => {
            try {
              const messages = this._parseMessages(data);
              
              for (const message of messages) {
                this._handleMessage(nodeId, message);
              }
            } catch (err) {
              debug(`Error parsing message from ${nodeId}:`, err);
            }
          });
          
          // 触发连接事件
          this.emit('connection', { id: nodeId, address, port });
          
          resolve(nodeId);
        });
        
        // 监听错误
        socket.on('error', (err) => {
          debug(`Error connecting to ${nodeId}:`, err);
          this._handleDisconnect(nodeId, err);
          reject(err);
        });
        
        // 监听关闭
        socket.on('close', () => {
          debug(`Connection closed to ${nodeId}`);
          this._handleDisconnect(nodeId);
        });
        
        // 监听超时
        socket.on('timeout', () => {
          debug(`Connection timeout to ${nodeId}`);
          socket.end();
          this._handleDisconnect(nodeId, new Error('Connection timeout'));
          reject(new Error('Connection timeout'));
        });
        
        // 连接到远程节点
        socket.connect(port, address);
        
      } catch (err) {
        debug(`Failed to connect to ${nodeId}:`, err);
        reject(err);
      }
    });
  }

  /**
   * 发送原始消息
   * @private
   * @param {string} nodeId - 节点ID
   * @param {Object} message - 消息对象
   * @returns {boolean} - 是否发送成功
   */
  _sendRaw(nodeId, message) {
    const conn = this.connections.get(nodeId);
    
    if (!conn || !conn.connected || !conn.socket || conn.socket.destroyed) {
      debug(`Cannot send message to ${nodeId}: not connected`);
      return false;
    }
    
    try {
      // 将消息转换为JSON字符串，并添加换行符作为消息分隔符
      const data = JSON.stringify(message) + '\n';
      
      // 发送消息
      conn.socket.write(data);
      
      return true;
    } catch (err) {
      debug(`Error sending message to ${nodeId}:`, err);
      return false;
    }
  }

  /**
   * 发送消息到指定节点
   * @param {string} nodeId - 节点ID
   * @param {string} type - 消息类型
   * @param {Object} payload - 消息内容
   * @returns {Promise<void>}
   */
  async send(nodeId, type, payload) {
    return new Promise((resolve, reject) => {
      // 生成消息ID
      const messageId = crypto.randomBytes(8).toString('hex');
      
      // 创建消息对象
      const message = {
        id: messageId,
        type,
        payload,
        timestamp: Date.now()
      };
      
      // 存储待确认消息
      this.pendingMessages.set(messageId, {
        timestamp: Date.now(),
        callback: (err) => {
          if (err) reject(err);
          else resolve();
        }
      });
      
      // 发送消息
      const success = this._sendRaw(nodeId, message);
      
      if (!success) {
        // 从待确认消息列表中移除
        this.pendingMessages.delete(messageId);
        reject(new Error(`Failed to send message to ${nodeId}`));
      }
      
      // 设置超时
      setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          // 从待确认消息列表中移除
          const pending = this.pendingMessages.get(messageId);
          this.pendingMessages.delete(messageId);
          
          // 调用回调函数
          if (pending.callback) {
            pending.callback(new Error(`Message timeout to ${nodeId}`));
          }
        }
      }, this.timeout);
    });
  }

  /**
   * 广播消息到所有连接的节点
   * @param {string} type - 消息类型
   * @param {Object} payload - 消息内容
   * @returns {Promise<Object>} - 发送结果 {success: Array<string>, failed: Array<string>}
   */
  async broadcast(type, payload) {
    const promises = [];
    const results = {
      success: [],
      failed: []
    };
    
    // 向所有连接的节点发送消息
    for (const [nodeId, conn] of this.connections.entries()) {
      if (conn.connected) {
        promises.push(
          this.send(nodeId, type, payload)
            .then(() => {
              results.success.push(nodeId);
            })
            .catch(() => {
              results.failed.push(nodeId);
            })
        );
      }
    }
    
    // 等待所有发送完成
    await Promise.all(promises);
    
    return results;
  }

  /**
   * 断开与指定节点的连接
   * @param {string} nodeId - 节点ID
   * @returns {boolean} - 是否成功断开连接
   */
  disconnect(nodeId) {
    const conn = this.connections.get(nodeId);
    
    if (!conn || !conn.connected) {
      debug(`Not connected to ${nodeId}`);
      return false;
    }
    
    try {
      debug(`Disconnecting from ${nodeId}`);
      
      // 关闭socket
      if (conn.socket && !conn.socket.destroyed) {
        conn.socket.destroy();
      }
      
      // 从连接列表中移除
      this.connections.delete(nodeId);
      
      return true;
    } catch (err) {
      debug(`Error disconnecting from ${nodeId}:`, err);
      return false;
    }
  }

  /**
   * 获取所有连接的节点
   * @returns {Array<Object>} - 节点列表
   */
  getConnections() {
    const connections = [];
    
    this.connections.forEach((conn, id) => {
      if (conn.connected) {
        connections.push({
          id,
          address: conn.address,
          port: conn.port
        });
      }
    });
    
    return connections;
  }

  /**
   * 检查是否已连接到指定节点
   * @param {string} nodeId - 节点ID
   * @returns {boolean} - 是否已连接
   */
  isConnected(nodeId) {
    const conn = this.connections.get(nodeId);
    return !!(conn && conn.connected);
  }
}

module.exports = TCPTransport;