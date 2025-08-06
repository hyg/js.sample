// DHT模块 - 使用bittorrent-dht实现
const DHT = require('bittorrent-dht');
const crypto = require('crypto');
const config = require('./config');

class DHTNode {
  constructor(options = {}) {
    this.port = options.port || config.port;
    this.nodeId = options.nodeId || this.generateNodeId();
    this.dht = null;
    this.peers = new Map(); // 存储发现的节点
    this.bootstrapNodes = config.bootstrapNodes || [];
    this.isStarted = false;
  }

  // 生成节点ID
  generateNodeId() {
    // 使用随机字节生成节点ID，长度为20字节（符合DHT标准）
    return crypto.randomBytes(20);
  }

  // 启动DHT节点并连接到BOOTSTRAP节点
  async start() {
    return new Promise((resolve, reject) => {
      try {
        // 创建DHT实例
        this.dht = new DHT({
          nodeId: this.nodeId,
          port: this.port
        });

        // 启动监听
        this.dht.listen(this.port, () => {
          console.log(`DHT节点监听在端口 ${this.port}`);
          
          // 连接到BOOTSTRAP节点
          this.connectToBootstrapNodes()
            .then(() => {
              console.log('已连接到BOOTSTRAP节点');
              
              // 监听节点发现事件
              this.dht.on('peer', (peer, infoHash, from) => {
                this.handlePeerDiscovery(peer, infoHash, from);
              });

              // 监听错误事件
              this.dht.on('error', (err) => {
                console.error('DHT错误:', err);
              });

              this.isStarted = true;
              resolve();
            })
            .catch((err) => {
              console.error('连接BOOTSTRAP节点失败:', err);
              reject(err);
            });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // 连接到BOOTSTRAP节点
  async connectToBootstrapNodes() {
    if (!this.dht || this.bootstrapNodes.length === 0) {
      return;
    }

    // 逐个连接BOOTSTRAP节点
    for (let i = 0; i < this.bootstrapNodes.length; i++) {
      const node = this.bootstrapNodes[i];
      try {
        console.log(`连接BOOTSTRAP节点: ${node.host}:${node.port}`);
        
        // 使用DHT的添加节点方法连接到BOOTSTRAP节点
        this.dht.add(node.host, node.port);
        
        // 等待一段时间以确保连接建立
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.warn(`无法连接到BOOTSTRAP节点 ${node.host}:${node.port}:`, err.message);
      }
    }
  }

  // 处理节点发现
  handlePeerDiscovery(peer, infoHash, from) {
    const peerId = `${peer.host}:${peer.port}`;
    
    // 如果是新节点，添加到节点列表
    if (!this.peers.has(peerId)) {
      console.log(`发现新节点: ${peerId}`);
      this.peers.set(peerId, {
        host: peer.host,
        port: peer.port,
        infoHash: infoHash ? infoHash.toString('hex') : null,
        discoveredFrom: from ? from.host + ':' + from.port : null,
        discoveredAt: Date.now()
      });
    }
  }

  // 发布节点信息
  announce(infoHash, port) {
    if (this.dht && this.isStarted) {
      this.dht.announce(infoHash, port, (err) => {
        if (err) {
          console.error('发布节点信息失败:', err);
        } else {
          console.log(`成功发布节点信息: ${infoHash.toString('hex')} on port ${port}`);
        }
      });
    } else {
      console.warn('DHT未启动或未准备好，无法发布节点信息');
    }
  }

  // 查找节点
  lookup(infoHash) {
    return new Promise((resolve, reject) => {
      if (!this.dht || !this.isStarted) {
        reject(new Error('DHT未启动'));
        return;
      }

      const peers = [];
      const timeout = setTimeout(() => {
        resolve(peers);
      }, 10000); // 10秒超时

      this.dht.lookup(infoHash, (err, hash) => {
        if (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });

      this.dht.on('peer', (peer, hash) => {
        if (hash && hash.toString('hex') === infoHash.toString('hex')) {
          peers.push({
            host: peer.host,
            port: peer.port
          });
        }
      });
    });
  }

  // 获取节点列表
  getPeers() {
    return Array.from(this.peers.values());
  }

  // 获取节点连接状态
  getStatus() {
    return {
      isStarted: this.isStarted,
      nodeId: this.nodeId.toString('hex'),
      port: this.port,
      peerCount: this.peers.size,
      bootstrapNodes: this.bootstrapNodes.length
    };
  }

  // 停止DHT节点
  stop() {
    if (this.dht) {
      this.dht.destroy();
      this.isStarted = false;
    }
  }
}

module.exports = DHTNode;