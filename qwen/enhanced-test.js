const P2PNode = require('./src/index');

async function runEnhancedTest() {
  console.log('🚀 开始增强版P2P节点测试...');
  
  // 创建两个节点配置
  const node1Config = {
    magnetUri: 'magnet:?xt=urn:btih:test1234567890123456789012345678901234567890',
    tcpPort: 8080,
    udpPort: 8081,
    dhtPort: 6881
  };
  
  const node2Config = {
    magnetUri: 'magnet:?xt=urn:btih:test1234567890123456789012345678901234567890',
    tcpPort: 8082,
    udpPort: 8083,
    dhtPort: 6882
  };
  
  // 启动第一个节点
  console.log('\n=== 启动第一个节点 ===');
  const node1 = new P2PNode(node1Config);
  
  // 监听节点1的消息
  node1.nodeManager.on('message', (message) => {
    console.log(`📥 节点1收到消息:`, message);
  });
  
  await node1.start();
  console.log(`✅ 节点1启动成功`);
  
  // 等待几秒后再启动第二个节点
  console.log('\n等待5秒后启动第二个节点...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 启动第二个节点
  console.log('\n=== 启动第二个节点 ===');
  const node2 = new P2PNode(node2Config);
  
  // 监听节点2的消息
  node2.nodeManager.on('message', (message) => {
    console.log(`📥 节点2收到消息:`, message);
  });
  
  await node2.start();
  console.log(`✅ 节点2启动成功`);
  
  // 定期检查节点发现情况
  console.log('\n=== 开始监控节点发现过程 ===');
  const startTime = Date.now();
  const duration = 120000; // 运行120秒
  
  const checkInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const elapsedSec = Math.floor(elapsed / 1000);
    
    const nodes1 = node1.nodeManager.getDiscoveredNodes();
    const nodes2 = node2.nodeManager.getDiscoveredNodes();
    
    console.log(`\n[${elapsedSec}s] 节点发现状态:`);
    console.log(`  节点1发现的节点数: ${nodes1.length}`);
    console.log(`  节点2发现的节点数: ${nodes2.length}`);
    
    if (nodes1.length > 0) {
      console.log(`  节点1发现的节点:`);
      nodes1.forEach((node, index) => {
        console.log(`    ${index + 1}. ${node.nodeId.substring(0, 8)}...`);
        console.log(`       TCP: ${node.addresses.tcp?.address}:${node.addresses.tcp?.port}`);
        console.log(`       UDP: ${node.addresses.udp?.address}:${node.addresses.udp?.port}`);
      });
    }
    
    if (nodes2.length > 0) {
      console.log(`  节点2发现的节点:`);
      nodes2.forEach((node, index) => {
        console.log(`    ${index + 1}. ${node.nodeId.substring(0, 8)}...`);
        console.log(`       TCP: ${node.addresses.tcp?.address}:${node.addresses.tcp?.port}`);
        console.log(`       UDP: ${node.addresses.udp?.address}:${node.addresses.udp?.port}`);
      });
    }
    
    // 如果两个节点都发现了对方，进行通信测试
    if (nodes1.length > 0 && nodes2.length > 0) {
      console.log('\n🎉 两个节点已互相发现！开始应用层通信测试...');
      
      // 节点2向所有节点广播消息
      const testMessage = JSON.stringify({
        type: 'chat',
        from: 'Node2',
        message: 'Hello from Node 2!',
        timestamp: Date.now()
      });
      
      node2.nodeManager.broadcastMessage(testMessage)
        .then(() => {
          console.log(`📤 节点2广播消息成功`);
        })
        .catch((error) => {
          console.error(`❌ 节点2广播消息失败:`, error.message);
        });
    }
    
    // 如果超时，停止测试
    if (elapsed > duration) {
      clearInterval(checkInterval);
      console.log('\n⏰ 测试时间结束');
    }
  }, 15000); // 每15秒检查一次
  
  // 在测试结束后清理
  setTimeout(async () => {
    console.log('\n=== 停止测试 ===');
    // 注意：这里我们不实际停止节点，因为它们在独立进程中运行
    console.log('✅ 测试完成');
    process.exit(0);
  }, duration + 5000);
}

// 运行测试
if (require.main === module) {
  runEnhancedTest().catch(console.error);
}