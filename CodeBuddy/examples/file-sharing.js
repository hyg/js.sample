'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { createNode } = require('../index');
const debug = require('debug')('p2p-node:examples:file-sharing');

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 文件共享目录
const SHARE_DIR = path.join(__dirname, 'shared');

// 确保共享目录存在
if (!fs.existsSync(SHARE_DIR)) {
  fs.mkdirSync(SHARE_DIR, { recursive: true });
}

// 创建P2P节点
const node = createNode({
  transport: {
    tcp: {
      port: process.env.PORT || 8000
    }
  }
});

// 存储可用文件信息
const availableFiles = new Map();

// 存储正在进行的传输
const activeTransfers = new Map();

// 处理节点事件
node.on('error', (err) => {
  console.error('Node error:', err);
});

node.on('started', (info) => {
  console.log(`\n=== P2P File Sharing Started ===`);
  console.log(`Node ID: ${info.id}`);
  console.log(`Public Address: ${info.publicAddress}:${info.publicPort}`);
  console.log(`Shared Directory: ${SHARE_DIR}`);
  console.log(`================================\n`);
  
  // 扫描共享目录
  scanSharedDirectory();
  
  console.log('Type /help for available commands');
  promptUser();
});

node.on('node:connected', (peer) => {
  console.log(`\n> Connected to peer: ${peer.id}`);
  
  // 向新连接的节点发送文件列表
  sendFileList(peer.id);
  
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

// 处理文件共享消息
node.on('message', async (message) => {
  const { type, from, payload } = message;
  
  switch (type) {
    case 'file:list':
      // 收到文件列表
      handleFileList(from, payload);
      break;
      
    case 'file:request':
      // 收到文件请求
      handleFileRequest(from, payload);
      break;
      
    case 'file:data':
      // 收到文件数据
      handleFileData(from, payload);
      break;
      
    case 'file:complete':
      // 文件传输完成
      handleFileComplete(from, payload);
      break;
  }
  
  promptUser();
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

// 扫描共享目录
function scanSharedDirectory() {
  console.log('Scanning shared directory...');
  
  try {
    const files = fs.readdirSync(SHARE_DIR);
    
    // 清空文件列表
    availableFiles.clear();
    
    // 处理每个文件
    for (const file of files) {
      const filePath = path.join(SHARE_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        const fileId = crypto.createHash('sha1').update(file).digest('hex');
        
        availableFiles.set(fileId, {
          id: fileId,
          name: file,
          size: stats.size,
          path: filePath,
          owner: node.id
        });
      }
    }
    
    console.log(`Found ${availableFiles.size} files in shared directory`);
    
  } catch (err) {
    console.error('Error scanning shared directory:', err);
  }
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
          await node.connect(host, parseInt(port, 10));
          console.log(`Connected to ${host}:${port}`);
        } catch (err) {
          console.error(`Failed to connect: ${err.message}`);
        }
        break;
        
      case 'list':
        listFiles();
        break;
        
      case 'peers':
        listPeers();
        break;
        
      case 'download':
        if (args.length < 1) {
          console.log('Usage: /download <file-id>');
          break;
        }
        
        const fileId = args[0];
        downloadFile(fileId);
        break;
        
      case 'scan':
        scanSharedDirectory();
        break;
        
      case 'exit':
        await exitApp();
        return;
        
      default:
        console.log(`Unknown command: ${command}`);
        console.log('Type /help for available commands');
    }
  }
  
  promptUser();
});

// 显示帮助信息
function showHelp() {
  console.log('\nAvailable commands:');
  console.log('/connect <host> <port> - Connect to a peer');
  console.log('/list - List available files');
  console.log('/peers - List connected peers');
  console.log('/download <file-id> - Download a file');
  console.log('/scan - Scan shared directory for new files');
  console.log('/help - Show this help message');
  console.log('/exit - Exit the application');
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

// 列出可用文件
function listFiles() {
  console.log('\nAvailable files:');
  
  if (availableFiles.size === 0) {
    console.log('  No files available');
    return;
  }
  
  availableFiles.forEach((file) => {
    const sizeInKB = Math.round(file.size / 1024);
    console.log(`  ${file.id.substring(0, 8)} - ${file.name} (${sizeInKB} KB) [${file.owner === node.id ? 'Local' : 'Remote'}]`);
  });
}

// 发送文件列表
async function sendFileList(peerId) {
  const files = [];
  
  availableFiles.forEach((file) => {
    if (file.owner === node.id) {
      files.push({
        id: file.id,
        name: file.name,
        size: file.size
      });
    }
  });
  
  try {
    await node.send(peerId, 'file:list', { files });
    debug(`Sent file list to ${peerId}`);
  } catch (err) {
    debug(`Failed to send file list to ${peerId}:`, err);
  }
}

// 处理收到的文件列表
function handleFileList(peerId, payload) {
  const { files } = payload;
  
  debug(`Received file list from ${peerId}: ${files.length} files`);
  
  // 更新文件列表
  for (const file of files) {
    const fileId = file.id;
    
    if (!availableFiles.has(fileId)) {
      availableFiles.set(fileId, {
        ...file,
        owner: peerId
      });
    }
  }
  
  console.log(`\n> Received ${files.length} files from peer: ${peerId}`);
}

// 下载文件
async function downloadFile(fileId) {
  // 检查文件是否存在
  if (!availableFiles.has(fileId)) {
    console.log(`File with ID ${fileId} not found`);
    return;
  }
  
  const file = availableFiles.get(fileId);
  
  // 检查是否是本地文件
  if (file.owner === node.id) {
    console.log(`File ${file.name} is already local`);
    return;
  }
  
  console.log(`Requesting file ${file.name} from ${file.owner}...`);
  
  try {
    // 创建传输记录
    activeTransfers.set(fileId, {
      id: fileId,
      name: file.name,
      size: file.size,
      owner: file.owner,
      received: 0,
      chunks: [],
      startTime: Date.now()
    });
    
    // 发送文件请求
    await node.send(file.owner, 'file:request', { fileId });
    
  } catch (err) {
    console.error(`Failed to request file: ${err.message}`);
    activeTransfers.delete(fileId);
  }
}

// 处理文件请求
async function handleFileRequest(peerId, payload) {
  const { fileId } = payload;
  
  debug(`Received file request from ${peerId} for file ${fileId}`);
  
  // 检查文件是否存在
  if (!availableFiles.has(fileId)) {
    console.log(`File with ID ${fileId} not found, cannot fulfill request from ${peerId}`);
    return;
  }
  
  const file = availableFiles.get(fileId);
  
  // 检查是否是本地文件
  if (file.owner !== node.id) {
    console.log(`File ${file.name} is not local, cannot fulfill request from ${peerId}`);
    return;
  }
  
  console.log(`\n> Sending file ${file.name} to ${peerId}...`);
  
  try {
    // 读取文件
    const fileData = fs.readFileSync(file.path);
    
    // 分块发送
    const CHUNK_SIZE = 64 * 1024; // 64KB
    const totalChunks = Math.ceil(fileData.length / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileData.length);
      const chunk = fileData.slice(start, end);
      
      await node.send(peerId, 'file:data', {
        fileId,
        chunkIndex: i,
        totalChunks,
        data: chunk.toString('base64')
      });
      
      // 显示进度
      const progress = Math.round((i + 1) / totalChunks * 100);
      process.stdout.write(`\rSending: ${progress}% complete`);
    }
    
    console.log('\nFile sent successfully');
    
    // 发送完成消息
    await node.send(peerId, 'file:complete', { fileId });
    
  } catch (err) {
    console.error(`\nFailed to send file: ${err.message}`);
  }
}

// 处理文件数据
function handleFileData(peerId, payload) {
  const { fileId, chunkIndex, totalChunks, data } = payload;
  
  // 检查是否正在下载此文件
  if (!activeTransfers.has(fileId)) {
    debug(`Received data for unknown file ${fileId}`);
    return;
  }
  
  const transfer = activeTransfers.get(fileId);
  
  // 存储数据块
  const chunk = Buffer.from(data, 'base64');
  transfer.chunks[chunkIndex] = chunk;
  transfer.received += chunk.length;
  
  // 显示进度
  const progress = Math.round(transfer.received / transfer.size * 100);
  process.stdout.write(`\rDownloading ${transfer.name}: ${progress}% complete`);
}

// 处理文件传输完成
function handleFileComplete(peerId, payload) {
  const { fileId } = payload;
  
  // 检查是否正在下载此文件
  if (!activeTransfers.has(fileId)) {
    debug(`Received completion for unknown file ${fileId}`);
    return;
  }
  
  const transfer = activeTransfers.get(fileId);
  
  // 合并所有数据块
  const fileData = Buffer.concat(transfer.chunks);
  
  // 保存文件
  const filePath = path.join(SHARE_DIR, transfer.name);
  
  try {
    fs.writeFileSync(filePath, fileData);
    
    console.log(`\nFile ${transfer.name} downloaded successfully`);
    
    // 添加到可用文件列表
    availableFiles.set(fileId, {
      id: fileId,
      name: transfer.name,
      size: transfer.size,
      path: filePath,
      owner: node.id
    });
    
    // 计算传输速度
    const duration = (Date.now() - transfer.startTime) / 1000;
    const speed = Math.round(transfer.size / 1024 / duration);
    console.log(`Transfer speed: ${speed} KB/s`);
    
  } catch (err) {
    console.error(`Failed to save file: ${err.message}`);
  } finally {
    // 清理传输记录
    activeTransfers.delete(fileId);
  }
}

// 退出应用
async function exitApp() {
  console.log('\nExiting application...');
  
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
  await exitApp();
});

// 启动文件共享应用
startNode();

// 设置命令行提示符
rl.setPrompt('> ');