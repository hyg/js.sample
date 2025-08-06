// DHT Discovery module - for peer discovery using DHT
const DHT = require('bittorrent-dht');
const crypto = require('crypto');

class DHTDiscovery {
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
    this.meetingTopic = null;
    this.pendingLookups = new Map(); // Track pending lookups to prevent duplicates
  }

  // 启动DHT节点
  async start(meetingCode) {
    return new Promise((resolve, reject) => {
      if (this.isStarted) {
        resolve();
        return;
      }

      try {
        // 为会议生成主题哈希
        this.meetingTopic = crypto.createHash('sha256').update(meetingCode).digest();
        
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
      // Clear pending lookups
      this.pendingLookups.clear();
    }
  }

  // 在DHT中公告节点信息
  announceNode(port) {
    if (!this.dht || !this.isStarted || !this.meetingTopic) {
      console.warn('DHT未启动或未准备好，无法发布节点信息');
      return;
    }

    // 公告节点信息到DHT，使用会议主题
    this.dht.announce(this.meetingTopic, port, (err) => {
      if (err) {
        console.error('公告DHT节点信息失败:', err);
      } else {
        if (this.debug) {
          console.log(`成功公告节点信息，主题: ${this.meetingTopic.toString('hex')}, 端口: ${port}`);
        }
      }
    });
  }

  // 查找相同会议的节点
  findMeetingPeers() {
    return new Promise((resolve, reject) => {
      if (!this.dht || !this.isStarted || !this.meetingTopic) {
        reject(new Error('DHT未启动或未设置会议主题'));
        return;
      }

      // Check if we already have a pending lookup for this topic
      const lookupId = this.meetingTopic.toString('hex');
      if (this.pendingLookups.has(lookupId)) {
        // If there's already a lookup, wait for it to complete
        const existingLookup = this.pendingLookups.get(lookupId);
        existingLookup.push({ resolve, reject });
        return;
      }

      // Create a new lookup tracker
      const lookups = [{ resolve, reject }];
      this.pendingLookups.set(lookupId, lookups);

      // In bittorrent-dht, lookup returns a list of peers
      // The callback in lookup is not reliable, so we'll use a different approach
      this.dht.lookup(this.meetingTopic, (err, peers) => {
        // Remove lookup from pending
        this.pendingLookups.delete(lookupId);
        
        if (err) {
          reject(err);
        } else {
          // The lookup returns a list of peers (objects with host, port)
          resolve(peers || []);
        }
      });
    });
  }

  // 查找指定主题的节点信息 (improved version)
  findPeersByTopic(topicHash, callback) {
    if (!this.dht || !this.isStarted) {
      console.warn('DHT未启动或未准备好，无法查找节点');
      return;
    }
    
    // For better handling, we'll use a different approach
    this.dht.lookup(topicHash, (err, peers) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, peers || []);
      }
    });
  }

  // 获取DHT状态
  getStatus() {
    return {
      started: this.isStarted,
      nodeId: this.nodeId ? this.nodeId.toString('hex') : null,
      meetingTopic: this.meetingTopic ? this.meetingTopic.toString('hex') : null,
      port: this.port,
      bootstrapNodes: this.bootstrapNodes.length,
      debug: this.debug,
      pendingLookups: this.pendingLookups.size
    };
  }
}

module.exports = DHTDiscovery;