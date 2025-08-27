#!/usr/bin/env node

// 检查是否在Node.js环境中运行
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isNode) {
  // 在Node.js环境中，我们需要提供WebRTC实现
  global.RTCPeerConnection = require('wrtc').RTCPeerConnection;
  global.RTCSessionDescription = require('wrtc').RTCSessionDescription;
  global.RTCIceCandidate = require('wrtc').RTCIceCandidate;
}

const { Peer } = require('peerjs');
const readline = require('readline');

// 创建readline接口用于读取用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 获取命令行参数
const args = process.argv.slice(2);
let peerId = 'psmd-id1'; // 默认ID
let targetId = 'psmd-id2'; // 默认目标ID

if (args.length >= 2) {
  peerId = args[0];
  targetId = args[1];
} else {
  console.log('使用方法: node psmd-cli.js <你的ID> <目标ID>');
  console.log('例如: node psmd-cli.js psmd-id2 psmd-id1');
  console.log('使用默认设置: psmd-id2 -> psmd-id1');
}

// 存储连接对象
let conn;
let peer;

// 创建Peer实例的函数
function createPeer(id) {
  peer = new Peer(id);
  
  peer.on('open', function(id) {
    console.log(`Peer ID: ${id}`);
    console.log(`正在连接到 ${targetId}...`);
    
    // 连接到目标节点
    conn = peer.connect(targetId);
    
    // 当连接打开时
    conn.on('open', function() {
      console.log(`已连接到 ${targetId}`);
      console.log('开始聊天吧！输入消息并按回车发送。');
      console.log('输入 "exit" 退出程序。');
      promptUser();
    });
    
    // 监听来自连接的消息
    conn.on('data', function(data) {
      console.log(`\n${targetId}: ${data}`);
      promptUser();
    });
    
    // 监听连接错误
    conn.on('error', function(err) {
      console.error('Connection error:', err);
    });
  });
  
  // 监听来自其他peer的连接请求
  peer.on('connection', function(connection) {
    console.log(`收到 ${connection.peer} 的连接请求`);
    
    // 如果还没有连接，接受这个连接
    if (!conn) {
      conn = connection;
      console.log(`已连接到 ${connection.peer}`);
      console.log('开始聊天吧！输入消息并按回车发送。');
      console.log('输入 "exit" 退出程序。');
    }
    
    // 监听消息
    connection.on('data', function(data) {
      console.log(`\n${connection.peer}: ${data}`);
      promptUser();
    });
    
    // 监听连接错误
    connection.on('error', function(err) {
      console.error('Incoming connection error:', err);
    });
  });
  
  // 监听PeerJS错误
  peer.on('error', function(err) {
    console.error('PeerJS error:', err);
    if (err.type === 'unavailable-id') {
      console.log('尝试使用备用ID...');
      const backupId = peerId + '-' + Date.now();
      console.log(`使用备用ID: ${backupId}`);
      createPeer(backupId);
    }
  });
}

// 初始化Peer
createPeer(peerId);

console.log(`PSMD CLI 客户端启动中... (${peerId})`);

// 提示用户输入消息
function promptUser() {
  rl.question(`${peerId}: `, (message) => {
    if (message.toLowerCase() === 'exit') {
      console.log('退出程序...');
      rl.close();
      if (peer) {
        peer.destroy();
      }
      process.exit(0);
    }
    
    if (conn && message.trim()) {
      conn.send(message);
      console.log(`已发送: ${message}`);
    }
    
    promptUser();
  });
}