const P2PNode = require('../src/index');
const NodeManager = require('../src/node-manager');

async function runTests() {
  console.log('Running P2P Node tests...\n');

  // 测试1: 节点管理器创建
  console.log('Test 1: NodeManager creation...');
  const nodeManager = new NodeManager({
    magnetUri: 'magnet:?xt=urn:btih:test1234567890',
    tcpPort: 0,
    udpPort: 0,
    dhtPort: 6882
  });
  console.log('✓ NodeManager created successfully');

  // 测试2: 启动节点
  console.log('\nTest 2: Starting node...');
  try {
    await nodeManager.start();
    console.log('✓ Node started successfully');
  } catch (error) {
    console.error('✗ Failed to start node:', error.message);
    return;
  }

  // 测试3: 获取本地地址
  console.log('\nTest 3: Getting local address...');
  const localAddr = nodeManager.getLocalAddress();
  console.log('✓ Local address:', localAddr);

  // 测试4: 广播测试消息
  console.log('\nTest 4: Broadcasting test message...');
  const testMessage = JSON.stringify({
    type: 'test',
    content: 'Hello from test',
    timestamp: Date.now()
  });
  
  try {
    await nodeManager.broadcastMessage(testMessage);
    console.log('✓ Test message broadcasted');
  } catch (error) {
    console.error('✗ Failed to broadcast message:', error.message);
  }

  // 测试5: 获取节点列表
  console.log('\nTest 5: Getting node list...');
  const nodes = nodeManager.getDiscoveredNodes();
  console.log(`✓ Found ${nodes.length} nodes`);

  // 等待几秒钟让DHT工作
  console.log('\nWaiting 5 seconds for DHT discovery...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 再次检查节点
  const updatedNodes = nodeManager.getDiscoveredNodes();
  console.log(`✓ After discovery: ${updatedNodes.length} nodes`);

  // 测试6: 停止节点
  console.log('\nTest 6: Stopping node...');
  try {
    await nodeManager.stop();
    console.log('✓ Node stopped successfully');
  } catch (error) {
    console.error('✗ Failed to stop node:', error.message);
  }

  console.log('\nAll tests completed!');
}

// 如果直接运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };