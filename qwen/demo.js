const P2PNode = require('./src/index');

// 创建演示节点
async function runDemo() {
  console.log('🚀 P2P Node Demo - Starting...\n');
  
  const node = new P2PNode({
    network: {
      magnetUri: 'magnet:?xt=urn:btih:1234567890abcdef',
      tcpPort: 8080,
      udpPort: 8081,
      dhtPort: 6882,
      natTraversal: false  // 禁用NAT穿透以简化演示
    }
  });

  try {
    await node.start();
    
    console.log('\n📊 Demo Commands:');
    console.log('1. Check node status: node.showStatus()');
    console.log('2. List peers: node.showPeers()');
    console.log('3. Send test message: await node.nodeManager.broadcastMessage("{type:\"demo\",content:\"Hello from demo!\"}")');
    console.log('4. Show files: node.showFiles()');
    console.log('5. Stop: await node.shutdown()');
    
    // 演示一些基本操作
    console.log('\n📋 Running demo operations...');
    
    // 显示状态
    console.log('\n1. Node Status:');
    node.showStatus();
    
    // 尝试发送测试消息
    console.log('\n2. Sending test message...');
    await node.nodeManager.broadcastMessage(JSON.stringify({
      type: 'demo',
      content: 'Hello from P2P demo!',
      timestamp: Date.now()
    }));
    console.log('✓ Test message sent');
    
    // 显示统计
    console.log('\n3. Network Statistics:');
    node.showStats();
    
    // 创建测试文件用于文件传输演示
    console.log('\n4. Setting up file transfer demo...');
    const fs = require('fs-extra');
    const testFile = './demo-test.txt';
    await fs.writeFile(testFile, 'This is a test file for P2P demo\n' + new Date().toISOString());
    
    if (node.config.fileTransfer.enabled) {
      await node.fileTransfer.addSharedFile(testFile);
      console.log('✓ Test file shared for file transfer demo');
    }
    
    // 显示文件列表
    console.log('\n5. File Transfer Status:');
    node.showFiles();
    
    console.log('\n🎉 Demo completed! Node is running...');
    console.log('Press Ctrl+C to stop...');
    
    // 设置优雅关闭
    process.on('SIGINT', async () => {
      console.log('\n🔄 Shutting down demo...');
      await node.shutdown();
    });
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// 如果直接运行
if (require.main === module) {
  runDemo();
}

module.exports = { runDemo };