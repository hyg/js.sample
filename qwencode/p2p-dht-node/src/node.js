// 节点主模块
const crypto = require('crypto');
const net = require('net');
const WebSocket = require('ws');
const DHTNode = require('./dht');
const NATHandler = require('./nat');
const config = require('./config');

class P2PNode {
  constructor(options = {}) {
    this.nodeId = options.nodeId || crypto.randomBytes(20).toString('hex');
    this.port = options.port || config.node.port;
    this.dht = new DHTNode({ nodeId: this.nodeId });
    this.nat = new NATHandler();
    this.infoHash = options.infoHash || crypto.createHash('sha1').update(this.nodeId).digest();
    this.peers = new Map(); // 已连接的节点
    this.server = null; // TCP服务器
    this.relaySocket = null; // 中转服务器WebSocket连接
    this.externalIP = null;
    this.externalPort = null;
  }

  // 启动节点
  async start() {
    try {
      // 初始化NAT
      try {
        await this.nat.init();
        
        // 获取外部IP
        try {
          this.externalIP = await this.nat.getExternalIP();
        } catch (err) {
          console.warn('无法获取外部IP地址:', err.message);
        }
      } catch (err) {
        console.warn('NAT初始化失败:', err.message);
      }

      // 启动DHT节点
      await this.dht.start();
      
      // 创建TCP服务器
      this.server = net.createServer((socket) => {
        this.handleConnection(socket);
      });

      // 启动服务器
      this.server.listen(this.port, '0.0.0.0', () => {
        const address = this.server.address();
        this.port = address.port;
        console.log(`TCP服务器监听在端口 ${this.port}`);
        
        // 如果有外部IP，创建端口映射
        if (this.externalIP) {
          this.nat.mapPort(this.port, this.port, `P2P Node ${this.nodeId}`)
            .then(externalPort => {
              this.externalPort = externalPort;
              // 发布节点信息到DHT
              this.dht.announce(this.infoHash, this.port);
            })
            .catch(err => {
              console.error('端口映射失败:', err);
              // 即使端口映射失败，也发布节点信息
              this.dht.announce(this.infoHash, this.port);
            });
        } else {
          // 直接发布节点信息
          this.dht.announce(this.infoHash, this.port);
        }
      });
      
      // 连接到第三方中转服务器
      try {
        await this.connectToRelayServer(config.relayServer.url);
      } catch (err) {
        console.warn('连接到中转服务器失败:', err.message);
      }
      
      console.log(`节点启动成功: ${this.nodeId}`);
    } catch (err) {
      console.error('节点启动失败:', err);
      throw err;
    }
  }

  // 处理TCP连接
  handleConnection(socket) {
    const remoteAddr = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`新连接: ${remoteAddr}`);

    // 设置超时
    socket.setTimeout(config.node.connectionTimeout);

    socket.on('data', (data) => {
      this.handleData(socket, data);
    });

    socket.on('close', () => {
      console.log(`连接关闭: ${remoteAddr}`);
      // 从已连接节点中移除
      this.peers.forEach((peer, id) => {
        if (peer.socket === socket) {
          this.peers.delete(id);
        }
      });
    });

    socket.on('error', (err) => {
      console.error(`连接错误 ${remoteAddr}:`, err);
    });

    socket.on('timeout', () => {
      console.log(`连接超时: ${remoteAddr}`);
      socket.destroy();
    });
  }

  // 连接到中转服务器
  async connectToRelayServer(serverUrl) {
    return new Promise((resolve, reject) => {
      this.relaySocket = new WebSocket(serverUrl);
      
      this.relaySocket.on('open', () => {
        console.log('连接到中转服务器成功');
        
        // 注册节点
        this.relaySocket.send(JSON.stringify({
          type: 'register',
          nodeId: this.nodeId,
          peerInfo: {
            nodeId: this.nodeId,
            host: this.externalIP || 'localhost',
            port: this.port
          }
        }));
        
        resolve(this.relaySocket);
      });
      
      this.relaySocket.on('message', (message) => {
        this.handleRelayMessage(message);
      });
      
      this.relaySocket.on('error', (err) => {
        console.error('中转服务器连接错误:', err);
        reject(err);
      });
      
      this.relaySocket.on('close', () => {
        console.log('与中转服务器的连接已关闭');
      });
    });
  }

  // 处理中转服务器消息
  handleRelayMessage(message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'offer':
          // 处理连接请求
          this.handleOffer(data);
          break;
          
        case 'answer':
          // 处理连接响应
          this.handleAnswer(data);
          break;
          
        case 'candidate':
          // 处理ICE候选
          this.handleCandidate(data);
          break;
          
        default:
          console.warn('未知的中转消息类型:', data.type);
      }
    } catch (err) {
      console.error('处理中转消息失败:', err);
    }
  }

  // 处理连接请求
  handleOffer(data) {
    console.log('收到连接请求:', data.fromNodeId);
    // 在实际实现中，这里会处理WebRTC连接请求
  }

  // 处理连接响应
  handleAnswer(data) {
    console.log('收到连接响应:', data.fromNodeId);
    // 在实际实现中，这里会处理WebRTC连接响应
  }

  // 处理ICE候选
  handleCandidate(data) {
    console.log('收到ICE候选:', data.fromNodeId);
    // 在实际实现中，这里会处理ICE候选信息
  }

  // 处理接收到的数据
  handleData(socket, data) {
    try {
      // 记录通信信息（最小化）
      console.log(`接收数据: ${data.length} 字节`);
      
      // 这里可以处理实际的P2P协议
      // 为简化，我们只回显数据
      socket.write(data);
    } catch (err) {
      console.error('处理数据失败:', err);
    }
  }

  // 连接到其他节点
  async connectToPeer(peerInfo) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      
      socket.setTimeout(config.node.connectionTimeout);
      
      socket.connect(peerInfo.port, peerInfo.host, () => {
        console.log(`连接到节点 ${peerInfo.host}:${peerInfo.port} 成功`);
        
        // 保存连接
        const peerId = `${peerInfo.host}:${peerInfo.port}`;
        this.peers.set(peerId, {
          socket: socket,
          info: peerInfo,
          connectedAt: Date.now()
        });
        
        resolve(socket);
      });
      
      socket.on('error', (err) => {
        console.error(`连接到节点 ${peerInfo.host}:${peerInfo.port} 失败:`, err);
        reject(err);
      });
      
      socket.on('timeout', () => {
        console.error(`连接到节点 ${peerInfo.host}:${peerInfo.port} 超时`);
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  // 通过中转服务器发送消息给目标节点
  sendToPeerViaRelay(targetNodeId, message) {
    if (this.relaySocket && this.relaySocket.readyState === WebSocket.OPEN) {
      this.relaySocket.send(JSON.stringify({
        type: 'data',
        targetNodeId: targetNodeId,
        fromNodeId: this.nodeId,
        payload: message
      }));
      return true;
    }
    return false;
  }

  // 发送消息给节点
  sendMessage(peerId, message) {
    const peer = this.peers.get(peerId);
    if (peer && peer.socket) {
      // 记录通信信息（最小化）
      console.log(`发送数据: ${message.length} 字节到 ${peerId}`);
      peer.socket.write(message);
      return true;
    }
    return false;
  }

  // 查找节点
  async findPeers() {
    try {
      console.log('开始查找节点...');
      const peers = await this.dht.lookup(this.infoHash);
      console.log(`找到 ${peers.length} 个节点`);
      return peers;
    } catch (err) {
      console.error('查找节点失败:', err);
      return [];
    }
  }

  // 停止节点
  async stop() {
    // 停止DHT
    this.dht.stop();
    
    // 关闭NAT映射
    if (this.externalPort) {
      try {
        await this.nat.unmapPort(this.port);
      } catch (err) {
        console.error('删除端口映射失败:', err);
      }
    }
    
    // 关闭NAT客户端
    await this.nat.close();
    
    // 关闭服务器
    if (this.server) {
      this.server.close();
    }
    
    // 关闭中转服务器连接
    if (this.relaySocket) {
      this.relaySocket.close();
    }
    
    console.log('节点已停止');
  }
}

module.exports = P2PNode;