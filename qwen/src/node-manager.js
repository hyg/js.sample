const DHTDiscovery = require('./dht-discovery');
const TCPTransport = require('./tcp-transport');
const UDPTransport = require('./udp-transport');
const EventEmitter = require('events');

class NodeManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.magnetUri = options.magnetUri || 'magnet:?xt=urn:btih:1234567890123456789012345678901234567890';
    this.options = options;
    
    this.dhtDiscovery = null;
    this.tcpTransport = null;
    this.udpTransport = null;
    
    this.discoveredNodes = new Map();
    this.localAddress = null;
    this.publicAddress = null;
    
    this.isRunning = false;
  }

  async start() {
    try {
      console.log('Starting P2P node...');
      
      // 初始化DHT发现
      this.dhtDiscovery = new DHTDiscovery(this.magnetUri, {
        port: this.options.dhtPort || 6881
      });
      
      await this.dhtDiscovery.start();
      
      // 初始化TCP传输
      this.tcpTransport = new TCPTransport({
        port: this.options.tcpPort || 0
      });
      
      const tcpAddr = await this.tcpTransport.start();
      
      // 初始化UDP传输
      this.udpTransport = new UDPTransport({
        port: this.options.udpPort || 0
      });
      
      const udpAddr = await this.udpTransport.start();
      
      // 设置本地地址
      this.localAddress = {
        tcp: tcpAddr,
        udp: udpAddr,
        dht: this.dhtDiscovery.getPublicAddress()
      };
      
      // 设置事件监听
      this.setupEventHandlers();
      
      // 启动节点发现
      this.startNodeDiscovery();
      
      this.isRunning = true;
      console.log('P2P node started successfully');
      console.log('Local addresses:', this.localAddress);
      
    } catch (error) {
      console.error('Failed to start node:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    // TCP消息处理
    this.tcpTransport.on('message', (message) => {
      this.handleIncomingMessage('tcp', message);
    });

    // UDP消息处理
    this.udpTransport.on('message', (message) => {
      this.handleIncomingMessage('udp', message);
    });

    // 定期更新发现的节点
    setInterval(() => {
      this.updateDiscoveredNodes();
    }, 30000); // 每30秒更新一次
  }

  handleIncomingMessage(protocol, message) {
    try {
      const data = JSON.parse(message.data);
      
      if (data.type === 'ping') {
        this.handlePing(protocol, message.from, data);
      } else if (data.type === 'pong') {
        this.handlePong(protocol, message.from, data);
      } else if (data.type === 'node-info') {
        this.handleNodeInfo(protocol, message.from, data);
      } else {
        // 转发给应用层
        this.emit('message', {
          protocol,
          from: message.from,
          data: message.data
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  handlePing(protocol, from, data) {
    const [host, port] = from.split(':');
    const response = {
      type: 'pong',
      nodeId: this.getNodeId(),
      addresses: this.localAddress,
      timestamp: Date.now()
    };

    if (protocol === 'tcp') {
      this.tcpTransport.sendMessage(host, parseInt(port), JSON.stringify(response));
    } else if (protocol === 'udp') {
      this.udpTransport.sendMessage(host, parseInt(port), JSON.stringify(response));
    }
  }

  handlePong(protocol, from, data) {
    const nodeKey = `${data.nodeId}`;
    if (!this.discoveredNodes.has(nodeKey)) {
      this.discoveredNodes.set(nodeKey, {
        nodeId: data.nodeId,
        addresses: data.addresses,
        lastSeen: Date.now(),
        protocol: protocol
      });
      console.log('Discovered new node:', nodeKey);
    } else {
      const node = this.discoveredNodes.get(nodeKey);
      node.lastSeen = Date.now();
    }
  }

  handleNodeInfo(protocol, from, data) {
    const nodeKey = `${data.nodeId}`;
    this.discoveredNodes.set(nodeKey, {
      nodeId: data.nodeId,
      addresses: data.addresses,
      lastSeen: Date.now(),
      protocol: protocol
    });
  }

  startNodeDiscovery() {
    // 每10秒对发现的节点进行ping
    setInterval(() => {
      this.pingDiscoveredNodes();
    }, 10000);
  }

  updateDiscoveredNodes() {
    const dhtPeers = this.dhtDiscovery.getDiscoveredPeers();
    
    for (const peer of dhtPeers) {
      this.sendNodeInfo('udp', peer.host, peer.port);
    }
  }

  pingDiscoveredNodes() {
    const pingMessage = JSON.stringify({
      type: 'ping',
      nodeId: this.getNodeId(),
      timestamp: Date.now()
    });

    for (const [nodeId, node] of this.discoveredNodes) {
      if (Date.now() - node.lastSeen > 60000) {
        // 60秒未响应，移除节点
        this.discoveredNodes.delete(nodeId);
        continue;
      }

      // 尝试通过已知的地址发送ping
      if (node.addresses.tcp) {
        this.tcpTransport.sendMessage(
          node.addresses.tcp.address,
          node.addresses.tcp.port,
          pingMessage
        ).catch(() => {});
      }

      if (node.addresses.udp) {
        this.udpTransport.sendMessage(
          node.addresses.udp.address,
          node.addresses.udp.port,
          pingMessage
        ).catch(() => {});
      }
    }
  }

  sendNodeInfo(protocol, host, port) {
    const message = JSON.stringify({
      type: 'node-info',
      nodeId: this.getNodeId(),
      addresses: this.localAddress,
      timestamp: Date.now()
    });

    if (protocol === 'tcp') {
      this.tcpTransport.sendMessage(host, port, message).catch(() => {});
    } else if (protocol === 'udp') {
      this.udpTransport.sendMessage(host, port, message).catch(() => {});
    }
  }

  async sendMessage(protocol, host, port, message) {
    if (protocol === 'tcp') {
      return this.tcpTransport.sendMessage(host, port, message);
    } else if (protocol === 'udp') {
      return this.udpTransport.sendMessage(host, port, message);
    }
  }

  async broadcastMessage(message, exclude = []) {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    const peers = [];
    for (const [nodeId, node] of this.discoveredNodes) {
      if (exclude.includes(nodeId)) continue;
      
      if (node.addresses.tcp) {
        peers.push({
          host: node.addresses.tcp.address,
          port: node.addresses.tcp.port,
          protocol: 'tcp'
        });
      }
      
      if (node.addresses.udp) {
        peers.push({
          host: node.addresses.udp.address,
          port: node.addresses.udp.port,
          protocol: 'udp'
        });
      }
    }

    const promises = [];
    for (const peer of peers) {
      promises.push(
        this.sendMessage(peer.protocol, peer.host, peer.port, messageStr)
          .catch(() => {}) // 忽略发送失败的节点
      );
    }

    await Promise.allSettled(promises);
  }

  getDiscoveredNodes() {
    return Array.from(this.discoveredNodes.values());
  }

  getLocalAddress() {
    return this.localAddress;
  }

  getNodeId() {
    return this.dhtDiscovery.nodeId.toString('hex');
  }

  async stop() {
    console.log('Stopping P2P node...');
    
    const promises = [];
    
    if (this.dhtDiscovery) {
      promises.push(this.dhtDiscovery.stop());
    }
    
    if (this.tcpTransport) {
      promises.push(this.tcpTransport.stop());
    }
    
    if (this.udpTransport) {
      promises.push(this.udpTransport.stop());
    }

    await Promise.all(promises);
    this.isRunning = false;
    console.log('P2P node stopped');
  }
}

module.exports = NodeManager;