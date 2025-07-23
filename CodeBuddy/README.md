# P2P Node Library

一个简单而强大的JavaScript P2P节点库，用于构建分布式应用程序。

## 特性

- 支持TCP和UDP传输协议
- 使用DHT进行节点发现
- 内置NAT穿透功能（UPnP和NAT-PMP）
- 事件驱动的API
- 可扩展的消息处理系统
- 支持Node.js环境

## 安装

```bash
npm install p2p-node
```

## 快速开始

创建一个简单的P2P节点：

```javascript
const { createNode } = require('p2p-node');

// 创建节点
const node = createNode({
  transport: {
    tcp: {
      port: 8000
    }
  }
});

// 处理节点事件
node.on('started', (info) => {
  console.log(`Node started with ID: ${info.id}`);
  console.log(`Public address: ${info.publicAddress}:${info.publicPort}`);
});

node.on('node:connected', (peer) => {
  console.log(`Connected to peer: ${peer.id}`);
});

node.on('message', (message) => {
  console.log(`Received message from ${message.from}:`, message.payload);
});

// 启动节点
node.start()
  .then(() => {
    console.log('Node started successfully');
    
    // 连接到另一个节点
    return node.connect('example.com', 8000);
  })
  .then(() => {
    console.log('Connected to peer');
    
    // 发送消息
    return node.send('peer-id', 'hello', { text: 'Hello, world!' });
  })
  .catch((err) => {
    console.error('Error:', err);
  });
```

## 核心组件

### Node

P2P节点类，管理节点的生命周期、连接和消息传递。

```javascript
const { Node } = require('p2p-node');

const node = new Node({
  // 配置选项
});
```

### TCPTransport

基于TCP的传输层实现。

```javascript
const { TCPTransport } = require('p2p-node');

const transport = new TCPTransport({
  port: 8000
});
```

### UDPTransport

基于UDP的传输层实现。

```javascript
const { UDPTransport } = require('p2p-node');

const transport = new UDPTransport({
  port: 8001
});
```

### DHTDiscovery

使用DHT进行节点发现。

```javascript
const { DHTDiscovery } = require('p2p-node');

const dht = new DHTDiscovery({
  bootstrap: ['router.bittorrent.com:6881']
});
```

### NATTraversal

NAT穿透功能，支持UPnP和NAT-PMP。

```javascript
const { NATTraversal } = require('p2p-node');

const nat = new NATTraversal({
  enableUPnP: true,
  enableNATPMP: true
});
```

## 配置选项

### 节点配置

```javascript
const node = createNode({
  // DHT配置
  dht: {
    bootstrap: ['router.bittorrent.com:6881'],
    portStart: 20000,
    portEnd: 20100,
    discoveryInterval: 60000
  },
  
  // NAT穿透配置
  nat: {
    enableUPnP: true,
    enableNATPMP: true,
    ttl: 7200
  },
  
  // 传输层配置
  transport: {
    default: 'tcp',
    
    tcp: {
      port: 8000,
      connectTimeout: 5000,
      heartbeatInterval: 30000
    },
    
    udp: {
      port: 8001,
      maxPacketSize: 1400,
      retransmitTimeout: 1000,
      maxRetransmits: 5
    }
  },
  
  // 节点配置
  node: {
    discoveryInterval: 60000,
    keepAliveInterval: 30000,
    nodeTimeout: 120000
  }
});
```

## 事件

### 节点事件

- `started` - 节点启动完成
- `stopped` - 节点停止
- `error` - 发生错误
- `node:connected` - 连接到新节点
- `node:disconnected` - 节点断开连接
- `node:discovered` - 发现新节点
- `message` - 收到消息

## 示例应用

### P2P聊天应用

一个简单的P2P聊天应用，展示如何使用节点进行实时消息传递。

```bash
node examples/chat.js
```

### P2P文件共享应用

一个P2P文件共享应用，展示如何使用节点传输文件。

```bash
node examples/file-sharing.js
```

## 许可证

MIT