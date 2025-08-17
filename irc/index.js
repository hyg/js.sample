const irc = require('irc');
const fs = require('fs');

// 配置 IRC 服务器和频道
const config = {
  server: 'irc.kampungchat.org', // IRC 服务器地址
  port: 6667,                    // IRC 服务器端口
  nick: 'qwen_client_' + Math.random().toString(36).substr(2, 5), // 随机昵称，避免冲突
  channels: ['#qwen-test']       // 加入的频道
};

// 创建 IRC 客户端
const client = new irc.Client(config.server, config.nick, {
  port: config.port,
  channels: config.channels,
  debug: true // 启用调试日志
});

// 将日志写入文件
const logFile = fs.createWriteStream('irc_debug.log', { flags: 'w' });

// 监听连接成功事件
client.addListener('registered', (message) => {
  const logMessage = `已连接到服务器: ${message.server}\n`;
  console.log(logMessage);
  logFile.write(logMessage);
});

// 监听加入频道事件
client.addListener('join', (channel, nick, message) => {
  const logMessage = `${nick} 加入了频道 ${channel}\n`;
  console.log(logMessage);
  logFile.write(logMessage);
});

// 监听频道消息
client.addListener('message', (from, to, text, message) => {
  const logMessage = `${from} 在 ${to} 说: ${text}\n`;
  console.log(logMessage);
  logFile.write(logMessage);
});

// 监听消息发送确认
client.addListener('selfMessage', (to, text) => {
  const logMessage = `我向 ${to} 发送了消息: ${text}\n`;
  console.log(logMessage);
  logFile.write(logMessage);
});

// 监听错误事件
client.addListener('error', (message) => {
  const logMessage = `IRC 错误: ${JSON.stringify(message)}\n`;
  console.error(logMessage);
  logFile.write(logMessage);
});

// 从命令行读取输入并发送消息
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  // 假设消息格式为 "#channel message" 或 "nick message"
  const parts = input.trim().split(' ');
  const target = parts[0];
  const message = parts.slice(1).join(' ');

  if (target.startsWith('#')) {
    // 发送到频道
    const logMessage = `准备向频道 ${target} 发送消息: ${message}\n`;
    console.log(logMessage);
    logFile.write(logMessage);
    client.say(target, message);
  } else {
    // 发送到用户
    const logMessage = `准备向用户 ${target} 发送消息: ${message}\n`;
    console.log(logMessage);
    logFile.write(logMessage);
    client.say(target, message);
  }
});