# PeerJS 局域网通信示例

## 安装

- 针对 wrtc 安装失败的问题，核心原因是 node-pre-gyp 未全局安装，导致预编译脚本无法执行。以下是修复步骤和替代方案
	- npm install -g node-pre-gyp
	- npm cache clean --force
	- rm -rf node_modules package-lock.json // 可以跳过
	- npm install wrtc

这个项目演示了如何在局域网内使用PeerJS在不同设备之间建立连接并进行消息通信。

## 文件说明

1. `peer.html` - 网页端PeerJS客户端，ID为"my-test-web-1"
2. `peer1.html` - 另一个网页端PeerJS客户端，ID为"my-test-web-2"
3. `peer.js` - Node.js端PeerJS客户端，ID为"my-test-web-2"
4. `psmd-id1.html` - 网页端PeerJS客户端，ID为"psmd-id1"
5. `psmd-id2.html` - 网页端PeerJS客户端，ID为"psmd-id2"
6. `psmd-cli.js` - Node.js CLI客户端，可以替代psmd-id1.html或psmd-id2.html

## 使用方法

### 1. 启动网页端

在局域网中的一个设备上打开相应的HTML文件。确保该设备与运行Node.js客户端的设备在同一个局域网内。

### 2. 运行Node.js客户端

运行Node.js客户端有几种方式：

#### 运行peer.js客户端
```bash
node peer.js
```

#### 运行PSMD CLI客户端
```bash
# 使用默认设置 (psmd-id1 -> psmd-id2)
node psmd-cli.js

# 或者指定自己的ID和目标ID
node psmd-cli.js psmd-id1 psmd-id2
node psmd-cli.js psmd-id2 psmd-id1
```

### 3. 观察通信

两个客户端应该能够自动连接并开始交换消息。

## 工作原理

1. 网页端和Node.js端都使用PeerJS库创建Peer实例
2. Node.js端主动连接到指定ID的网页端
3. 两端都监听并发送消息，实现了双向通信

## 依赖安装

如果尚未安装依赖，请运行：

```bash
npm install
```

或者使用yarn：

```bash
yarn install
```

## PSMD CLI 客户端功能

PSMD CLI客户端是一个命令行工具，可以替代网页端的psmd-id1.html和psmd-id2.html文件。它支持以下功能：

1. 通过命令行参数指定自己的ID和目标ID
2. 实时发送和接收消息
3. 输入"exit"退出程序
4. 支持在局域网内与其他PeerJS客户端通信
5. 自动处理ID冲突，使用备用ID

### 使用示例

```bash
# 作为psmd-id2运行，连接到psmd-id1
node psmd-cli.js psmd-id2 psmd-id1

# 作为psmd-id1运行，连接到psmd-id2
node psmd-cli.js psmd-id1 psmd-id2
```