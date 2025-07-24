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
  const dht = new DHT();
  dht.listen();                 // 随机端口
  dht.on('ready', () => {
    console.log('[DHT] ready, node id', dht.nodeId.toString('hex'));
    // 把自己的外网地址放进 DHT
    dht.announce(infoHash, port, () => {
      console.log('[DHT] announced', infoHash.toString('hex'));
    });
  });

  // 5. 发现对方
  dht.on('peer', (_addr) => {
    const [peerIP, peerPort] = _addr.split(':');
    if (peerIP === address && Number(peerPort) === port) return; // 自己
    console.log('[PEER] got', _addr);
    // 6. 打洞：持续发心跳
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