// DHT模块 - 使用bittorrent-dht实现
const DHT = require('bittorrent-dht');
const crypto = require('crypto');
const config = require('./config');

class DHTNode {
  constructor(options = {}) {
    this.port = options.port || config.dht.port;
    this.nodeId = options.nodeId || this.generateNodeId();
    this.dht = null;
    this.peers = new Map(); // 存储发现的节点
  }

  // 生成节点ID
  generateNodeId() {
    return crypto.randomBytes(config.dht.nodeIdLength);
  }

  // 启动DHT节点
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.dht = new DHT({
          nodeId: this.nodeId,
          port: this.port
        });

        this.dht.listen(this.port, () => {
          console.log(`DHT节点监听在端口 ${this.port}`);
          
          // 监听节点发现事件
          this.dht.on('peer', (peer, infoHash, from) => {
            this.handlePeerDiscovery(peer, infoHash, from);
          });

          // 监听错误事件
          this.dht.on('error', (err) => {
            console.error('DHT错误:', err);
          });

          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
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
        infoHash: infoHash,
        discoveredFrom: from,
        discoveredAt: Date.now()
      });
    }
  }

  // 发布节点信息
  announce(infoHash, port) {
    if (this.dht) {
      this.dht.announce(infoHash, port, (err) => {
        if (err) {
          console.error('发布节点信息失败:', err);
        } else {
          console.log(`成功发布节点信息: ${infoHash.toString('hex')} on port ${port}`);
        }
      });
    }
  }

  // 查找节点
  lookup(infoHash) {
    return new Promise((resolve, reject) => {
      if (!this.dht) {
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
        if (hash.toString('hex') === infoHash.toString('hex')) {
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

  // 停止DHT节点
  stop() {
    if (this.dht) {
      this.dht.destroy();
    }
  }
}

module.exports = DHTNode;