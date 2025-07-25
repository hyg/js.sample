const P2PNode = require('./main');

async function startNode() {
  // 使用国内可用的信令服务器
  const node = new P2PNode({
    roomId: 'test-room',
    signalingServer: process.argv[2] || 'https://your-china-signaling-server.com'
  });

  await node.initialize();

  // Example of sending a message after connection
  setTimeout(() => {
    const peers = node.listPeers();
    if (peers.length > 0) {
      node.sendMessage(peers[0], {
        type: 'test-message',
        content: 'Hello from node!',
        timestamp: Date.now()
      });
    } else {
      console.log('No peers connected yet');
    }
  }, 5000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down node...');
    node.disconnect();
    process.exit(0);
  });
}

startNode().catch(console.error);