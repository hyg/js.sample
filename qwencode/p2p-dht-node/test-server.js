// 测试服务器
const RelayServer = require('./src/server');
const config = require('./src/config');

console.log('启动测试服务器...');
const server = new RelayServer();
server.start();

// 5秒后自动关闭
setTimeout(() => {
  console.log('测试完成，关闭服务器...');
  server.stop();
  process.exit(0);
}, 5000);