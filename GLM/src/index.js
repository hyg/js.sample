const P2PNode = require('./p2p-node');

async function main() {
    const config = {
        port: process.argv[2] || 6881,
        dhtPort: process.argv[3] || 6882,
        topic: process.argv[4] || 'p2p-test-network'
    };
    
    const node = new P2PNode(config);
    
    // Setup event handlers
    node.on('started', (info) => {
        console.log('✓ Node started successfully');
        console.log('  Node ID:', info.nodeId);
        console.log('  Public endpoint:', info.publicEndpoint);
        console.log('  Listening on port:', config.port);
    });
    
    node.on('peerDiscovered', (peer) => {
        console.log('🔍 Peer discovered:', peer.id);
    });
    
    node.on('peerConnected', (peerId, connection) => {
        console.log('🔗 Connected to peer:', peerId);
    });
    
    node.on('peerDisconnected', (peerId) => {
        console.log('❌ Disconnected from peer:', peerId);
    });
    
    node.on('message', (message) => {
        console.log('📨 Message received:');
        console.log('  From:', message.from);
        console.log('  Type:', message.payload.type);
        console.log('  Content:', message.payload.payload);
    });
    
    node.on('messageSent', (info) => {
        console.log('📤 Message sent to:', info.to);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await node.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down...');
        await node.stop();
        process.exit(0);
    });
    
    try {
        // Start the node
        await node.start();
        
        // Setup interactive CLI
        setupInteractiveCLI(node);
        
    } catch (error) {
        console.error('❌ Failed to start node:', error);
        process.exit(1);
    }
}

function setupInteractiveCLI(node) {
    const readline = require('readline');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'p2p> '
    });
    
    console.log('\n🚀 P2P Node CLI - Type "help" for commands');
    rl.prompt();
    
    rl.on('line', async (input) => {
        const command = input.trim().split(' ');
        const cmd = command[0].toLowerCase();
        const args = command.slice(1);
        
        try {
            switch (cmd) {
                case 'help':
                    showHelp();
                    break;
                    
                case 'status':
                    console.log('📊 Node Status:', JSON.stringify(node.getStats(), null, 2));
                    break;
                    
                case 'peers':
                    const peers = node.getPeers();
                    console.log('👥 Connected Peers:', peers.length);
                    peers.forEach(peer => {
                        console.log(`  - ${peer.id} (${peer.address}:${peer.port})`);
                    });
                    break;
                    
                case 'send':
                    if (args.length < 2) {
                        console.log('❌ Usage: send <peerId> <message>');
                        break;
                    }
                    const [peerId, ...messageParts] = args;
                    const message = messageParts.join(' ');
                    await node.sendMessage(peerId, {
                        type: 'chat',
                        payload: message,
                        timestamp: Date.now()
                    });
                    console.log('✓ Message sent');
                    break;
                    
                case 'broadcast':
                    if (args.length === 0) {
                        console.log('❌ Usage: broadcast <message>');
                        break;
                    }
                    const broadcastMessage = args.join(' ');
                    await node.broadcast({
                        type: 'broadcast',
                        payload: broadcastMessage,
                        timestamp: Date.now()
                    });
                    console.log('✓ Message broadcasted');
                    break;
                    
                case 'info':
                    console.log('ℹ️  Node Information:');
                    console.log('  Node ID:', node.nodeId);
                    console.log('  Config:', node.config);
                    break;
                    
                case 'clear':
                    console.clear();
                    break;
                    
                case 'exit':
                case 'quit':
                    await node.stop();
                    process.exit(0);
                    
                default:
                    console.log('❌ Unknown command. Type "help" for available commands.');
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
        
        rl.prompt();
    });
    
    rl.on('close', async () => {
        console.log('\n🛑 Shutting down...');
        await node.stop();
        process.exit(0);
    });
}

function showHelp() {
    console.log(`
📚 Available Commands:
  help              - Show this help message
  status            - Show node status and statistics
  peers             - List connected peers
  send <id> <msg>   - Send message to specific peer
  broadcast <msg>   - Broadcast message to all peers
  info              - Show detailed node information
  clear             - Clear the screen
  exit/quit         - Exit the program

💡 Tips:
  - The node automatically discovers peers on the DHT network
  - Messages are encrypted end-to-end
  - NAT traversal is handled automatically
  - Use Ctrl+C to exit gracefully
`);
}

if (require.main === module) {
    main();
}

module.exports = { main, setupInteractiveCLI };