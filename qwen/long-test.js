const { SimpleP2PNode } = require('./simple-demo');

async function runLongTest() {
  console.log('🚀 开始长时间P2P节点测试...');
  
  // 启动第一个节点
  console.log('\n=== 启动第一个节点 ===');
  const node1 = new SimpleP2PNode({ 
    port: 6881,
    magnetUri: 'magnet:?xt=urn:btih:test1234567890123456789012345678901234567890'
  });
  
  const addr1 = await node1.start();
  console.log(`✅ 节点1启动成功:`);
  console.log(`   TCP端口: ${addr1.tcpPort}`);
  console.log(`   UDP端口: ${addr1.udpPort}`);
  console.log(`   DHT端口: ${addr1.dhtPort}`);
  
  // 等待几秒后再启动第二个节点
  console.log('\n等待5秒后启动第二个节点...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 启动第二个节点
  console.log('\n=== 启动第二个节点 ===');
  const node2 = new SimpleP2PNode({ 
    port: 6882,
    magnetUri: 'magnet:?xt=urn:btih:test1234567890123456789012345678901234567890'
  });
  
  const addr2 = await node2.start();
  console.log(`✅ 节点2启动成功:`);
  console.log(`   TCP端口: ${addr2.tcpPort}`);
  console.log(`   UDP端口: ${addr2.udpPort}`);
  console.log(`   DHT端口: ${addr2.dhtPort}`);
  
  // 定期检查节点发现情况
  console.log('\n=== 开始监控节点发现过程 ===');
  const startTime = Date.now();
  const duration = 60000; // 运行60秒
  
  const checkInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const elapsedSec = Math.floor(elapsed / 1000);
    
    const peers1 = node1.getPeers();
    const peers2 = node2.getPeers();
    
    console.log(`\n[${elapsedSec}s] 节点发现状态:`);
    console.log(`  节点1发现的节点数: ${peers1.length}`);
    console.log(`  节点2发现的节点数: ${peers2.length}`);
    
    if (peers1.length > 0) {
      console.log(`  节点1发现的节点: ${Array.from(peers1).join(', ')}`);
    }
    
    if (peers2.length > 0) {
      console.log(`  节点2发现的节点: ${Array.from(peers2).join(', ')}`);
    }
    
    // 如果两个节点都发现了对方，进行通信测试
    if (peers1.length > 0 && peers2.length > 0) {
      console.log('\n🎉 两个节点已互相发现！开始应用层通信测试...');
      
      // 尝试发送消息
      const testMessage = 'Hello from Node 1!';
      node1.broadcastMessage(testMessage);
      console.log(`📤 节点1广播消息: "${testMessage}"`);
      
      clearInterval(checkInterval);
    }
    
    // 如果超时，停止测试
    if (elapsed > duration) {
      clearInterval(checkInterval);
      console.log('\n⏰ 测试时间结束');
    }
  }, 10000); // 每10秒检查一次
  
  // 在测试结束后清理
  setTimeout(async () => {
    console.log('\n=== 停止测试 ===');
    await node1.stop();
    await node2.stop();
    console.log('✅ 测试完成');
    process.exit(0);
  }, duration + 5000);
}

// 运行测试
if (require.main === module) {
  runLongTest().catch(console.error);
}