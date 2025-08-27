// 检查是否在Node.js环境中运行
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isNode) {
  // 在Node.js环境中，我们需要提供WebRTC实现
  global.RTCPeerConnection = require('wrtc').RTCPeerConnection;
  global.RTCSessionDescription = require('wrtc').RTCSessionDescription;
  global.RTCIceCandidate = require('wrtc').RTCIceCandidate;
}

const { Peer } = require('peerjs');

// 创建一个Peer实例，ID为my-test-web-2
const peer = new Peer('my-test-web-2');

peer.on('open', function(id) {
  console.log('My peer ID is: ' + id);
  
  // 连接到目标节点
  const targetNodeId = "my-test-web-1";
  const conn = peer.connect(targetNodeId);
  
  // 当连接打开时
  conn.on('open', function() {
    console.log('Connected to ' + targetNodeId);
    
    // 发送初始消息
    conn.send('Hello from CLI JS using PeerJS!');
    console.log('Sent initial message to ' + targetNodeId);
  });
  
  // 监听来自连接的消息
  conn.on('data', function(data) {
    console.log('Received from ' + targetNodeId + ':', data);
    
    // 回复消息
    conn.send('Received your message: ' + data);
  });
  
  // 监听连接错误
  conn.on('error', function(err) {
    console.error('Connection error:', err);
  });
});

// 监听来自其他peer的连接请求
peer.on('connection', function(conn) {
  console.log('New connection from ' + conn.peer);
  
  // 监听消息
  conn.on('data', function(data) {
    console.log('Received from ' + conn.peer + ':', data);
    
    // 回复消息
    conn.send('Received your message: ' + data);
  });
  
  // 当连接打开时发送欢迎消息
  conn.on('open', function() {
    console.log('Incoming connection from ' + conn.peer + ' is now open');
    conn.send('Hello from CLI JS (incoming connection)!');
  });
  
  // 监听连接错误
  conn.on('error', function(err) {
    console.error('Incoming connection error:', err);
  });
});

// 监听PeerJS错误
peer.on('error', function(err) {
  console.error('PeerJS error:', err);
});

console.log('Peer client started (PeerJS version)');