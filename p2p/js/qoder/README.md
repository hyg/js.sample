# P2P 节点软件

一个基于 Node.js 开发的去中心化 P2P 节点软件，支持 NAT 穿透、DHT 网络发现和直接 P2P 通信。

## 功能特性

- 🌐 **NAT 穿透**: 使用 STUN 服务器自动获取公网地址
- 🔍 **节点发现**: 基于 DHT (分布式哈希表) 协议发现其他节点
- 🤝 **P2P 通信**: 支持直接的点对点通信，无需服务器中转
- 🛡️ **隐私保护**: 通信内容和元数据仅在参与方之间共享
- 🇨🇳 **国内可用**: 使用在中国大陆可访问的 STUN 服务器和 DHT 引导节点

## 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NAT 穿透      │    │   DHT 网络      │    │   P2P 通信      │
│                 │    │                 │    │                 │
│ • STUN 查询     │    │ • 节点发现      │    │ • WebRTC 连接   │
│ • 公网地址获取   │    │ • 地址发布      │    │ • 消息传输      │
│ • 端口映射      │    │ • 分布式路由     │    │ • 连接管理      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 安装和运行

### 环境要求

- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动节点

```bash
# 使用默认端口 (8080)
npm start

# 指定端口
npm start -- --port 9000

# 查看帮助
npm start -- --help
```

### 运行测试

```bash
npm test
```

## 使用说明

### 基本启动

启动节点后，软件会自动：

1. 📡 通过 STUN 服务器获取公网地址
2. 🔗 连接到 DHT 网络
3. 📢 在 DHT 网络中公告自己的地址
4. 🔍 查找并连接其他节点
5. 📊 每 30 秒显示状态报告

### 优雅关闭

按 `Ctrl+C` 可以优雅关闭节点，关闭时会显示当前可用的 IP 和端口，这些信息可以作为今后的 DHT 引导节点使用。

### 状态监控

节点运行时会定期显示状态信息：

```
📊 节点状态报告:
   DHT 节点数: 15
   已发现节点: 3
   P2P 连接数: 2
   待连接队列: 1
   运行时间: 120 秒
```

## 配置选项

### STUN 服务器

```javascript
// config/config.js
stunServers: [
  { urls: 'stun:fwa.lifesizecloud.com:3478' },
  { urls: 'stun:stun.isp.net.au:3478' },
  { urls: 'stun:stun.freeswitch.org:3478' },
  { urls: 'stun:stun.voip.blackberry.com:3478' }
]
```

### DHT 引导节点

```javascript
// config/config.js
dhtBootstrapNodes: [
  { host: '34.197.35.250', port: 6880 },
  { host: '72.46.58.63', port: 51413 },
  // ... 更多节点
]
```

## 编程接口

### 发送消息

```javascript
const NodeManager = require('./src/node-manager');

const node = new NodeManager();
await node.start();

// 发送消息到指定节点
node.sendMessage('192.168.1.100:8080', 'chat', {
  message: '你好！'
});

// 广播消息到所有连接的节点
node.broadcastMessage('announcement', {
  message: '系统公告'
});
```

### 注册消息处理器

```javascript
// 注册自定义消息处理器
node.registerMessageHandler('custom_message', (data, peerId) => {
  console.log(`收到自定义消息: ${data.content} 来自 ${peerId}`);
});
```

## 文件结构

```
p2p-node/
├── src/
│   ├── index.js              # 主入口文件
│   ├── node-manager.js       # 节点管理器
│   ├── dht-client.js         # DHT 客户端
│   ├── nat-traversal.js      # NAT 穿透
│   └── p2p-communication.js  # P2P 通信
├── config/
│   └── config.js             # 配置文件
├── test/
│   └── test.js               # 测试文件
├── package.json
└── README.md
```

## 工作原理

### 1. NAT 穿透

- 使用 STUN 协议查询多个 STUN 服务器
- 获取节点的公网 IP 地址和端口
- 支持自动重试和容错机制

### 2. DHT 网络

- 基于 BitTorrent DHT 协议
- 使用固定的 InfoHash 让所有节点聚集在同一网络
- 支持节点地址的发布和查询
- 定期公告自己的地址信息

### 3. P2P 连接

- 使用 WebRTC 建立直接的点对点连接
- 支持消息的可靠传输
- 自动处理连接断开和重连
- 支持自定义消息类型和处理器

## 安全性考虑

- ✅ 通信内容仅在参与节点之间传输
- ✅ 不依赖中心化服务器存储数据
- ✅ DHT 网络提供分布式的节点发现
- ✅ 支持消息加密（可在应用层实现）

## 常见问题

### Q: 节点无法发现其他节点？

A: 检查网络连接，确保防火墙允许相关端口通信，稍等片刻让 DHT 网络同步。

### Q: 连接建立失败？

A: 可能是 NAT 类型问题，某些严格的 NAT 可能影响 P2P 连接建立。

### Q: 如何增加更多引导节点？

A: 在配置文件中添加更多 DHT 引导节点，或使用其他节点关闭时显示的可用节点。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！