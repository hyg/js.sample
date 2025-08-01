// 客户端程序
const P2PNode = require('./node');
const config = require('./config');

async function main() {
  // 启动P2P节点
  console.log('启动P2P节点...');
  const node = new P2PNode();
  
  try {
    await node.start();
    
    // 定期查找节点
    setInterval(async () => {
      const peers = await node.findPeers();
      console.log(`发现 ${peers.length} 个节点`);
      
      // 尝试连接到新节点
      for (const peer of peers) {
        const peerId = `${peer.host}:${peer.port}`;
        if (!node.peers.has(peerId)) {
          try {
            await node.connectToPeer(peer);
          } catch (err) {
            console.error(`连接到节点失败 ${peerId}:`, err.message);
          }
        }
      }
    }, 30000); // 每30秒查找一次
    
    // 优雅关闭
    process.on('SIGINT', () => {
      console.log('\n正在关闭节点...');
      node.stop().then(() => {
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('启动节点失败:', err);
    process.exit(1);
  }
}

main();