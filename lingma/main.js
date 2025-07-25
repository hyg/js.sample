const SimplePeer = require('simple-peer');
const SocketIOClient = require('socket.io-client');
const crypto = require('crypto');

class P2PNode {
  constructor(options) {
    this.nodeId = this.generateNodeId();
    this.roomId = options.roomId || 'default-room';
    // 提供多个信令服务器选项，增加在中国的可用性
    this.signalingServer = options.signalingServer || [
      'https://your-china-signaling-server-1.com',
      'https://your-china-signaling-server-2.com',
      'https://your-signaling-server-cn.com'
    ];
    this.peers = new Map();
    this.socket = null;
  }

  generateNodeId() {
    return crypto.randomBytes(16).toString('hex');
  }

  async initialize() {
    // 尝试连接信令服务器列表中的服务器
    if (Array.isArray(this.signalingServer)) {
      for (const server of this.signalingServer) {
        try {
          console.log(`尝试连接信令服务器: ${server}`);
          this.socket = SocketIOClient(server);
          // 等待连接结果
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('连接超时'));
            }, 5000);
            
            this.socket.on('connect', () => {
              clearTimeout(timeout);
              console.log(`成功连接到信令服务器: ${server}`);
              resolve();
            });
            
            this.socket.on('connect_error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });
          break; // 连接成功则跳出循环
        } catch (err) {
          console.log(`连接信令服务器失败 ${server}:`, err.message);
          if (this.socket) {
            this.socket.disconnect();
          }
        }
      }
    } else {
      // 连接到单个信令服务器
      this.socket = SocketIOClient(this.signalingServer);
    }
    
    if (!this.socket || !this.socket.connected) {
      throw new Error('无法连接到任何信令服务器');
    }
    
    this.setupSocketHandlers();
    this.joinNetwork();
  }

  setupSocketHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from signaling server:', reason);
    });

    this.socket.on('offer', (data) => {
      this.handleOffer(data);
    });

    this.socket.on('answer', (data) => {
      this.handleAnswer(data);
    });

    this.socket.on('ice-candidate', (data) => {
      this.handleIceCandidate(data);
    });

    this.socket.on('new-peer', (data) => {
      if (data.from !== this.nodeId) {
        this.initiateConnection(data.from);
      }
    });
  }

  joinNetwork() {
    this.socket.emit('join-room', {
      roomId: this.roomId,
      nodeId: this.nodeId
    });
  }

  initiateConnection(targetNodeId) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          // 添加一些在中国可能可用的 STUN 服务器
          { urls: 'stun:stun.voipbuster.com' },
          { urls: 'stun:stun.voiparound.com' },
          { urls: 'stun:stun.voipstunt.com' }
        ]
      }
    });

    this.setupPeerHandlers(peer, targetNodeId);
    this.peers.set(targetNodeId, peer);
  }

  handleOffer(data) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          // 添加一些在中国可能可用的 STUN 服务器
          { urls: 'stun:stun.voipbuster.com' },
          { urls: 'stun:stun.voiparound.com' },
          { urls: 'stun:stun.voipstunt.com' }
        ]
      }
    });

    this.setupPeerHandlers(peer, data.from);
    this.peers.set(data.from, peer);
    peer.signal(data.offer);
  }

  handleAnswer(data) {
    const peer = this.peers.get(data.from);
    if (peer) {
      peer.signal(data.answer);
    }
  }

  handleIceCandidate(data) {
    const peer = this.peers.get(data.from);
    if (peer) {
      peer.addIceCandidate(data.candidate);
    }
  }

  // ... 其余代码保持不变
  setupPeerHandlers(peer, targetNodeId) {
    peer.on('signal', (data) => {
      this.socket.emit('signal', {
        to: targetNodeId,
        from: this.nodeId,
        signal: data
      });
    });

    peer.on('connect', () => {
      console.log(`Connected to peer ${targetNodeId}`);
      // Send a simple message to confirm connection
      peer.send(JSON.stringify({
        type: 'hello',
        from: this.nodeId,
        timestamp: Date.now()
      }));
    });

    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message, targetNodeId);
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    peer.on('close', () => {
      console.log(`Connection to peer ${targetNodeId} closed`);
      this.peers.delete(targetNodeId);
    });

    peer.on('error', (err) => {
      console.error(`Error with peer ${targetNodeId}:`, err);
    });
  }

  handleMessage(message, senderId) {
    switch (message.type) {
      case 'hello':
        console.log(`Hello from ${senderId}`);
        // Respond to hello
        this.sendMessage(senderId, {
          type: 'hello-response',
          message: 'Hello back!',
          timestamp: Date.now()
        });
        break;
      case 'hello-response':
        console.log(`Response from ${senderId}: ${message.message}`);
        break;
      default:
        console.log(`Received message from ${senderId}:`, message);
    }
  }

  sendMessage(targetNodeId, message) {
    const peer = this.peers.get(targetNodeId);
    if (peer && peer.connected) {
      peer.send(JSON.stringify(message));
    } else {
      console.error(`Peer ${targetNodeId} not connected`);
    }
  }

  broadcastMessage(message) {
    for (const [nodeId, peer] of this.peers.entries()) {
      if (peer.connected) {
        peer.send(JSON.stringify(message));
      }
    }
  }

  listPeers() {
    return Array.from(this.peers.keys());
  }

  disconnect() {
    this.socket.disconnect();
    for (const peer of this.peers.values()) {
      peer.destroy();
    }
    this.peers.clear();
  }
}

module.exports = P2PNode;