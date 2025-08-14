## 需求

为非IT专业的用户开发一个纯html的XMTP对话网页。

1. 打开网页就直接连接 inboxid: a98a974c554006bf56cb8661922317b2a1bae7150be90c12586c9b42adc36045 ，开始持续对话。
2. 今后还要围绕对话开发其它功能，因此不能直接跳转到 https://xmtp.chat （例如  https://xmtp.chat/dm/a98a974c554006bf56cb8661922317b2a1bae7150be90c12586c9b42adc36045 ），只能参考它的direct message功能进行独立开发.
3. 文档 https://raw.githubusercontent.com/xmtp/docs-xmtp-org/main/llms/llms-full.txt 可能有帮助。

### 用户环境

1. windows平台，没有安装任何编程语言的运行时；
2. 除了双击html文件，在浏览器以file://方式运行外，不具备任何其它操作的技能；
3. 计算机位于局域网，出口安装了NAT；
4. 被屏蔽了github和大部分CDN服务器；
5. 可以正常使用 https://xmtp.chat ，说明这个网页及其依赖url都可以正常访问。
