const dbus = require('dbus-next');
const bus = dbus.systemBus();   // 关键替换

try {
    (async () => {
        const proxy = await bus.getProxyObject(
            'cx.ring.Ring',
            '/cx/ring/Ring/ConfigurationManager'
        );
        const cfg = proxy.getInterface('cx.ring.Ring.ConfigurationManager');
        console.log(await cfg.getAccountList());
    })();
} catch (err) {
    // 处理错误
    console.log("error:", err);
};
/* 
(async () => {
  // 获取 ConfigurationManager 代理
  const cfgProxy = await bus.getProxyObject('cx.ring.Ring',
                                           '/cx/ring/Ring/ConfigurationManager');
  const cfg = cfgProxy.getInterface('cx.ring.Ring.ConfigurationManager');

  // 1) 注册本地账号（首次运行）
  const account = await cfg.addAccount({
    'Account.type': 'RING',
    'Account.username': 'nodebot',
    'Account.alias': 'NodeBot',
    'Account.enabled': true
  });
  console.log('已注册账号:', account);

  // 2) 监听 incomingAccountMessage 信号
  cfg.on('incomingAccountMessage', (accountId, fromUri, payloads) => {
    const msg = payloads[0]['text/plain'];
    console.log(`收到 ${fromUri}: ${msg}`);

    // 3) 原样回写
    cfg.sendTextMessage(accountId, fromUri, [{ type: 'text/plain', value: `echo: ${msg}` }]);
  });
})(); */