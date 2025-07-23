const NodeManager = require('./node-manager');
const NATManager = require('./nat-manager');
const CryptoManager = require('./crypto-manager');
const FileTransfer = require('./file-transfer');
const NetworkMonitor = require('./network-monitor');
const ConfigManager = require('./config-manager');

class P2PNode {
  constructor(options = {}) {
    this.configManager = new ConfigManager(options.configPath);
    this.config = this.configManager.config;
    
    // 合并配置和选项
    const mergedOptions = {
      ...this.config.network,
      ...this.config.security,
      ...this.config.fileTransfer,
      ...options
    };
    
    this.nodeManager = new NodeManager(mergedOptions);
    this.natManager = new NATManager(mergedOptions);
    this.cryptoManager = new CryptoManager(mergedOptions);
    this.fileTransfer = new FileTransfer(this.nodeManager, mergedOptions);
    this.networkMonitor = new NetworkMonitor(this.nodeManager);
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.nodeManager.on('message', (message) => {
      console.log('Received message:', {
        protocol: message.protocol,
        from: message.from,
        data: message.data
      });

      // 处理应用层消息
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'chat') {
          console.log(`[CHAT] ${data.from}: ${data.message}`);
        }
      } catch (e) {
        console.log('Raw message:', message.data);
      }
    });
  }

  async start() {
    try {
      console.log('Starting P2P node...');
      
      // 设置NAT端口映射
      if (this.config.network.natTraversal) {
        console.log('Setting up NAT port mapping...');
        await this.natManager.setupMappings({
          tcp: this.config.network.tcpPort,
          udp: this.config.network.udpPort,
          dht: this.config.network.dhtPort
        });
      }

      // 启动节点管理器
      await this.nodeManager.start();
      
      console.log(`✓ P2P Node started! Node ID: ${this.cryptoManager.getNodeId().substring(0, 8)}...`);
      console.log('\n=== Features Enabled ===');
      console.log(`✓ DHT Discovery: ${this.config.network.magnetUri.substring(0, 20)}...`);
      console.log(`✓ NAT Traversal: ${this.config.network.natTraversal ? 'Enabled' : 'Disabled'}`);
      console.log(`✓ Encryption: ${this.config.security.encryption ? 'Enabled' : 'Disabled'}`);
      console.log(`✓ File Transfer: ${this.config.fileTransfer.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`✓ Network Monitor: ${this.config.monitoring.enabled ? 'Enabled' : 'Disabled'}`);

      this.setupInteractiveMode();
      
    } catch (error) {
      console.error('Failed to start P2P node:', error);
      process.exit(1);
    }
  }

  setupInteractiveMode() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.setPrompt('p2p> ');
    rl.prompt();

    rl.on('line', async (input) => {
      const [command, ...args] = input.trim().split(' ');
      
      switch (command) {
        case 'peers':
          const peers = this.nodeManager.getDiscoveredNodes();
          console.log('Discovered peers:');
          peers.forEach((peer, index) => {
            console.log(`  ${index + 1}. ${peer.nodeId.substring(0, 8)}...`);
            console.log(`     TCP: ${peer.addresses.tcp?.address}:${peer.addresses.tcp?.port}`);
            console.log(`     UDP: ${peer.addresses.udp?.address}:${peer.addresses.udp?.port}`);
            console.log(`     Last seen: ${new Date(peer.lastSeen).toLocaleTimeString()}`);
          });
          break;

        case 'send':
          const message = args.join(' ');
          if (message) {
            const chatMessage = JSON.stringify({
              type: 'chat',
              from: this.nodeManager.getNodeId().substring(0, 8),
              message: message,
              timestamp: Date.now()
            });
            
            await this.nodeManager.broadcastMessage(chatMessage);
            console.log('Message sent to all peers');
          } else {
            console.log('Usage: send <message>');
          }
          break;

        case 'status':
          const addr = this.nodeManager.getLocalAddress();
          console.log('Node status:');
          console.log(`  Node ID: ${this.nodeManager.getNodeId()}`);
          console.log(`  TCP: ${addr.tcp.address}:${addr.tcp.port}`);
          console.log(`  UDP: ${addr.udp.address}:${addr.udp.port}`);
          console.log(`  DHT: ${addr.dht.address}:${addr.dht.port}`);
          console.log(`  Discovered nodes: ${this.nodeManager.getDiscoveredNodes().length}`);
          break;

        case 'help':
          this.showHelp();
          break;

        case 'peers':
          this.showPeers();
          break;

        case 'send':
          await this.handleSend(args);
          break;

        case 'status':
          this.showStatus();
          break;

        case 'files':
          this.showFiles();
          break;

        case 'share':
          await this.handleShare(args);
          break;

        case 'download':
          await this.handleDownload(args);
          break;

        case 'stats':
          this.showStats();
          break;

        case 'config':
          await this.handleConfig(args);
          break;

        case 'quit':
        case 'exit':
          await this.shutdown();
          break;

        default:
          console.log('Unknown command. Type "help" for available commands.');
      }

      rl.prompt();
    });

    rl.on('close', async () => {
      await this.shutdown();
    });
  }

  showHelp() {
    console.log(`
=== P2P Node Commands ===
Network:
  peers              - List discovered peers
  status             - Show node status
  stats              - Show network statistics

Messaging:
  send \<message\>      - Send message to all peers

File Transfer:
  files               - List available files
  share \<file-path\>   - Share a file
  download \<hash\> [node-id] - Download file by hash

Configuration:
  config show         - Show current configuration
  config get \<path\>   - Get configuration value
  config set \<path\> \<value\> - Set configuration value

System:
  quit/exit           - Stop the node and exit
    `);
  }

  showPeers() {
    const peers = this.nodeManager.getDiscoveredNodes();
    console.log('\n=== Discovered Peers ===');
    peers.forEach((peer, index) => {
      console.log(`  ${index + 1}. ${peer.nodeId.substring(0, 8)}...`);
      console.log(`     TCP: ${peer.addresses.tcp?.address}:${peer.addresses.tcp?.port}`);
      console.log(`     UDP: ${peer.addresses.udp?.address}:${peer.addresses.udp?.port}`);
      console.log(`     Last seen: ${new Date(peer.lastSeen).toLocaleTimeString()}`);
    });
  }

  async handleSend(args) {
    const message = args.join(' ');
    if (!message) {
      console.log('Usage: send <message>');
      return;
    }

    const chatMessage = JSON.stringify({
      type: 'chat',
      from: this.cryptoManager.getNodeId().substring(0, 8),
      message,
      timestamp: Date.now()
    });
    
    await this.nodeManager.broadcastMessage(chatMessage);
    console.log('✓ Message sent to all peers');
  }

  showStatus() {
    const addr = this.nodeManager.getLocalAddress();
    const stats = this.networkMonitor.getRealtimeStats();
    
    console.log('\n=== Node Status ===');
    console.log(`  Node ID: ${this.cryptoManager.getNodeId()}`);
    console.log(`  TCP: ${addr.tcp.address}:${addr.tcp.port}`);
    console.log(`  UDP: ${addr.udp.address}:${addr.udp.port}`);
    console.log(`  DHT: ${addr.dht.address}:${addr.dht.port}`);
    console.log(`  Uptime: ${stats.uptime}`);
    console.log(`  Discovered nodes: ${stats.discovered}`);
    console.log(`  Active connections: ${stats.connections.total}`);
    console.log(`  Messages: ${stats.messages.sent} sent, ${stats.messages.received} received`);
  }

  showFiles() {
    console.log('\n=== Shared Files ===');
    const sharedFiles = this.fileTransfer.getSharedFiles();
    sharedFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${this.fileTransfer.formatBytes(file.size)})`);
      console.log(`     Hash: ${file.hash}`);
      console.log(`     Chunks: ${file.chunks}`);
    });

    console.log('\n=== Available Files ===');
    const pendingFiles = this.fileTransfer.getPendingFiles();
    pendingFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${this.fileTransfer.formatBytes(file.size)})`);
      console.log(`     Hash: ${file.hash}`);
      console.log(`     From: ${file.sourceNodeId.substring(0, 8)}...`);
    });
  }

  async handleShare(args) {
    const filePath = args.join(' ');
    if (!filePath) {
      console.log('Usage: share <file-path>');
      return;
    }

    try {
      await this.fileTransfer.addSharedFile(filePath);
      console.log(`✓ File shared: ${filePath}`);
    } catch (error) {
      console.error('Failed to share file:', error.message);
    }
  }

  async handleDownload(args) {
    const [fileHash, targetNode] = args;
    if (!fileHash) {
      console.log('Usage: download <file-hash> [node-id]');
      return;
    }

    try {
      const pendingFiles = this.fileTransfer.getPendingFiles();
      const file = pendingFiles.find(f => f.hash === fileHash);
      
      if (!file) {
        console.log('File not found. Use "files" to see available files.');
        return;
      }

      await this.fileTransfer.downloadFile(fileHash, file.sourceNodeId);
      console.log(`✓ Started downloading: ${file.name}`);
    } catch (error) {
      console.error('Failed to download file:', error.message);
    }
  }

  showStats() {
    const stats = this.networkMonitor.getRealtimeStats();
    const health = this.networkMonitor.getHealthStatus();
    
    console.log('\n=== Network Statistics ===');
    console.log(`Health: ${health.status}`);
    if (health.issues.length > 0) {
      console.log(`Issues: ${health.issues.join(', ')}`);
    }
    
    console.log(`\nUptime: ${stats.uptime}`);
    console.log(`Connections: ${stats.connections.total} total`);
    console.log(`  TCP: ${stats.connections.tcp}, UDP: ${stats.connections.udp}`);
    console.log(`Messages: ${stats.messages.sent} sent, ${stats.messages.received} received, ${stats.messages.failed} failed`);
    console.log(`Bandwidth: ${stats.bandwidth.upload}↑ ${stats.bandwidth.download}↓`);
    console.log(`Latency: ${stats.latency.average || 'N/A'}ms average`);
  }

  async handleConfig(args) {
    const [subcommand, path, ...valueParts] = args;
    const value = valueParts.join(' ');

    switch (subcommand) {
      case 'show':
        console.log(JSON.stringify(this.configManager.config, null, 2));
        break;
      case 'get':
        if (!path) {
          console.log('Usage: config get <path>');
          return;
        }
        console.log(this.configManager.get(path));
        break;
      case 'set':
        if (!path || !value) {
          console.log('Usage: config set <path> <value>');
          return;
        }
        try {
          this.configManager.set(path, isNaN(value) ? value : Number(value));
          console.log('✓ Configuration updated');
        } catch (error) {
          console.error('Failed to update config:', error.message);
        }
        break;
      default:
        console.log('Config commands: show, get, set');
    }
  }

  async shutdown() {
    console.log('\n🔄 Shutting down P2P node...');
    
    console.log('  → Cleaning up NAT mappings...');
    await this.natManager.cleanup();
    
    console.log('  → Stopping node manager...');
    await this.nodeManager.stop();
    
    console.log('  → Saving configuration...');
    await this.configManager.saveConfig();
    
    console.log('✓ P2P node stopped gracefully');
    process.exit(0);
  }
}

// CLI入口
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // 解析命令行参数
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--tcp-port':
        options.tcpPort = parseInt(value);
        break;
      case '--udp-port':
        options.udpPort = parseInt(value);
        break;
      case '--dht-port':
        options.dhtPort = parseInt(value);
        break;
      case '--magnet':
        options.magnetUri = value;
        break;
    }
  }

  const node = new P2PNode(options);
  node.start();
}

module.exports = P2PNode;