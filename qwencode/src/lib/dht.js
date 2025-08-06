// DHT模块 - 使用bittorrent-dht实现
const DHT = require('bittorrent-dht');
const crypto = require('crypto');

class DHTNode {
  constructor(options = {}) {
    this.dht = null;
    this.isStarted = false;
    this.port = options.port || 6881;
    this.bootstrapNodes = options.bootstrapNodes || [
      { host: '34.197.35.250', port: 6880 },
      { host: '72.46.58.63', port: 51413 },
      { host: '46.53.251.68', port: 16970 },
      { host: '191.95.16.229', port: 55998 },
      { host: '79.173.94.111', port: 1438 },
      { host: '45.233.86.50', port: 61995 },
      { host: '178.162.174.28', port: 28013 },
      { host: '178.162.174.240', port: 28006 },
      { host: '72.21.17.101', port: 22643 },
      { host: '31.181.42.46', port: 22566 },
      { host: '67.213.106.46', port: 61956 },
      { host: '201.131.172.249', port: 53567 },
      { host: '185.203.152.184', port: 2003 },
      { host: '68.146.23.207', port: 42107 },
      { host: '51.195.222.183', port: 8653 },
      { host: '85.17.170.48', port: 28005 },
      { host: '87.98.162.88', port: 6881 },
      { host: '185.145.245.121', port: 8656 },
      { host: '52.201.45.189', port: 6880 }
    ];
    this.debug = options.debug || false;
  }

  // 启动DHT节点
  start() {
    return new Promise((resolve, reject) => {
      if (this.isStarted) {
        resolve();
        return;
      }

      try {
        // 使用随机字节生成节点ID，长度为20字节（符合DHT标准）
        this.nodeId = crypto.randomBytes(20);
        
        // 创建DHT实例
        this.dht = new DHT({
          nodeId: this.nodeId,
          host: '0.0.0.0',
          port: this.port,
          bootstrap: this.bootstrapNodes,
          debug: this.debug
        });

        // 监听DHT准备就绪事件
        this.dht.on('ready', () => {
          this.isStarted = true;
          if (this.debug) {
            console.log('DHT节点已准备就绪');
          }
          resolve();
        });

        // 监听DHT错误事件
        this.dht.on('error', (err) => {
          console.error('DHT错误:', err);
          reject(err);
        });

        // 监听DHT发现的节点事件
        this.dht.on('peer', (peer, infoHash, from) => {
          if (this.debug) {
            console.log(`发现DHT节点: ${peer.host}:${peer.port}`);
          }
        });

        // 启动DHT
        this.dht.listen(this.port, () => {
          if (this.debug) {
            console.log(`DHT节点监听在端口 ${this.port}`);
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // 停止DHT节点
  stop() {
    if (this.dht) {
      this.dht.destroy();
      this.isStarted = false;
    }
  }

  // 在DHT中公告节点信息
  announce(infoHash, port) {
    if (!this.dht || !this.isStarted) {
      console.warn('DHT未启动或未准备好，无法发布节点信息');
      return;
    }

    this.dht.announce(infoHash, port, (err) => {
      if (err) {
        console.error('公告DHT节点信息失败:', err);
      } else {
        if (this.debug) {
          console.log(`成功公告节点信息，主题: ${infoHash}, 端口: ${port}`);
        }
      }
    });
  }

  // 查找指定主题的节点
  lookup(infoHash) {
    return new Promise((resolve, reject) => {
      if (!this.dht || !this.isStarted) {
        reject(new Error('DHT未启动'));
        return;
      }

      this.dht.lookup(infoHash, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  // 查找指定主题的节点信息
  findPeers(infoHash, callback) {
    if (!this.dht || !this.isStarted) {
      console.warn('DHT未启动或未准备好，无法查找节点');
      return;
    }

    this.dht.on('peer', (peer, hash) => {
      if (hash.equals(infoHash)) {
        callback(null, peer);
      }
    });
    
    this.dht.lookup(infoHash);
  }

  // 获取DHT状态
  getStatus() {
    return {
      started: this.isStarted,
      nodeId: this.nodeId ? this.nodeId.toString('hex') : null,
      port: this.port,
      bootstrapNodes: this.bootstrapNodes.length,
      debug: this.debug
    };
  }
}

module.exports = DHTNode;