const DHT = require('bittorrent-dht');
const net = require('net');
const dgram = require('dgram');
const crypto = require('crypto');

class SimpleP2PNode {
  constructor(options = {}) {
    this.port = options.port || 6881;
    this.magnetUri = options.magnetUri || 'magnet:?xt=urn:btih:1234567890abcdef';
    this.nodeId = crypto.randomBytes(20);
    
    this.dht = new DHT();
    this.tcpServer = null;
    this.udpSocket = null;
    this.peers = new Set();
    this.isRunning = false;
  }

  async start() {
    console.log('🚀 Starting simple P2P node...');
    
    // 启动DHT
    await new Promise((resolve, reject) => {
      this.dht.listen(this.port, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log(`✓ DHT listening on port ${this.port}`);
    console.log(`✓ Node ID: ${this.nodeId.toString('hex')}`);

    // 启动TCP服务器
    this.tcpServer = net.createServer((socket) => {
      console.log(`📡 TCP connection from ${socket.remoteAddress}:${socket.remotePort}`);
      socket.on('data', (data) => {
        console.log(`📥 TCP message: ${data.toString()}`);
      });
    });

    await new Promise((resolve) => {
      this.tcpServer.listen(0, () => {
        resolve();
      });
    });

    // 启动UDP服务器
    this.udpSocket = dgram.createSocket('udp4');
    
    this.udpSocket.on('message', (msg, rinfo) => {
      console.log(`📨 UDP message from ${rinfo.address}:${rinfo.port}: ${msg.toString()}`);
    });

    await new Promise((resolve) => {
      this.udpSocket.bind(0, () => {
        resolve();
      });
    });

    // 加入DHT网络
    const infoHash = crypto.createHash('sha1').update(this.magnetUri).digest();
    this.dht.lookup(infoHash);
    
    this.dht.on('peer', (peer) => {
      console.log(`🎯 Discovered peer: ${peer.host}:${peer.port}`);
      this.peers.add(`${peer.host}:${peer.port}`);
    });

    this.isRunning = true;
    console.log('✅ Simple P2P node started successfully!');
    console.log(`   TCP Port: ${this.tcpServer.address().port}`);
    console.log(`   UDP Port: ${this.udpSocket.address().port}`);
    console.log(`   DHT Port: ${this.port}`);
    
    return {
      tcpPort: this.tcpServer.address().port,
      udpPort: this.udpSocket.address().port,
      dhtPort: this.port
    };
  }

  async sendMessage(host, port, message, protocol = 'tcp') {
    if (protocol === 'tcp') {
      const client = new net.Socket();
      client.connect(port, host, () => {
        client.write(message);
        client.end();
      });
    } else {
      this.udpSocket.send(message, port, host);
    }
  }

  async broadcastMessage(message) {
    console.log(`📢 Broadcasting message to ${this.peers.size} peers...`);
    for (const peer of this.peers) {
      const [host, port] = peer.split(':');
      await this.sendMessage(host, parseInt(port), message, 'udp');
    }
  }

  getPeers() {
    return Array.from(this.peers);
  }

  async stop() {
    console.log('🔄 Stopping simple P2P node...');
    
    if (this.dht) this.dht.destroy();
    if (this.tcpServer) this.tcpServer.close();
    if (this.udpSocket) this.udpSocket.close();
    
    this.isRunning = false;
    console.log('✅ P2P node stopped');
  }
}

// 演示程序
async function runSimpleDemo() {
  console.log('🧪 Simple P2P Node Demo\n');
  
  const node = new SimpleP2PNode({ port: Math.floor(Math.random() * 1000) + 60000 });
  
  try {
    const addresses = await node.start();
    console.log(`\n🎯 Node ready at:`);
    console.log(`   TCP: ${addresses.tcpPort}`);
    console.log(`   UDP: ${addresses.udpPort}`);
    console.log(`   DHT: ${addresses.dhtPort}`);
    
    // 创建测试交互
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n🎮 Commands:');
    console.log('  peers - List discovered peers');
    console.log('  send <host> <port> <message> - Send message');
    console.log('  broadcast <message> - Broadcast to all');
    console.log('  quit - Stop node');
    
    rl.setPrompt('demo> ');
    rl.prompt();

    rl.on('line', async (input) => {
      const [cmd, ...args] = input.trim().split(' ');
      
      switch (cmd) {
        case 'peers':
          const peers = node.getPeers();
          console.log(`📊 Discovered ${peers.length} peers:`);
          peers.forEach(p => console.log(`  ${p}`));
          break;
          
        case 'send':
          if (args.length >= 3) {
            const [host, port, ...msgParts] = args;
            const message = msgParts.join(' ');
            await node.sendMessage(host, parseInt(port), message);
            console.log(`📤 Sent to ${host}:${port}`);
          } else {
            console.log('Usage: send <host> <port> <message>');
          }
          break;
          
        case 'broadcast':
          const message = args.join(' ');
          await node.broadcastMessage(message);
          console.log('📢 Broadcasted to all peers');
          break;
          
        case 'quit':
          await node.stop();
          process.exit(0);
          break;
          
        default:
          console.log('Unknown command');
      }
      
      rl.prompt();
    });

    // 自动演示
    setTimeout(async () => {
      console.log('\n🔄 Auto-demo: Broadcasting test message...');
      await node.broadcastMessage('Hello from P2P demo node!');
    }, 3000);

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSimpleDemo();
}

module.exports = { SimpleP2PNode, runSimpleDemo };