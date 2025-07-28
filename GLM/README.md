# P2P DHT Node

一个基于 Node.js 的去中心化 P2P 节点软件，支持 NAT 穿透和 DHT 网络发现。

## 功能特性

- 🔍 **DHT 网络发现**: 使用 BitTorrent DHT 协议发现其他节点
- 🚪 **NAT 穿透**: 自动处理不同类型的 NAT，建立直连
- 🔒 **端到端加密**: 使用 RSA + AES 加密通信内容
- 🌐 **去中心化**: 不依赖中央服务器，节点间直接通信
- 📡 **消息路由**: 基于 Kademlia 的智能路由机制
- 🔄 **自动重连**: 网络变化时自动重新连接

## 安装

```bash
npm install
```

## 使用方法

### 启动节点

```bash
# 使用默认端口启动
npm start

# 指定端口启动
npm start -- 6881 6882 my-network
```

参数说明：
- 第一个参数：P2P 通信端口（默认：6881）
- 第二个参数：DHT 端口（默认：6882）
- 第三个参数：网络主题（默认：p2p-test-network）

### 交互式命令

启动后进入交互式 CLI：

```
p2p> help                    # 显示帮助信息
p2p> status                 # 查看节点状态
p2p> peers                  # 查看已连接的节点
p2p> send <nodeId> <msg>    # 发送消息给指定节点
p2p> broadcast <msg>        # 广播消息给所有节点
p2p> info                   # 显示节点详细信息
p2p> clear                  # 清空屏幕
p2p> exit                   # 退出程序
```

## 架构说明

### 核心模块

1. **P2PNode** (`src/p2p-node.js`): 主节点类，协调所有功能
2. **DHTDiscovery** (`src/dht-discovery.js`): DHT 网络发现
3. **NATTraversal** (`src/nat-traversal.js`): NAT 穿透处理
4. **P2PCommunication** (`src/p2p-communication.js`): 加密通信
5. **SecurityManager** (`src/security.js`): 加密和安全功能

### 工作流程

1. **节点启动** → 发现公网地址 → 加入 DHT 网络
2. **节点发现** → DHT 查找 → 验证节点 → NAT 穿透
3. **建立连接** → 握手验证 → 加密通道 → 消息路由
4. **持续运行** → 心跳检测 → 自动重连 → 状态同步

## 安全特性

- **身份验证**: 基于 RSA 密钥对的节点身份
- **消息加密**: 短消息使用 RSA，长消息使用 AES
- **数字签名**: 所有消息都有签名验证
- **会话密钥**: 每个连接使用独立的会话密钥
- **隐私保护**: 通信时间、长度、地址均为加密状态

## 配置选项

在创建节点时可以传入配置对象：

```javascript
const node = new P2PNode({
    port: 6881,                    // P2P 通信端口
    dhtPort: 6882,                  // DHT 端口
    topic: 'my-network',           // 网络主题
    bootstrapNodes: [],             // 引导节点列表
    maxRetries: 3,                  // 最大重试次数
    messageTimeout: 30000           // 消息超时时间
});
```

## 开发和测试

```bash
# 开发模式启动
npm run dev

# 运行测试
npm test
```

## 注意事项

1. **防火墙设置**: 确保端口在防火墙中开放
2. **网络环境**: 支持 Cone NAT 和 Symmetric NAT
3. **性能考虑**: 大量节点时需要优化路由表
4. **法律合规**: 仅用于合法的 P2P 应用

## 技术栈

- **Node.js**: 运行时环境
- **bittorrent-dht**: DHT 网络实现
- **crypto**: 加密功能
- **stun**: NAT 发现
- **libp2p**: P2P 网络库（可选）

## 许可证

MIT License