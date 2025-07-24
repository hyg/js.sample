#!/usr/bin/env node
// 用法：node p2p-chat.js <共享口令>
// 两台机器口令一致即可互相发现
const dgram = require('dgram');
const crypto = require('crypto');
const DHT = require('bittorrent-dht');
const stun = require('stun');

const PASSWORD = process.argv[2] || 'default-pass';
const STUN = 'stun.miwifi.com:3478';      // 小米国内 STUN，实测可用
const LOCAL_PORT = 0;                     // 随机端口

// 1. 160 bit info_hash = SHA1(密码)
const infoHash = crypto.createHash('sha1').update(PASSWORD).digest();

// 2. 本地 UDP socket + 打洞用
const socket = dgram.createSocket('udp4');
socket.bind(LOCAL_PORT, () => {
  const port = socket.address().port;
  console.log('[LOCAL] listening', port);
});

// 3. 拿外网映射
stun.request(STUN, { socket }, (err, res) => {
  if (err) throw err;
  const { address, port } = res.getXorAddress();
  console.log('[STUN] public', `${address}:${port}`);

  // 4. 连 DHT

  const BOOTSTRAPS = [
    { host: '34.197.35.250', port: 6880 },
    { host: '72.46.58.63', port: 51413 },
    { host: '46.53.251.68', port: 16970 },
    { host: '191.95.16.229', port: 55998 },
    { host: '79.173.94.111', port: 1438 },
    { host: '45.233.86.50', port: 61995 },
    { host: '178.162.174.28', port: 28013 },
    { host: '178.162.174.240', port: 28006 },
    { host: '72.21.17.101', port: 22643 },
    { host: '31.181.42.46', port: 22566 },
    { host: '67.213.106.46', port: 61956 },
    { host: '201.131.172.249', port: 53567 },
    { host: '185.203.152.184', port: 2003 },
    { host: '68.146.23.207', port: 42107 },
    { host: '51.195.222.183', port: 8653 },
    { host: '85.17.170.48', port: 28005 },
    { host: '87.98.162.88', port: 6881 },
    { host: '185.145.245.121', port: 8656 },
    { host: '52.201.45.189', port: 6880 }
  ];

  const dht = new DHT({ bootstrap: BOOTSTRAPS });   // 让 DHT 复用 socket
  //const dht = new DHT();
  dht.listen();                 // 随机端口
  dht.on('ready', () => {
    console.log('[DHT] ready, node id', dht.nodeId.toString('hex'));
    // 把自己的外网地址放进 DHT
    dht.announce(infoHash, port, () => {
      console.log('[DHT] announced', infoHash.toString('hex'));
    });
  });

  // 5. 发现对方// 新代码：
dht.on('peer', ({ host: peerIP, port: peerPort }) => {
  if (peerIP === address && peerPort === port) return; // 自己
  console.log('[PEER] got', `${peerIP}:${peerPort}`);
  const HEART = Buffer.from('💗');
  setInterval(() => socket.send(HEART, 0, HEART.length, peerPort, peerIP), 1000);
});

  // 7. 接收数据
  socket.on('message', (msg, rinfo) => {
    console.log(`[CHAT] ${rinfo.address}:${rinfo.port} > ${msg.toString()}`);
  });

  // 8. 发送聊天
  process.stdin.on('data', (chunk) => {
    socket.send(chunk, 0, chunk.length, port, address); // 先广播给自己端口
  });
});