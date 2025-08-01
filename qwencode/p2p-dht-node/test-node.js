// 测试节点
const P2PNode = require('./src/node');

console.log('启动测试节点...');

async function test() {
  const node = new P2PNode({
    port: 0 // 随机端口
  });

  try {
    await node.start();
    console.log('节点启动成功');
    
    // 运行5秒后关闭
    setTimeout(async () => {
      console.log('测试完成，关闭节点...');
      await node.stop();
      process.exit(0);
    }, 5000);
  } catch (err) {
    console.error('节点启动失败:', err);
    process.exit(1);
  }
}

test();