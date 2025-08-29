本文档不允许自动修改。如有错漏、补充可以直接提示用户。

1. 使用nodejs开发两个节点软件，用html开发一个静态页面。它们运行在安装NAT的不同局域网内，通过MQTT互相通信。
1. 节点A是PSMD项目的受托者，启动后就等候连接。
1. 节点B是PSMD项目的委托者，可能有许多安装实例，启动后连接节点A，建立连接然后对话。
1. 节点A、B都在命令行提示用户输入信息，显示其它节点发来的信息。
1. 网页C的功能和节点B相同，运行在浏览器环境，不依赖任何本地环境。

Broker:
broker.emqx.io
TCP 端口:
1883
WebSocket 端口:
8083
SSL/TLS 端口:
8883
WebSocket Secure 端口:
8084
QUIC 端口:
14567
CA 证书文件:
broker.emqx.io-ca.crt