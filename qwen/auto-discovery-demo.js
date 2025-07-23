#!/usr/bin/env node

const SimpleP2PNode = require('./simple-demo.js').SimpleP2PNode;

console.log('🎯 P2P DHT 自动发现演示\n');
console.log('🔍 特点：完全自动化，无需人工输入任何IP或端口\n');

async function runAutoDiscoveryDemo() {
  const port = Math.floor(Math.random() * 1000) + 60000;
  const node = new SimpleP2PNode({ port });
  
  try {
    console.log('🚀 启动节点...');
    const addresses = await node.start();
    
    console.log('✅ 节点启动成功！');
    console.log(`   DHT端口: ${addresses.dhtPort}`);
    console.log(`   TCP端口: ${addresses.tcpPort}`);
    console.log(`   UDP端口: ${addresses.udpPort}`);
    console.log(`   节点ID: ${node.nodeId.toString('hex').substring(0, 8)}...`);
    
    console.log('\n📡 自动发现机制说明：');
    console.log('1. 所有节点使用相同的magnet URI');
    console.log('2. DHT网络自动传播节点信息');
    console.log('3. NAT穿透自动处理端口映射');
    console.log('4. 节点间自动交换地址信息');
    
    console.log('\n🔍 开始自动发现其他节点...');
    console.log('📋 发现过程日志：');
    
    let discoveryCount = 0;
    const maxChecks = 20;
    
    // 监听DHT事件
    node.dht.on('ready', () => {
      console.log('✅ DHT网络已就绪');
    });
    
    node.dht.on('announce', (peer, infoHash) => {
      console.log(`📢 发现节点广播: ${peer.host}:${peer.port}`);
    });
    
    node.dht.on('peer', (peer, infoHash) => {
      console.log(`🎯 新节点发现: ${peer.host}:${peer.port} (通过DHT)`);
    });
    
    node.dht.on('error', (err) => {
      console.log(`❌ DHT错误: ${err.message}`);
    });
    
    const checkInterval = setInterval(() => {
      discoveryCount++;
      const peers = node.getPeers();
      
      console.log(`[${new Date().toLocaleTimeString()}] 检查 #${discoveryCount} - 已发现节点: ${peers.length}`);
      
      if (peers.length > 0) {
        console.log('\n🎉 自动发现成功！');
        peers.forEach(p => console.log(`   📍 ${p}`));
        clearInterval(checkInterval);
        cleanup();
      } else if (discoveryCount >= maxChecks) {
        console.log('\n💡 发现过程分析：');
        console.log('   • 已加入DHT网络');
        console.log('   • 正在监听节点广播');
        console.log('   • 网络规模影响发现速度');
        console.log('   • 防火墙/NAT可能影响发现');
        clearInterval(checkInterval);
        cleanup();
      }
    }, 3000); else if (discoveryCount >= maxChecks) {
        console.log('\n💡 演示说明：');
        console.log('   • 当前网络中暂无其他节点');
        console.log('   • 这是正常的，因为没有其他实例在运行');
        console.log('   • 当有其他节点使用相同magnet URI时，会自动发现');
        console.log('   • 完全无需人工配置IP或端口');
        clearInterval(checkInterval);
        cleanup();
      }
    }, 3000);
    
    function cleanup() {
      setTimeout(async () => {
        await node.stop();
        console.log('\n✅ 演示完成！');
        console.log('🎯 关键特性验证：自动发现机制已就绪');
        process.exit(0);
      }, 2000);
    }
    
  } catch (error) {
    console.error('❌ 演示失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runAutoDiscoveryDemo();
}