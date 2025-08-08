const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fsm = require('../fsm/engine');

// 创建Express应用
const app = express();
const server = http.createServer(app);

// 配置Socket.IO
const io = new Server(server, {
  cors: { origin: "*" } // 开发环境允许所有跨域
});

// 静态文件服务（前端页面）
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log('Web客户端已连接');

  // 初始发送当前状态和清单
  socket.emit('statusUpdate', fsm.getCurrentStatus());

  // 接收客户端事件（如用户操作）
  socket.on('userEvent', (eventName) => {
    console.log(`收到Web事件: ${eventName}`);
    fsm.handleEvent(eventName); // 触发状态机处理
    io.emit('statusUpdate', fsm.getCurrentStatus()); // 广播更新给所有客户端
  });

  socket.on('disconnect', () => {
    console.log('Web客户端已断开');
  });
});

// 启动Web服务器
function startWebServer() {
  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`Web界面已启动: http://localhost:${PORT}`);
  });
}

module.exports = { startWebServer };
