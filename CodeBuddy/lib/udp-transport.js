'use strict';

const dgram = require('dgram');
const EventEmitter = require('events');
const debug = require('debug')('p2p-node:udp');
const crypto = require('crypto');

/**
 * UDP传输模块
 * 使用UDP协议进行节点间通信
 */
class UDPTransport extends EventEmitter {
  /**
   * 创建UDP传输实例
   * @param {Object} options - 配置选项
   * @param {number} [options.port=8001] - 监听端口
   * @param {number} [options.timeout=3000] - 消息超时时间(ms)
   * @param {number} [options.maxRetries=3] - 最大重试次数
   */
  constructor(options) {
    super();
    this.options = options || {};
    this.port = this.options.port || 8001;
    this.timeout = this.options.timeout || 3000;
    this.maxRetries = this.options.maxRetries || 3;
    
    this.socket = null;
    this.nodes = new Map(); // 存储节点 {nodeId: {address, port, lastSeen}}
    this.pendingMessages = new Map(); // 存储待确认的消息 {messageId: {timestamp, retries, nodeId, message, callback}}
    this.isRunning = false;
  }

  /**
   * 启动UDP服务
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      debug('UDP transport already running');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        debug(`Starting UDP service on port ${this.port}`);
        
        // 创建UDP套接字
        this.socket = dgram.createSocket('udp4');
        
        // 监听错误
        this.socket.on('error', (err) => {
          debug('UDP socket error:', err);
          this.emit('error', err);
        });
        
        // 监听消息
        this.socket.on('message', (msg, rinfo) => {
          this._handleMessage(msg, rinfo);
        });
        
        // 监听关闭
        this.socket.on('close', () => {
          debug('UDP socket closed');
          this.isRunning = false;
        });
        
        // 绑定端口
        this.socket.bind(this.port, () => {
          debug(`UDP socket bound to port ${this.port}`);
          this.isRunning = true;
          
          // 设置重传检查定时器
          this._setupRetryInterval();
          
          resolve();
        });
        
      } catch (err) {
        debug('Failed to start UDP service:', err);
        reject(err);
      }
    });
  }

  /**
   * 停止UDP服务
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.isRunning || !this.socket) {
      debug('UDP transport not running');
      return;
    }

    return new Promise((resolve) => {
      debug('Stopping UDP service');
      
      // 清除重传检查定时器
      if (this.retryInterval) {
        clearInterval(this.retryInterval);
        this.retryInterval = null;
      }
      
      // 清空待确认消息列表
      this.pendingMessages.clear();
      
      // 关闭套接字
      this.socket.close(() => {
        debug('UDP socket closed');
        this.socket = null;
        this.isRunning = false;
        resolve();
      });
    });
  }

  /**
   * 设置重传检查定时器
   * @private
   */
  _setupRetryInterval() {
    // 每隔1/3超时时间检查一次待确认消息
    const checkInterval = Math.floor(this.timeout / 3);
    
    this.retryInterval = setInterval(() => {
      this._checkPendingMessages();
    }, checkInterval);
  }

  /**
   * 检查待确认消息，进行重传或超时处理
   * @private
   */
  _checkPendingMessages() {
    const now = Date.now();
    
    for (const [messageId, pending] of this.pendingMessages.entries()) {
      // 检查是否超时
      if (now - pending.timestamp > this.timeout) {
        // 如果还有重试次数，进行重传
        if (pending.retries < this.maxRetries) {
          debug(`Retrying message ${messageId} to ${pending.nodeId} (retry ${pending.retries + 1}/${this.maxRetries})`);
          
          // 更新重试信息
          pending.retries++;
          pending.timestamp = now;
          
          // 重新发送消息
          this._sendRaw(pending.nodeId, pending.message);
        } else {
          // 超过最大重试次数，视为发送失败
          debug(`Message ${messageId} to ${pending.nodeId} failed after ${this.maxRetries} retries`);
          
          // 从待确认消息列表中移除
          this.pendingMessages.delete(messageId);
          
          // 调用回调函数
          if (pending.callback) {
            pending.callback(new Error(`Message failed after ${this.maxRetries} retries`));
          }
        }
      }
    }
  }

  /**
   * 处理接收到的消息
   * @private
   * @param {Buffer} msg - 接收到的消息
   * @param {Object} rinfo - 远程地址信息
   */
  _handleMessage(msg, rinfo) {
    const nodeId = `${rinfo.address}:${rinfo.port}`;
    
    try {
      // 解析消息
      const message = JSON.parse(msg.toString('utf8'));
      
      // 更新节点最后活动时间
      this._updateNodeActivity(nodeId, rinfo.address, rinfo.port);
      
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
      
    } catch (err) {
      debug(`Error handling message from ${nodeId}:`, err);
    }
  }

  /**
   * 更新节点活动状态
   * @private
   * @param {string} nodeId - 节点ID
   * @param {string} address - 节点地址
   * @param {number} port - 节点端口
   */
  _updateNodeActivity(nodeId, address, port) {
    const now = Date.now();
    
    // 检查节点是否已存在
    if (this.nodes.has(nodeId)) {
      // 更新最后活动时间
      const node = this.nodes.get(nodeId);
      node.lastSeen = now;
    } else {
      // 添加新节点
      this.nodes.set(nodeId, {
        address,
        port,
        lastSeen: now
      });
      
      // 触发节点发现事件
      this.emit('node:discovered', {
        id: nodeId,
        address,
        port
      });
    }
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
   * 发送原始消息
   * @private
   * @param {string} nodeId - 节点ID
   * @param {Object} message - 消息对象
   * @returns {boolean} - 是否发送成功
   */
  _sendRaw(nodeId, message) {
    // 解析节点ID
    const [address, portStr] = nodeId.split(':');
    const port = parseInt(portStr, 10);
    
    if (!address || isNaN(port)) {
      debug(`Invalid node ID: ${nodeId}`);
      return false;
    }
    
    try {
      // 将消息转换为JSON字符串
      const data = Buffer.from(JSON.stringify(message));
      
      // 发送消息
      this.socket.send(data, 0, data.length, port, address, (err) => {
        if (err) {
          debug(`Error sending message to ${nodeId}:`, err);
          return;
        }
        
        debug(`Sent message type ${message.type} to ${nodeId}`);
      });
      
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
        retries: 0,
        nodeId,
        message,
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
    });
  }

  /**
   * 广播消息到所有已知节点
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
    
    // 向所有已知节点发送消息
    for (const [nodeId, node] of this.nodes.entries()) {
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
    
    // 等待所有发送完成
    await Promise.all(promises);
    
    return results;
  }

  /**
   * 获取所有已知节点
   * @returns {Array<Object>} - 节点列表
   */
  getNodes() {
    const nodes = [];
    
    this.nodes.forEach((node, id) => {
      nodes.push({
        id,
        address: node.address,
        port: node.port,
        lastSeen: node.lastSeen
      });
    });
    
    return nodes;
  }

  /**
   * 清理超时的节点
   * @param {number} timeout - 超时时间(ms)
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

module.exports = UDPTransport;