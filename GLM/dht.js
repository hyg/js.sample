const dgram = require('dgram');
const crypto = require('crypto');
const StunClient = require('./stun');

class DHTNode {
    constructor(options = {}) {
      this.id = options.id || crypto.randomBytes(20).toString('hex');
      this.localPort = options.localPort || 0;
      this.kbuckets = {};
      this.k = 16;
      this.publicIp = null;
      this.publicPort = null;
      
      // 初始引导节点列表
      this.bootstrapNodes = options.bootstrapNodes || [
        { address: 'router.bittorrent.com', port: 6881 },
        { address: 'dht.transmissionbt.com', port: 6881 },
        { address: 'router.utorrent.com', port: 6881 }
      ];
      
      // STUN服务器配置 - 在这里赋值
      this.stunServer = options.stunServer || 'stun.miwifi.com'; // 默认使用小米STUN服务器
      this.stunPort = options.stunPort || 3478; // 默认STUN端口
      
      this.socket = dgram.createSocket('udp4');
      // 将STUN服务器配置传递给StunClient
      this.stunClient = new StunClient(this.socket, this.stunServer, this.stunPort);
      
      this.connections = new Map();
      
      this.setupSocket();
    }

  async setupSocket() {
    await new Promise((resolve) => {
      this.socket.bind(this.localPort, resolve);
    });
    
    this.socket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        
        if (data.type === 'ping') {
          this.handlePing(data, rinfo);
        } else if (data.type === 'find_node') {
          this.handleFindNode(data, rinfo);
        } else if (data.type === 'find_node_response') {
          this.handleFindNodeResponse(data, rinfo);
        } else if (data.type === 'punch') {
          this.handleHolePunch(data, rinfo);
        } else if (data.type === 'data') {
          this.handleDataMessage(data, rinfo);
        }
      } catch (e) {
        // 忽略非JSON消息（可能是STUN响应）
      }
    });
    
    // 获取公网地址
    try {
      const publicAddress = await this.stunClient.getPublicAddress();
      this.publicIp = publicAddress.ip;
      this.publicPort = publicAddress.port;
      
      console.log(`Node ${this.id} public address: ${this.publicIp}:${this.publicPort}`);
      
      // 初始化k-buckets
      this.initKBuckets();
      
      // 加入DHT网络
      this.joinNetwork();
    } catch (e) {
      console.error('Failed to get public address:', e);
    }
  }

  initKBuckets() {
    // 初始化k-buckets（每个bit一个bucket）
    for (let i = 0; i < 160; i++) {
      this.kbuckets[i] = [];
    }
  }

  async joinNetwork() {
    // 尝试连接所有引导节点
    for (const node of this.bootstrapNodes) {
      try {
        await this.pingNode(node);
      } catch (e) {
        console.error(`Failed to ping bootstrap node ${node.address}:${node.port}:`, e);
      }
    }
    
    // 定期刷新k-buckets
    setInterval(() => this.refreshKBuckets(), 60000);
    
    // 定期发现新节点
    setInterval(() => this.discoverNodes(), 30000);
  }

  async pingNode(node) {
    const pingMessage = JSON.stringify({
      type: 'ping',
      id: this.id,
      publicIp: this.publicIp,
      publicPort: this.publicPort
    });
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
      
      const handler = (msg, rinfo) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type === 'pong' && data.id === node.id) {
            clearTimeout(timeout);
            this.socket.removeListener('message', handler);
            
            // 添加到k-bucket
            this.addNodeToKBucket({
              id: data.id,
              address: rinfo.address,
              port: rinfo.port,
              publicIp: data.publicIp,
              publicPort: data.publicPort
            });
            
            resolve();
          }
        } catch (e) {
          // 忽略解析错误
        }
      };
      
      this.socket.on('message', handler);
      
      this.socket.send(pingMessage, node.port, node.address, (err) => {
        if (err) {
          clearTimeout(timeout);
          this.socket.removeListener('message', handler);
          reject(err);
        }
      });
    });
  }

  handlePing(data, rinfo) {
    // 响应ping
    const pongMessage = JSON.stringify({
      type: 'pong',
      id: this.id,
      publicIp: this.publicIp,
      publicPort: this.publicPort
    });
    
    this.socket.send(pongMessage, rinfo.port, rinfo.address);
    
    // 添加到k-bucket
    this.addNodeToKBucket({
      id: data.id,
      address: rinfo.address,
      port: rinfo.port,
      publicIp: data.publicIp,
      publicPort: data.publicPort
    });
  }

  addNodeToKBucket(node) {
    // 计算距离（XOR距离）
    const distance = this.xorDistance(this.id, node.id);
    const bucketIndex = this.getBucketIndex(distance);
    
    // 检查是否已存在
    const bucket = this.kbuckets[bucketIndex];
    const existingIndex = bucket.findIndex(n => n.id === node.id);
    
    if (existingIndex !== -1) {
      // 更新现有节点
      bucket[existingIndex] = node;
    } else if (bucket.length < this.k) {
      // 添加新节点
      bucket.push(node);
    } else {
      // k-bucket已满，ping最旧节点
      const oldestNode = bucket[0];
      this.pingNode(oldestNode).then(() => {
        // 如果节点响应，移动到列表末尾
        bucket.shift();
        bucket.push(oldestNode);
      }).catch(() => {
        // 如果节点不响应，替换它
        bucket.shift();
        bucket.push(node);
      });
    }
  }

  xorDistance(id1, id2) {
    const buf1 = Buffer.from(id1, 'hex');
    const buf2 = Buffer.from(id2, 'hex');
    const result = Buffer.alloc(20);
    
    for (let i = 0; i < 20; i++) {
      result[i] = buf1[i] ^ buf2[i];
    }
    
    return result.toString('hex');
  }

  getBucketIndex(distance) {
    const distanceBuf = Buffer.from(distance, 'hex');
    let index = 0;
    
    for (let i = 0; i < 20; i++) {
      const byte = distanceBuf[i];
      if (byte === 0) continue;
      
      for (let j = 0; j < 8; j++) {
        if (byte & (0x80 >> j)) {
          return 159 - (i * 8 + j);
        }
      }
    }
    
    return 0;
  }

  async findNode(targetId) {
    // 查找距离targetId最近的k个节点
    const closestNodes = this.findClosestNodes(targetId);
    
    if (closestNodes.length === 0) {
      return [];
    }
    
    // 向每个节点发送find_node请求
    const promises = closestNodes.map(node => {
      return new Promise((resolve) => {
        const findNodeMessage = JSON.stringify({
          type: 'find_node',
          id: this.id,
          targetId: targetId
        });
        
        const timeout = setTimeout(() => {
          resolve([]);
        }, 5000);
        
        const handler = (msg, rinfo) => {
          try {
            const data = JSON.parse(msg.toString());
            if (data.type === 'find_node_response' && data.requesterId === this.id) {
              clearTimeout(timeout);
              this.socket.removeListener('message', handler);
              
              // 添加返回的节点到k-bucket
              data.nodes.forEach(n => this.addNodeToKBucket(n));
              
              resolve(data.nodes);
            }
          } catch (e) {
            // 忽略解析错误
          }
        };
        
        this.socket.on('message', handler);
        
        this.socket.send(findNodeMessage, node.port, node.address);
      });
    });
    
    // 等待所有响应
    const results = await Promise.all(promises);
    const allNodes = results.flat();
    
    // 返回最接近的k个节点
    return this.findClosestNodes(targetId, allNodes);
  }

  findClosestNodes(targetId, nodes = null) {
    const nodeList = nodes || this.getAllNodes();
    
    // 按距离排序
    nodeList.sort((a, b) => {
      const distA = this.xorDistance(targetId, a.id);
      const distB = this.xorDistance(targetId, b.id);
      return distA.localeCompare(distB);
    });
    // 返回前k个
    return nodeList.slice(0, this.k);
}

getAllNodes() {
  // 获取所有节点
  const allNodes = [];
  for (const bucket of Object.values(this.kbuckets)) {
    allNodes.push(...bucket);
  }
  return allNodes;
}

handleFindNode(data, rinfo) {
  // 查找距离targetId最近的k个节点
  const closestNodes = this.findClosestNodes(data.targetId);
  
  // 响应find_node请求
  const response = JSON.stringify({
    type: 'find_node_response',
    requesterId: data.id,
    nodes: closestNodes
  });
  
  this.socket.send(response, rinfo.port, rinfo.address);
  
  // 添加请求节点到k-bucket
  this.addNodeToKBucket({
    id: data.id,
    address: rinfo.address,
    port: rinfo.port,
    publicIp: data.publicIp,
    publicPort: data.publicPort
  });
}

handleFindNodeResponse(data, rinfo) {
  // 这个处理已经在findNode方法中通过监听器处理了
  // 这里不需要额外处理
}

async refreshKBuckets() {
  // 定期刷新k-buckets
  for (let i = 0; i < 160; i++) {
    if (this.kbuckets[i].length > 0) {
      // 生成一个随机ID，确保它在第i个bucket的范围内
      const randomId = this.generateRandomIdForBucket(i);
      
      // 查找这个ID的节点
      await this.findNode(randomId);
    }
  }
}

generateRandomIdForBucket(bucketIndex) {
  // 生成一个随机ID，确保它在指定bucket的范围内
  const id = Buffer.alloc(20);
  
  // 设置前导零的数量，使得ID落在指定的bucket中
  const leadingZeros = 159 - bucketIndex;
  const byteIndex = Math.floor(leadingZeros / 8);
  const bitIndex = leadingZeros % 8;
  
  // 设置第byteIndex字节的第bitIndex位为1，其余为0
  id[byteIndex] = 0x80 >> bitIndex;
  
  // 随机填充剩余字节
  for (let i = byteIndex + 1; i < 20; i++) {
    id[i] = Math.floor(Math.random() * 256);
  }
  
  return id.toString('hex');
}

async discoverNodes() {
  // 发现新节点
  const randomId = crypto.randomBytes(20).toString('hex');
  const closestNodes = await this.findNode(randomId);
  
  // 尝试与发现的节点建立连接
  for (const node of closestNodes) {
    this.initiateHolePunch(node);
  }
}

initiateHolePunch(remoteNode) {
  console.log(`Initiating hole punch to ${remoteNode.id} at ${remoteNode.publicIp}:${remoteNode.publicPort}`);
  
  // 发送打洞请求
  const punchMessage = JSON.stringify({
    type: 'punch',
    from: {
      id: this.id,
      ip: this.publicIp,
      port: this.publicPort
    }
  });
  
  this.socket.send(punchMessage, remoteNode.publicPort, remoteNode.publicIp);
  
  // 记录连接尝试
  this.connections.set(remoteNode.id, {
    nodeId: remoteNode.id,
    address: remoteNode.publicIp,
    port: remoteNode.publicPort,
    status: 'punching'
  });
}

handleHolePunch(data, rinfo) {
  console.log(`Received hole punch from ${data.from.id} at ${rinfo.address}:${rinfo.port}`);
  
  // 回应打洞请求
  const response = JSON.stringify({
    type: 'punch',
    from: {
      id: this.id,
      ip: this.publicIp,
      port: this.publicPort
    }
  });
  
  this.socket.send(response, rinfo.port, rinfo.address);
  
  // 建立连接
  this.connections.set(data.from.id, {
    nodeId: data.from.id,
    address: rinfo.address,
    port: rinfo.port,
    status: 'connected'
  });
  
  console.log(`Connection established with ${data.from.id}`);
}

handleDataMessage(data, rinfo) {
  console.log(`Received data from ${data.from}: ${data.message}`);
  
  // 可以在这里处理业务逻辑
  // 例如: 回显消息
  this.sendData(data.from, `Echo: ${data.message}`);
}

sendData(nodeId, message) {
  const connection = this.connections.get(nodeId);
  if (connection && connection.status === 'connected') {
    const dataMessage = JSON.stringify({
      type: 'data',
      from: this.id,
      message: message
    });
    
    this.socket.send(dataMessage, connection.port, connection.address);
    console.log(`Sent data to ${nodeId}: ${message}`);
  } else {
    console.error(`No active connection to node ${nodeId}`);
  }
}

broadcast(message) {
  this.connections.forEach((connection, nodeId) => {
    if (connection.status === 'connected') {
      this.sendData(nodeId, message);
    }
  });
}

listConnections() {
  console.log('Active connections:');
  this.connections.forEach((conn, id) => {
    console.log(`- ${id} at ${conn.address}:${conn.port} (${conn.status})`);
  });
}

listKBuckets() {
  console.log('K-buckets:');
  for (let i = 0; i < 160; i++) {
    if (this.kbuckets[i].length > 0) {
      console.log(`Bucket ${i}: ${this.kbuckets[i].length} nodes`);
      this.kbuckets[i].forEach(node => {
        console.log(`  - ${node.id} at ${node.publicIp}:${node.publicPort}`);
      });
    }
  }
}
}

module.exports = DHTNode;