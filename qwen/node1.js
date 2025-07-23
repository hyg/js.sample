#!/usr/bin/env node

// 节点1配置
const P2PNode = require('./src/index');

console.log('🚀 启动节点1...');

const node1 = new P2PNode({
  magnetUri: 'magnet:?xt=urn:btih:test1234567890123456789012345678901234567890',
  tcpPort: 8080,
  udpPort: 8081,
  dhtPort: 6881
});

// 移除交互模式，只保留核心功能
node1.setupEventHandlers = function() {
  this.nodeManager.on('message', (message) => {
    console.log('📥 节点1收到消息:', {
      protocol: message.protocol,
      from: message.from,
      data: message.data
    });
  });
};

// 重写启动后的行为，不进入交互模式
node1.setupInteractiveMode = function() {
  console.log('✅ 节点1已启动，等待发现其他节点...');
  
  // 定期检查发现的节点
  setInterval(() => {
    const nodes = this.nodeManager.getDiscoveredNodes();
    if (nodes.length > 0) {
      console.log(`🔍 节点1发现 ${nodes.length} 个节点:`);
      nodes.forEach((node, index) => {
        console.log(`  ${index + 1}. ${node.nodeId.substring(0, 8)}...`);
      });
      
      // 发送测试消息
      const testMessage = JSON.stringify({
        type: 'chat',
        from: 'Node1',
        message: 'Hello from Node 1!',
        timestamp: Date.now()
      });
      
      this.nodeManager.broadcastMessage(testMessage)
        .then(() => console.log('📤 节点1广播消息成功'))
        .catch((error) => console.error('❌ 节点1广播消息失败:', error.message));
    }
  }, 10000);
};

node1.start().catch(console.error);

// 30秒后自动停止
setTimeout(() => {
  console.log('⏱️  节点1测试时间结束');
  node1.shutdown().catch(console.error);
}, 30000);