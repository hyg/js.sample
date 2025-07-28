const DHTNode = require('./dht');

// 使用示例
(async () => {
  // 可以指定不同的引导节点列表
  const bootstrapNodes = [
    { address: 'router.bittorrent.com', port: 6881 },
    { address: 'dht.transmissionbt.com', port: 6881 },
    { address: 'router.utorrent.com', port: 6881 },
    { address: '34.197.35.250', port: 6880 },
    { address: '72.46.58.63', port: 51413 },
    { address: '46.53.251.68', port: 16970 },
    { address: '191.95.16.229', port: 55998 },
    { address: '79.173.94.111', port: 1438 },
    { address: '45.233.86.50', port: 61995 },
    { address: '178.162.174.28', port: 28013 },
    { address: '178.162.174.240', port: 28006 },
    { address: '72.21.17.101', port: 22643 },
    { address: '31.181.42.46', port: 22566 },
    { address: '67.213.106.46', port: 61956 },
    { address: '201.131.172.249', port: 53567 },
    { address: '185.203.152.184', port: 2003 },
    { address: '68.146.23.207', port: 42107 },
    { address: '51.195.222.183', port: 8653 },
    { address: '85.17.170.48', port: 28005 },
    { address: '87.98.162.88', port: 6881 },
    { address: '185.145.245.121', port: 8656 },
    { address: '52.201.45.189', port: 6880 }
  ];

  // 创建节点时指定STUN服务器
  const node = new DHTNode({
    localPort: 0,
    bootstrapNodes: bootstrapNodes,
    stunServer: 'stun.miwifi.com',  // 在这里指定STUN服务器
    stunPort: 3478                   // 在这里指定STUN端口
  });
  
  // 模拟发送消息
  setTimeout(() => {
    node.listKBuckets();
    node.listConnections();
    node.broadcast('Hello from DHT network!');
  }, 30000);
  
  // 模拟接收消息
  process.stdin.on('data', (data) => {
    const message = data.toString().trim();
    if (message === 'exit') {
      process.exit(0);
    } else if (message === 'list') {
      node.listConnections();
    } else if (message === 'buckets') {
      node.listKBuckets();
    } else {
      node.broadcast(message);
    }
  });
})();