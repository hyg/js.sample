const EventEmitter = require('events');

class NetworkMonitor extends EventEmitter {
  constructor(nodeManager) {
    super();
    this.nodeManager = nodeManager;
    this.stats = {
      startTime: Date.now(),
      messages: {
        sent: 0,
        received: 0,
        failed: 0
      },
      connections: {
        tcp: new Map(),
        udp: new Map()
      },
      bandwidth: {
        upload: 0,
        download: 0,
        lastReset: Date.now()
      },
      latency: new Map(),
      uptime: 0
    };

    this.startMonitoring();
  }

  startMonitoring() {
    // 每秒更新统计
    setInterval(() => {
      this.updateStats();
    }, 1000);

    // 每5分钟计算延迟
    setInterval(() => {
      this.measureLatency();
    }, 300000);

    this.setupEventTracking();
  }

  setupEventTracking() {
    // 监听消息事件
    if (this.nodeManager.tcpTransport) {
      this.nodeManager.tcpTransport.on('message', (message) => {
        this.recordMessage('tcp', 'received', message);
      });
    }

    if (this.nodeManager.udpTransport) {
      this.nodeManager.udpTransport.on('message', (message) => {
        this.recordMessage('udp', 'received', message);
      });
    }

    // 监听节点管理器事件
    if (this.nodeManager) {
      this.nodeManager.on('message-sent', (protocol) => {
        this.stats.messages.sent++;
      });

      this.nodeManager.on('message-failed', () => {
        this.stats.messages.failed++;
      });
    }
  }

  recordMessage(protocol, direction, message) {
    const size = JSON.stringify(message).length;
    
    if (direction === 'received') {
      this.stats.messages.received++;
      this.stats.bandwidth.download += size;
    } else {
      this.stats.messages.sent++;
      this.stats.bandwidth.upload += size;
    }

    // 记录连接信息
    const source = message.from || 'unknown';
    if (!this.stats.connections[protocol].has(source)) {
      this.stats.connections[protocol].set(source, {
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        messages: 0,
        bytes: 0
      });
    }

    const conn = this.stats.connections[protocol].get(source);
    conn.lastSeen = Date.now();
    conn.messages++;
    conn.bytes += size;
  }

  updateStats() {
    this.stats.uptime = Date.now() - this.stats.startTime;
    
    // 清理过期连接
    const now = Date.now();
    const timeout = 300000; // 5分钟
    
    ['tcp', 'udp'].forEach(protocol => {
      for (const [source, conn] of this.stats.connections[protocol]) {
        if (now - conn.lastSeen > timeout) {
          this.stats.connections[protocol].delete(source);
        }
      }
    });
  }

  async measureLatency() {
    const discoveredNodes = this.nodeManager.getDiscoveredNodes();
    
    for (const node of discoveredNodes) {
      const startTime = Date.now();
      
      try {
        // 发送ping消息
        const pingMessage = {
          type: 'ping',
          timestamp: startTime
        };

        await this.nodeManager.sendMessage(
          node.protocol || 'tcp',
          node.addresses.tcp?.address || node.addresses.udp?.address,
          node.addresses.tcp?.port || node.addresses.udp?.port,
          JSON.stringify(pingMessage)
        );

        // 设置超时
        setTimeout(() => {
          this.stats.latency.set(node.nodeId, null); // 超时
        }, 5000);

      } catch (error) {
        this.stats.latency.set(node.nodeId, null);
      }
    }
  }

  // 记录ping响应
  recordPingResponse(nodeId, originalTimestamp) {
    const latency = Date.now() - originalTimestamp;
    this.stats.latency.set(nodeId, latency);
    this.emit('latency-updated', { nodeId, latency });
  }

  // 获取实时统计
  getRealtimeStats() {
    const now = Date.now();
    const activeConnections = {
      tcp: this.stats.connections.tcp.size,
      udp: this.stats.connections.udp.size,
      total: this.stats.connections.tcp.size + this.stats.connections.udp.size
    };

    const discoveredNodes = this.nodeManager.getDiscoveredNodes().length;
    
    return {
      uptime: this.formatDuration(this.stats.uptime),
      messages: this.stats.messages,
      connections: activeConnections,
      discovered: discoveredNodes,
      bandwidth: {
        upload: this.formatBytes(this.stats.bandwidth.upload),
        download: this.formatBytes(this.stats.bandwidth.download),
        total: this.formatBytes(this.stats.bandwidth.upload + this.stats.bandwidth.download)
      },
      latency: this.getLatencyStats()
    };
  }

  // 获取延迟统计
  getLatencyStats() {
    const latencies = Array.from(this.stats.latency.values()).filter(l => l !== null);
    
    if (latencies.length === 0) {
      return { average: null, min: null, max: null, count: 0 };
    }

    const sum = latencies.reduce((a, b) => a + b, 0);
    return {
      average: Math.round(sum / latencies.length),
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      count: latencies.length
    };
  }

  // 获取连接详细信息
  getConnectionDetails() {
    const tcpConnections = Array.from(this.stats.connections.tcp.entries()).map(([source, data]) => ({
      source,
      protocol: 'tcp',
      firstSeen: new Date(data.firstSeen).toLocaleTimeString(),
      lastSeen: new Date(data.lastSeen).toLocaleTimeString(),
      messages: data.messages,
      bytes: this.formatBytes(data.bytes)
    }));

    const udpConnections = Array.from(this.stats.connections.udp.entries()).map(([source, data]) => ({
      source,
      protocol: 'udp',
      firstSeen: new Date(data.firstSeen).toLocaleTimeString(),
      lastSeen: new Date(data.lastSeen).toLocaleTimeString(),
      messages: data.messages,
      bytes: this.formatBytes(data.bytes)
    }));

    return [...tcpConnections, ...udpConnections];
  }

  // 重置带宽统计
  resetBandwidthStats() {
    this.stats.bandwidth.upload = 0;
    this.stats.bandwidth.download = 0;
    this.stats.bandwidth.lastReset = Date.now();
    this.emit('bandwidth-reset');
  }

  // 获取网络健康状态
  getHealthStatus() {
    const stats = this.getRealtimeStats();
    const connections = stats.connections.total;
    const discovered = stats.discovered;
    
    let status = 'healthy';
    let issues = [];

    if (connections === 0 && discovered > 0) {
      status = 'warning';
      issues.push('Discovered nodes but no active connections');
    }

    if (discovered === 0) {
      status = 'error';
      issues.push('No nodes discovered');
    }

    const avgLatency = stats.latency.average;
    if (avgLatency && avgLatency > 1000) {
      status = 'warning';
      issues.push('High network latency detected');
    }

    return {
      status,
      issues,
      connections,
      discovered
    };
  }

  // 生成网络拓扑图数据
  getNetworkTopology() {
    const nodes = new Set();
    const edges = [];

    // 添加本地节点
    const localNodeId = this.nodeManager.getNodeId();
    nodes.add(localNodeId);

    // 添加发现的节点和连接
    const discoveredNodes = this.nodeManager.getDiscoveredNodes();
    discoveredNodes.forEach(node => {
      nodes.add(node.nodeId.substring(0, 8));
      edges.push({
        from: localNodeId,
        to: node.nodeId.substring(0, 8),
        protocol: node.protocol || 'unknown',
        latency: this.stats.latency.get(node.nodeId)
      });
    });

    return {
      nodes: Array.from(nodes),
      edges
    };
  }

  // 格式化字节
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 格式化时间
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // 获取历史数据（模拟）
  getHistoricalData(hours = 24) {
    const now = Date.now();
    const data = [];
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = now - (i * 3600000);
      data.push({
        timestamp: new Date(timestamp).toISOString(),
        connections: Math.floor(Math.random() * 10) + 1,
        messages: Math.floor(Math.random() * 100) + 10,
        bandwidth: this.formatBytes(Math.random() * 1000000)
      });
    }
    
    return data;
  }
}

module.exports = NetworkMonitor;