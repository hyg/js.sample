const P2PNode = require('./src/p2p-node');
const config = require('./config');

// Create multiple test nodes
const nodes = [];

async function createTestNode(port, dhtPort, topic) {
    const node = new P2PNode({
        port: port,
        dhtPort: dhtPort,
        topic: topic,
        ...config
    });
    
    node.on('started', (info) => {
        console.log(`Node ${port} started: ${info.nodeId.substring(0, 8)}...`);
    });
    
    node.on('peerDiscovered', (peer) => {
        console.log(`Node ${port} discovered peer: ${peer.id.substring(0, 8)}...`);
    });
    
    node.on('peerConnected', (peerId) => {
        console.log(`Node ${port} connected to: ${peerId.substring(0, 8)}...`);
    });
    
    node.on('message', (message) => {
        console.log(`Node ${port} received message from ${message.from.substring(0, 8)}...: ${message.payload.payload}`);
    });
    
    await node.start();
    nodes.push(node);
    return node;
}

async function testNetwork() {
    console.log('🧪 Starting P2P network test...');
    
    try {
        // Create 3 test nodes
        const node1 = await createTestNode(6881, 6882, 'test-network');
        const node2 = await createTestNode(6883, 6884, 'test-network');
        const node3 = await createTestNode(6885, 6886, 'test-network');
        
        // Wait for nodes to discover each other
        console.log('⏳ Waiting for nodes to discover each other...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Test messaging
        console.log('📨 Testing messaging...');
        
        // Send message from node1 to node2
        const peers2 = node2.getPeers();
        if (peers2.length > 0) {
            await node1.sendMessage(peers2[0].id, {
                type: 'test',
                payload: 'Hello from node 1!',
                timestamp: Date.now()
            });
        }
        
        // Test broadcast from node3
        await node3.broadcast({
            type: 'broadcast-test',
            payload: 'Broadcast message from node 3',
            timestamp: Date.now()
        });
        
        // Wait for message delivery
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Show network status
        console.log('📊 Network Status:');
        nodes.forEach((node, index) => {
            const stats = node.getStats();
            console.log(`  Node ${index + 1}: ${stats.connectedPeers} connections, ${stats.peers} peers known`);
        });
        
        // Cleanup
        console.log('🧹 Cleaning up...');
        for (const node of nodes) {
            await node.stop();
        }
        
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        // Cleanup on error
        for (const node of nodes) {
            await node.stop();
        }
    }
}

// Run test if called directly
if (require.main === module) {
    testNetwork().catch(console.error);
}

module.exports = { createTestNode, testNetwork };