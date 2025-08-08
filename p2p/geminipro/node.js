// node.js

const Hyperswarm = require('hyperswarm');
const crypto = require('crypto');
const readline = require('readline');

// --- 配置区 ---

// 1. 定义一个共享的主题（Topic）。这是节点间互相发现的“暗号”。
// 必须是32字节的Buffer。我们可以用一个字符串通过SHA256哈希生成。
// 确保所有节点使用完全相同的topicString。
const topicString = 'my-super-secret-p2p-app-topic-v1';
const topic = crypto.createHash('sha256').update(topicString).digest();

// 2. 加密配置 (为了满足要求4)
const algorithm = 'aes-256-gcm'; // 推荐使用带认证的加密算法
const password = 'a-very-strong-and-secret-password'; // 用于派生加密密钥，所有节点必须相同
const salt = 'a-unique-salt'; // 盐，所有节点必须相同
const key = crypto.scryptSync(password, salt, 32); // 生成32字节的密钥
const ivLength = 16; // GCM推荐的IV长度
const authTagLength = 16; // GCM的认证标签长度

// --- 加密/解密辅助函数 ---

function encrypt(text) {
  const iv = crypto.randomBytes(ivLength); // 生成随机的初始化向量
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // 将 iv, authTag 和加密数据拼接在一起发送
  return Buffer.concat([iv, authTag, encrypted]);
}

function decrypt(encryptedData) {
  try {
    const iv = encryptedData.slice(0, ivLength);
    const authTag = encryptedData.slice(ivLength, ivLength + authTagLength);
    const encrypted = encryptedData.slice(ivLength + authTagLength);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('解密失败:', error.message);
    return null; // 解密失败或认证失败
  }
}


// --- 主逻辑 ---

async function main() {
  const swarm = new Hyperswarm({
    // 我们可以手动指定STUN服务器列表以提高在中国大陆的可用性
    stun: [
        'fwa.lifesizecloud.com:3478',
        'stun.isp.net.au:3478',
        'stun.freeswitch.org:3478',
        'stun.voip.blackberry.com:3478'
        //   'stun.l.google.com:19302',
    //   'stun1.l.google.com:19302',
    //   // 可以添加更多, e.g., stun.qq.com:3478
     ]
  });

  // 当发现一个对等节点并成功建立P2P连接时触发
  swarm.on('connection', (socket, peerInfo) => {
    console.log('\n[状态] 发现并连接到一个新节点!');
    // peerInfo.publicKey.toString('hex') 是对方节点的唯一ID
    const peerId = peerInfo.publicKey.toString('hex').slice(-6); 
    
    // 你可以发送一条欢迎消息
    socket.write(encrypt(`你好，我是节点 ${process.pid}`));

    // 监听从对方节点收到的数据
    socket.on('data', (data) => {
      const decryptedMessage = decrypt(data);
      if (decryptedMessage) {
        process.stdout.write(`\n[收到来自 ${peerId} 的消息]: ${decryptedMessage}\n> `);
      }
    });

    // 当连接关闭时
    socket.on('close', () => {
      console.log(`\n[状态] 与节点 ${peerId} 的连接已断开`);
    });
    
    // 当发生错误时
    socket.on('error', (err) => {
      console.error(`\n[错误] 与节点 ${peerId} 的连接发生错误:`, err.message);
    });
  });

  // 加入DHT网络，开始寻找使用相同主题的节点
  await swarm.join(topic, {
    server: true, // 意味着我们也愿意接受传入连接
    client: true, // 意味着我们也会主动连接其他节点
  });

  console.log('[状态] 节点已启动，正在寻找其他节点...');
  console.log(`[信息] 主题(Topic): ${topic.toString('hex')}`);

  // 创建一个简单的命令行界面，用于发送消息
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.setPrompt('> ');
  rl.prompt();

  rl.on('line', (line) => {
    if (line.trim()) {
      const encryptedMessage = encrypt(line);
      // 将消息广播给所有已连接的节点
      for (const socket of swarm.connections) {
        socket.write(encryptedMessage);
      }
    }
    rl.prompt();
  }).on('close', async () => {
    console.log('\n正在优雅地关闭节点...');
    // 离开网络并销毁swarm实例
    await swarm.leave(topic);
    await swarm.destroy();
    console.log('[状态] 节点已关闭');
    process.exit(0);
  });
}

main().catch(err => console.error(err));