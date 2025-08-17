const irc = require('irc');
const fs = require('fs');

// 配置 IRC 服务器和频道
const config = {
  server: 'irc.kampungchat.org', // IRC 服务器地址
  port: 6667,                    // IRC 服务器端口
  nick: 'qwen_receiver_' + Math.random().toString(36).substr(2, 5), // 接收方昵称
  channels: ['#qwen-test']       // 加入的频道
};

// 创建 IRC 客户端
const client = new irc.Client(config.server, config.nick, {
  port: config.port,
  channels: config.channels,
  debug: true // 启用调试日志
});

// 将日志写入文件
const logFile = fs.createWriteStream('irc_receiver.log', { flags: 'w' });

function log(message) {
  console.log(message);
  logFile.write(message + '\n');
}

// 监听连接成功事件
client.addListener('registered', (message) => {
  log(`已连接到服务器: ${message.server}`);
});

// 监听加入频道事件
client.addListener('join', (channel, nick, message) => {
  log(`${nick} 加入了频道 ${channel}`);
  // 如果是自己加入频道，稍后发送一条消息
  if (nick === config.nick) {
    setTimeout(() => {
      const testMessage = `Hello from ${config.nick} at ${new Date().toISOString()}`;
      log(`准备发送消息: ${testMessage}`);
      client.say(channel, testMessage);
    }, 5000); // 等待5秒确保完全加入频道
  }
});

// 监听频道消息
client.addListener('message', (from, to, text, message) => {
  log(`${from} 在 ${to} 说: ${text}`);
  // 如果收到对方的消息，就回复
  if (from.startsWith('qwen_sender_')) {
    const replyMessage = `Hello ${from}, I received your message: "${text}"`;
    log(`准备回复消息: ${replyMessage}`);
    client.say(to, replyMessage);
  }
});

// 监听消息发送确认
client.addListener('selfMessage', (to, text) => {
  log(`我向 ${to} 发送了消息: ${text}`);
});

// 监听错误事件
client.addListener('error', (message) => {
  log(`IRC 错误: ${JSON.stringify(message)}`);
});