const io = require('socket.io-client');

console.log('尝试连接到PeerJS服务器...');

// 尝试使用PeerJS的默认服务器
const socket = io('https://0.peerjs.com', {
  query: { room: 'test-room' },
  transports: ['websocket'],
  upgrade: false
});

socket.on('connect', () => {
  console.log('成功连接到服务器');
  console.log('Socket ID:', socket.id);
});

socket.on('connect_error', (err) => {
  console.log('连接错误:', err.message);
  console.log('错误详情:', err);
});

socket.on('error', (err) => {
  console.log('服务器错误:', err);
});

socket.on('disconnect', (reason) => {
  console.log('断开连接:', reason);
});

// 10秒后退出
setTimeout(() => {
  console.log('测试结束');
  socket.close();
  process.exit(0);
}, 10000);