# DHT 终端聊天应用

基于 Node.js 的 DHT 节点发现与通信实现方案（Windows 本地终端版）

> 纯 Node.js 代码，**零服务器依赖**，**中国大陆网络可直连**，**单文件 exe 双击即用**。

## 功能特点
- **去中心化**：基于 DHT 网络实现节点发现，无需中心服务器
- **终端 UI**：使用 Ink 构建的交互式终端界面，支持彩色显示
- **加密通信**：采用 libsodium 实现端到端加密，确保消息安全
- **跨平台**：通过 pkg 打包为单文件可执行程序，无需安装 Node.js
- **网络兼容**：中国大陆网络环境下可直接连接公共 DHT 节点

## 快速开始

### 开发环境
```bash
# 克隆仓库
git clone <repository-url>
cd dht-chat

# 安装依赖
npm install

# 开发模式启动
npm run dev
```

### 打包为可执行文件
```bash
# 生成 chat.exe
npm run build

# 运行生成的可执行文件
./build/chat.exe
```

## 技术栈
- **DHT 网络层**：`bittorrent-dht` - Kademlia 协议实现
- **终端 UI**：`ink` + `ink-text-input` - React 语法的终端界面库
- **加密通信**：`libsodium-wrappers` - 高性能加密库
- **打包工具**：`pkg` - 将 Node.js 项目打包为可执行文件

## 目录结构
```
chat-dht/
├─ src/
│  ├─ index.ts         # CLI 入口
│  ├─ dht.ts           # DHT 节点发现
│  ├─ ui.tsx           # 终端聊天界面
│  └─ crypto.ts        # libsodium 加密
├─ package.json
├─ tsconfig.json
└─ build/
    └── chat.exe       # 单文件可执行
```

## 常见问题

### Q: 如何确保节点能够被发现？
A: 应用使用公共 DHT 引导节点（router.bittorrent.com:6881 等），在大多数网络环境下能自动完成 NAT 穿透。

### Q: 加密通信如何工作？
A: 每个节点生成唯一密钥对，消息通过接收方公钥加密，只有拥有对应私钥的节点才能解密。

### Q: 支持哪些操作系统？
A: 当前配置仅支持 Windows x64，修改 package.json 中的 pkg 目标平台可支持其他系统。

## 许可证
MIT