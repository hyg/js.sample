# IRC 聊天客户端

这是一个使用 Node.js 开发的命令行 IRC 聊天客户端。

## 功能

- 连接到 IRC 服务器
- 加入频道
- 发送和接收频道消息
- 基本的错误处理和日志记录

## 使用方法

1. 安装依赖: `pnpm install`
2. 运行客户端: `node index.js`
3. 在命令行中输入消息，格式为 `#channel message` 或 `nick message`

## 服务器配置

目前配置的服务器是 `irc.kampungchat.org` 端口 `6667`。这个服务器可能需要注册账户才能正常使用。

## 日志

客户端会将调试日志写入 `irc_debug.log` 文件。

## 测试

`sender.js` 和 `receiver.js` 是两个简单的测试脚本，用于演示两个客户端之间的基本消息收发。