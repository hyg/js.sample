'use strict';

const readline = require('readline');
const { createNode } = require('../index');
const debug = require('debug')('p2p-node:examples:chat');

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 用户名
let username = '';

// 创建P2P节点
const node = createNode({
  transport: {
    tcp: {
      port: process.env.PORT || 8000
    }
  }
});

// 处理节点事件
node.on('error', (err) => {
  console.error('Node error:', err);
});

node.on('started', (info) => {
  console.log(`\n=== P2P Chat Started ===`);
  console.log(`Node ID: ${info.id}`);
  console.log(`Public Address: ${info.publicAddress}:${info.publicPort}`);
  console.log(`===========================\n`);
  
  // 启动后提示用户输入用户名
  askUsername();
});

node.on('node:connected', (peer) => {
  console.log(`\n> Connected to peer: ${peer.id}`);
  promptUser();
});

node.on('node:disconnected', (peer) => {
  console.log(`\n> Disconnected from peer: ${peer.id}`);
  promptUser();
});

node.on('node:discovered', (peer) => {
  console.log(`\n> Discovered peer: ${peer.id} (${peer.address}:${peer.port})`);
  console.log(`> Node will automatically attempt to connect to discovered peer`);
  promptUser();
});

// 处理聊天消息
node.on('message', (message) => {
  if (message.type === 'chat') {
    const { from, payload } = message;
    console.log(`\n> [${payload.username}]: ${payload.text}`);
    promptUser();
  }
});

// 启动节点
async function startNode() {
  try {
    await node.start();
  } catch (err) {
    console.error('Failed to start node:', err);
    process.exit(1);
  }
}

// 询问用户名
function askUsername() {
  rl.question('Enter your username: ', (answer) => {
    username = answer.trim();
    if (!username) {
      console.log('Username cannot be empty!');
      return askUsername();
    }
    
    console.log(`\nWelcome, ${username}!`);
    console.log('Type /help for available commands');
    promptUser();
  });
}

// 显示命令提示符
function promptUser() {
  rl.prompt();
}

// 处理用户输入
rl.on('line', async (line) => {
  const input = line.trim();
  
  // 处理命令
  if (input.startsWith('/')) {
    const [command, ...args] = input.slice(1).split(' ');
    
    switch (command) {
      case 'help':
        showHelp();
        break;
        
      case 'connect':
        if (args.length < 2) {
          console.log('Usage: /connect <host> <port>');
          break;
        }
        
        const [host, port] = args;
        console.log(`Connecting to ${host}:${port}...`);
        
        try {
          await node.transport.connect(host, parseInt(port, 10));
          console.log(`Connected to ${host}:${port}`);
        } catch (err) {
          console.error(`Failed to connect: ${err.message}`);
        }
        break;
        
      case 'list':
        listPeers();
        break;
        
      case 'exit':
        await exitChat();
        return;
        
      default:
        console.log(`Unknown command: ${command}`);
        console.log('Type /help for available commands');
    }
  } else if (input) {
    // 发送聊天消息
    sendChatMessage(input);
  }
  
  promptUser();
});

// 显示帮助信息
function showHelp() {
  console.log('\nAvailable commands:');
  console.log('/connect <host> <port> - Connect to a peer');
  console.log('/list - List connected peers');
  console.log('/help - Show this help message');
  console.log('/exit - Exit the chat');
  console.log('\nTo send a message, just type and press Enter');
}

// 列出已连接的节点
function listPeers() {
  const connectedNodes = node.getConnectedNodes();
  const discoveredNodes = node.getDiscoveredNodes();
  
  console.log('\nConnected peers:');
  if (connectedNodes.length === 0) {
    console.log('  No connected peers');
  } else {
    connectedNodes.forEach((peer, i) => {
      console.log(`  ${i + 1}. ${peer.id} (${peer.address}:${peer.port})`);
    });
  }
  
  console.log('\nDiscovered peers:');
  if (discoveredNodes.length === 0) {
    console.log('  No discovered peers');
  } else {
    discoveredNodes.forEach((peer, i) => {
      console.log(`  ${i + 1}. ${peer.id} (${peer.address}:${peer.port})`);
    });
  }
}

// 发送聊天消息
async function sendChatMessage(text) {
  const connectedNodes = node.getConnectedNodes();
  
  if (connectedNodes.length === 0) {
    console.log('\nNo connected peers to send message to');
    return;
  }
  
  try {
    await node.broadcast('chat', {
      username,
      text,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error(`Failed to send message: ${err.message}`);
  }
}

// 退出聊天
async function exitChat() {
  console.log('\nExiting chat...');
  
  try {
    await node.stop();
  } catch (err) {
    console.error('Error stopping node:', err);
  }
  
  rl.close();
  process.exit(0);
}

// 处理进程退出
process.on('SIGINT', async () => {
  await exitChat();
});

// 启动聊天应用
startNode();

// 设置命令行提示符
rl.setPrompt('> ');