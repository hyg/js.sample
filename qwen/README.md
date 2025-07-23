# P2P DHT Node

一个基于DHT发现的P2P网络节点软件，支持TCP和UDP通信协议，能够在NAT网络环境下发现其他节点并进行通信。

## 特性

- **DHT网络发现**：使用Bittorrent DHT协议发现其他节点
- **双协议支持**：同时支持TCP和UDP通信
- **NAT穿透**：通过DHT发现公网地址，支持NAT穿透
- **节点管理**：自动发现和维护节点列表
- **应用层通信**：简单的消息广播和点对点通信

## 安装

```bash
npm install
```

## 使用方法

### 启动节点

```bash
# 使用默认设置
npm start

# 自定义端口
npm start -- --tcp-port 8080 --udp-port 8081 --dht-port 6881

# 使用自定义magnet URI
npm start -- --magnet "magnet:?xt=urn:btih:your-custom-hash"
```

### 命令行交互

启动后，可以使用以下命令：

- `peers` - 显示发现的节点列表
- `send <message>` - 向所有节点发送聊天消息
- `status` - 显示当前节点状态
- `quit` - 停止节点

### 示例会话

```
p2p> status
Node status:
  Node ID: 4f3a2b1c...
  TCP: 192.168.1.100:8080
  UDP: 192.168.1.100:8081
  DHT: 192.168.1.100:6881
  Discovered nodes: 3

p2p> send Hello everyone!
Message sent to all peers

p2p> peers
Discovered peers:
  1. 8a7b6c5d...
     TCP: 203.0.113.45:8080
     UDP: 203.0.113.45:8081
     Last seen: 14:30:25
```

## API使用

### 基本使用

```javascript
const P2PNode = require('./src/index');

const node = new P2PNode({
  magnetUri: 'magnet:?xt=urn:btih:1234567890abcdef',
  tcpPort: 8080,
  udpPort: 8081,
  dhtPort: 6881
});

node.start();
```

### 事件监听

```javascript
node.nodeManager.on('message', (message) => {
  console.log('Received:', message);
  // 处理应用层消息
});
```

### 发送消息

```javascript
// 广播消息
await node.nodeManager.broadcastMessage({
  type: 'custom',
  data: 'your message here'
});

// 点对点发送
await node.nodeManager.sendMessage('tcp', '192.168.1.100', 8080, 'hello');
```

## 技术架构

### 组件结构

- **DHT Discovery** (`src/dht-discovery.js`): DHT网络发现和节点发现
- **TCP Transport** (`src/tcp-transport.js`): TCP通信层
- **UDP Transport** (`src/udp-transport.js`): UDP通信层
- **Node Manager** (`src/node-manager.js`):节点管理和协调
- **P2P Node** (`src/index.js`): 主应用入口

### 通信协议

节点间使用JSON格式消息：

```json
{
  "type": "chat|ping|pong|node-info",
  "from": "node-id",
  "message": "message content",
  "timestamp": 1234567890
}
```

## 网络穿透

本软件通过以下方式实现NAT穿透：

1. **DHT发现**：通过相同的magnet URI加入相同的DHT网络
2. **地址交换**：节点间自动交换公网地址信息
3. **心跳机制**：定期ping节点保持连接
4. **多协议支持**：TCP和UDP双重连接提高成功率

## 限制和注意事项

- 需要开放相应的端口（或使用UPnP）
- 节点发现可能需要一些时间
- 防火墙可能会阻止连接
- 不同NAT类型穿透成功率不同

## 开发

```bash
# 开发模式
npm run dev

# 运行测试
npm test
```

## 许可证

MIT