# XMTP SDK安装和使用问题总结文档

## 概述

在开发XMTP + Qwen AI聊天机器人项目过程中，我们尝试了多种方法来安装和使用XMTP SDK，遇到了许多问题。本文档总结了我们的经验教训，包括成功的解决方案和需要避免的陷阱。

## 尝试过的XMTP包

### 1. @xmtp/xmtp-js

#### 安装命令
```bash
npm install @xmtp/xmtp-js
```

#### 问题描述
- 所有版本（包括6.7.0、11.4.0-beta.1、13.0.4）都被标记为"deprecated"
- 提示"Package no longer supported"
- 无法正常工作，出现各种错误：
  - `TypeError: Cannot destructure property 'Compression' of 'proto_1.xmtpEnvelope' as it is undefined`
  - `GrpcError: publishing to XMTP V2 is no longer available. Please upgrade your client to XMTP V3`

#### 结论
- 该包已被废弃，不应使用
- npm上的包可能已被恶意劫持或不再维护

### 2. @xmtp/node-sdk

#### 安装命令
```bash
npm install @xmtp/node-sdk
```

#### 问题描述
- 在Windows上出现兼容性问题
- 出现错误：`TypeError: signer.getIdentifier is not a function`
- 无法正常创建XMTP客户端

#### 结论
- 存在平台兼容性问题
- 需要特定的系统环境（如特定版本的Node.js和glibc）

### 3. @xmtp/browser-sdk

#### 安装命令
```bash
npm install @xmtp/browser-sdk
```

#### 问题描述
- 依赖浏览器环境中的Worker API
- 在Node.js环境中无法正常工作
- 出现错误：`ReferenceError: Worker is not defined`

#### 结论
- 专为浏览器环境设计
- 不适用于Node.js服务器环境

### 4. @xmtp/lib

#### 安装命令
```bash
npm install @xmtp/lib
```

#### 问题描述
- 包不存在
- 出现错误：`404 Not Found`

#### 结论
- 该包名不存在或已被废弃

## 成功的解决方案

### 从GitHub直接克隆XMTP JS仓库

#### 步骤
1. 克隆仓库：
   ```bash
   git clone https://github.com/xmtp/xmtp-js.git
   ```

2. 安装依赖：
   ```bash
   cd xmtp-js
   yarn install
   ```

3. 构建SDK：
   ```bash
   yarn build
   ```

4. 在项目中使用构建后的SDK：
   ```javascript
   import { Client } from './xmtp-js/sdks/node-sdk/dist/index.js';
   ```

#### 优势
- 使用官方最新代码
- 避免npm包的废弃问题
- 可以根据需要自定义构建

#### 注意事项
- 需要安装yarn和turbo构建工具
- 构建过程可能需要较长时间
- 需要满足特定的系统要求（如Node.js版本>=20）

## 环境要求

### Node.js版本
- 推荐使用Node.js 20或更高版本
- 我们使用的是Node.js 22.18.0

### 构建工具
- 需要安装yarn：`npm install -g yarn`
- 需要安装turbo：`npm install -g turbo`

### 系统要求
- Windows 10/11或Linux/macOS
- 对于@xmtp/node-sdk，需要glibc 3.28+（例如Ubuntu 24.04或更高版本）

## 关键问题和解决方案

### 1. IdentifierKind类型问题

#### 问题描述
在创建signer时，`identifierKind`字段需要使用数字而不是字符串。

#### 错误的代码
```javascript
getIdentifier: () => ({
  identifier: wallet.address.toLowerCase(),
  identifierKind: "Ethereum"  // 错误：应使用数字
})
```

#### 正确的代码
```javascript
getIdentifier: () => ({
  identifier: wallet.address.toLowerCase(),
  identifierKind: 0  // Ethereum = 0, Passkey = 1
})
```

### 2. ESM模块导入问题

#### 问题描述
在Node.js环境中使用ES模块时，需要注意正确的导入方式。

#### 解决方案
1. 在package.json中添加：`"type": "module"`
2. 使用动态导入：
   ```javascript
   const { Client } = await import('./xmtp-js/sdks/node-sdk/dist/index.js');
   ```

### 3. 网络连接问题

#### 问题描述
在中国大陆地区，可能无法直接连接到GitHub。

#### 解决方案
使用代理连接：
```bash
git clone https://github.com/xmtp/xmtp-js.git --config http.proxy=http://localhost:9910
```

## 推荐的开发流程

1. 克隆XMTP JS官方仓库
2. 安装必要的构建工具（yarn, turbo）
3. 构建SDK
4. 在项目中使用构建后的SDK
5. 创建自定义signer以适配ethers.js钱包
6. 正确处理IdentifierKind类型
7. 使用ES模块语法

## 安全注意事项

1. 避免使用npm上标记为"deprecated"的XMTP包
2. 优先使用官方GitHub仓库的代码
3. 验证包的发布者信息
4. 定期检查官方文档和安全公告

## 未来建议

1. 关注XMTP官方文档的更新
2. 考虑使用Docker容器化部署以避免环境兼容性问题
3. 在生产环境中使用Linux服务器以获得更好的兼容性
4. 定期更新XMTP SDK以获取最新功能和安全修复