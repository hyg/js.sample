const dgram = require('dgram');
const socket = dgram.createSocket('udp4');

// 配置（实际使用时通过其他模块动态获取对方信息）
const config = {
  localPort: 3000, // 本地端口（确保唯一）
  remoteIp: '对方公网IP', // 例如：'221.XX.XX.XX'（由其他模块提供）
  remotePort: 4000, // 对方公网端口（由其他模块提供）
  punchInterval: 100, // 打洞包发送间隔（毫秒）
  punchTimes: 10, // 打洞包发送次数
  timeout: 5000 // 连接超时时间（毫秒）
};

// 状态变量
let isConnected = false;
let punchCount = 0;
let timeoutTimer = null;

// 绑定本地端口
socket.bind(config.localPort, () => {
  console.log(`节点启动，本地端口：${config.localPort}`);
  console.log(`开始向 ${config.remoteIp}:${config.remotePort} 自动打洞...`);
  
  // 启动打洞流程
  startPunching();
  
  // 设置连接超时
  timeoutTimer = setTimeout(() => {
    if (!isConnected) {
      console.error('连接超时，打洞失败');
      socket.close();
      process.exit(1);
    }
  }, config.timeout);
});

// 自动发送打洞包
function startPunching() {
  if (punchCount >= config.punchTimes) return;
  
  const punchMsg = Buffer.from(`punch_${Date.now()}`);
  socket.send(punchMsg, 0, punchMsg.length, config.remotePort, config.remoteIp, (err) => {
    if (err) {
      console.error(`打洞包发送失败（${punchCount + 1}/${config.punchTimes}）：`, err);
    } else {
      console.log(`打洞包已发送（${punchCount + 1}/${config.punchTimes}）`);
    }
    
    punchCount++;
    setTimeout(startPunching, config.punchInterval);
  });
}

// 监听来自对方的消息
socket.on('message', (msg, rinfo) => {
  // 验证消息来源是否为目标节点
  if (rinfo.address !== config.remoteIp || rinfo.port !== config.remotePort) {
    return; // 忽略其他来源的消息
  }
  
  // 首次收到消息即视为连接建立
  if (!isConnected) {
    isConnected = true;
    clearTimeout(timeoutTimer);
    console.log(`✅ 与 ${rinfo.address}:${rinfo.port} 连接成功！`);
    
    // 发送确认消息
    const confirmMsg = Buffer.from('connected');
    socket.send(confirmMsg, 0, confirmMsg.length, rinfo.port, rinfo.address);
    
    // 模拟业务数据发送（实际可替换为业务逻辑）
    setInterval(() => {
      const data = Buffer.from(`业务数据 ${Date.now()}`);
      socket.send(data, 0, data.length, rinfo.port, rinfo.address);
    }, 2000);
  } else {
    // 处理后续业务数据
    console.log(`收到数据：${msg.toString()}`);
  }
});

// 错误处理
socket.on('error', (err) => {
  console.error('Socket错误：', err);
  socket.close();
});
