#!/usr/bin/env node

// 节点2配置
const P2PNode = require('./src/index');

console.log('🚀 启动节点2...');

const node2 = new P2PNode({
  magnetUri: 'magnet:?xt=urn:btih:test1234567890123456789012345678901234567890',
  tcpPort: 8082,
  udpPort: 8083,
  dhtPort: 6882
});

// 移除交互模式，只保留核心功能
node2.setupEventHandlers = function() {
  this.nodeManager.on('message', (message) => {
    console.log('📥 节点2收到消息:', {
      protocol: message.protocol,
      from: message.from,
      data: message.data
    });
  });
};

// 重写启动后的行为，不进入交互模式
node2.setupInteractiveMode = function() {
  console.log('✅ 节点2已启动，等待发现其他节点...');
  
  // 定期检查发现的节点
  setInterval(() => {
    const nodes = this.nodeManager.getDiscoveredNodes();
    if (nodes.length > 0) {
      console.log(`🔍 节点2发现 ${nodes.length} 个节点:`);
      nodes.forEach((node, index) => {
        console.log(`  ${index + 1}. ${node.nodeId.substring(0, 8)}...`);
      });
      
      // 发送测试消息
      const testMessage = JSON.stringify({
        type: 'chat',
        from: 'Node2',
        message: 'Hello from Node 2!',
        timestamp: Date.now()
      });
      
      this.nodeManager.broadcastMessage(testMessage)
        .then(() => console.log('📤 节点2广播消息成功'))
        .catch((error) => console.error('❌ 节点2广播消息失败:', error.message));
    }
  }, 10000);
};

node2.start().catch(console.error);

// 30秒后自动停止
setTimeout(() => {
  console.log('⏱️  节点2测试时间结束');
  node2.shutdown().catch(console.error);
}, 30000);