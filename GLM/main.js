const DHTNode = require('./dht');

// 使用示例
(async () => {
  // 可以指定不同的引导节点列表
  const bootstrapNodes = [
    { address: 'router.bittorrent.com', port: 6881 },
    { address: 'dht.transmissionbt.com', port: 6881 },
    { address: 'router.utorrent.com', port: 6881 }
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