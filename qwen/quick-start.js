#!/usr/bin/env node

const P2PNode = require('./src/index');

console.log('🚀 P2P DHT Node - Quick Start\n');

const node = new P2PNode({
  network: {
    magnetUri: 'magnet:?xt=urn:btih:p2p-demo-network-2025',
    tcpPort: 8080,
    udpPort: 8081,
    dhtPort: 6881,
    natTraversal: false
  }
});

async function start() {
  try {
    await node.start();
    
    // 创建测试文件
    const fs = require('fs-extra');
    await fs.ensureDir('./shared');
    await fs.writeFile('./shared/hello-p2p.txt', 
      `Hello from P2P Node!
      Created: ${new Date().toISOString()}
      Node ID: ${node.cryptoManager?.getNodeId?.() || 'demo-node'}`
    );
    
    if (node.fileTransfer) {
      await node.fileTransfer.addSharedFile('./shared/hello-p2p.txt');
      console.log('✅ Test file shared: hello-p2p.txt');
    }
    
    console.log('\n🎉 Node is running! Try these commands:');
    console.log('   help    - Show all commands');
    console.log('   status  - Show node status');
    console.log('   files   - List shared files');
    console.log('   peers   - List discovered peers');
    console.log('   quit    - Stop the node');
    
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
}

start();