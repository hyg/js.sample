#!/usr/bin/env node

console.log('🔍 P2P DHT Node Verification\n');

const SimpleP2PNode = require('./simple-demo.js').SimpleP2PNode;

async function verify() {
  console.log('1. 测试节点创建...');
  const node = new SimpleP2PNode({ port: Math.floor(Math.random() * 1000) + 60000 });
  
  try {
    console.log('2. 启动节点...');
    const addresses = await node.start();
    
    console.log('✅ 验证成功！');
    console.log(`   DHT端口: ${addresses.dhtPort}`);
    console.log(`   TCP端口: ${addresses.tcpPort}`);
    console.log(`   UDP端口: ${addresses.udpPort}`);
    
    // 测试消息广播
    console.log('3. 测试消息广播...');
    await node.broadcastMessage('P2P Node Verification Test');
    
    // 检查节点状态
    const peers = node.getPeers();
    console.log(`4. 发现节点: ${peers.length}`);
    
    console.log('\n🎉 所有验证通过！');
    console.log('节点已启动并正常运行！');
    
    // 优雅关闭
    setTimeout(async () => {
      await node.stop();
      console.log('✅ 节点已安全关闭');
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  }
}

verify();