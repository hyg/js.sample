/*  Express + Socket.IO 服务器
    负责：静态文件、WebSocket、事件转发给引擎
*/
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const engine = require('./engine');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  // 首次连接推送当前 store
  socket.emit('stateChanged', engine.getStore());

  // 客户端事件 -> 引擎
  socket.on('clientEvent', ({event, params}) => {
    const result = engine.handleEvent(event, params);
    socket.emit('eventResult', result);
  });
});

// 引擎广播给所有客户端
engine.on('stateChanged', store => io.emit('stateChanged', store));

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Web server running at http://localhost:${PORT}`);
});