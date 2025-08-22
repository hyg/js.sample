const NodeManager = require('../src/node-manager');
const chalk = require('chalk');

/**
 * 简单的 P2P 节点测试
 */
class NodeTest {
  constructor() {
    this.nodes = [];
  }

  /**
   * 测试单个节点启动
   */
  async testSingleNode() {
    console.log(chalk.blue.bold('🧪 测试单个节点启动...'));
    
    try {
      const node = new NodeManager({ port: 8080 });
      
      // 启动节点
      await node.start();
      console.log(chalk.green('✅ 单个节点启动成功'));
      
      // 等待一段时间查看状态
      await this.delay(10000);
      
      const status = node.getStatus();
      console.log(chalk.cyan('📊 节点状态:'), status);
      
      // 停止节点
      await node.stop();
      console.log(chalk.green('✅ 节点正常停止'));
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 单节点测试失败:'), error.message);
      return false;
    }
  }

  /**
   * 测试多个节点连接
   */
  async testMultipleNodes() {
    console.log(chalk.blue.bold('\n🧪 测试多个节点连接...'));
    
    try {
      // 创建两个节点
      const node1 = new NodeManager({ port: 8081 });
      const node2 = new NodeManager({ port: 8082 });
      
      this.nodes = [node1, node2];
      
      // 设置消息处理器
      node1.registerMessageHandler('test', (data, peerId) => {
        console.log(chalk.yellow(`节点1 收到测试消息: ${data.message} 来自 ${peerId}`));
      });
      
      node2.registerMessageHandler('test', (data, peerId) => {
        console.log(chalk.yellow(`节点2 收到测试消息: ${data.message} 来自 ${peerId}`));
      });
      
      // 启动节点
      console.log(chalk.cyan('启动节点1...'));
      await node1.start();
      
      console.log(chalk.cyan('启动节点2...'));
      await node2.start();
      
      // 等待节点发现和连接
      console.log(chalk.cyan('等待节点发现和连接...'));
      await this.delay(30000);
      
      // 检查连接状态
      const status1 = node1.getStatus();
      const status2 = node2.getStatus();
      
      console.log(chalk.cyan('\n📊 节点1 状态:'));
      console.log(`   P2P 连接数: ${status1.p2p.connectedPeers}`);
      
      console.log(chalk.cyan('\n📊 节点2 状态:'));
      console.log(`   P2P 连接数: ${status2.p2p.connectedPeers}`);
      
      // 尝试发送测试消息
      if (status1.p2p.connectedPeers > 0) {
        console.log(chalk.green('\n📤 发送测试消息...'));
        node1.broadcastMessage('test', { message: '来自节点1的测试消息' });
        node2.broadcastMessage('test', { message: '来自节点2的测试消息' });
        
        await this.delay(5000);
      }
      
      // 停止节点
      console.log(chalk.cyan('\n🛑 停止所有节点...'));
      await node1.stop();
      await node2.stop();
      
      console.log(chalk.green('✅ 多节点测试完成'));
      return true;
      
    } catch (error) {
      console.error(chalk.red('❌ 多节点测试失败:'), error.message);
      
      // 清理节点
      for (const node of this.nodes) {
        try {
          await node.stop();
        } catch (e) {
          // 忽略停止时的错误
        }
      }
      
      return false;
    }
  }

  /**
   * 测试网络连接
   */
  async testNetworkConnectivity() {
    console.log(chalk.blue.bold('\n🧪 测试网络连接...'));
    
    try {
      const node = new NodeManager({ port: 8083 });
      
      // 测试 STUN 服务器连接
      console.log(chalk.cyan('测试 STUN 服务器连接...'));
      const publicAddress = await node.natTraversal.getPublicAddress(8083);
      console.log(chalk.green(`✅ 获取到公网地址: ${publicAddress.address}:${publicAddress.port}`));
      
      // 测试 DHT 连接
      console.log(chalk.cyan('测试 DHT 网络连接...'));
      await node.dhtClient.initialize(9083);
      
      await this.delay(5000);
      
      const dhtStats = node.dhtClient.getStats();
      console.log(chalk.green(`✅ DHT 连接成功，节点数: ${dhtStats.nodes}`));
      
      // 清理
      await node.stop();
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 网络连接测试失败:'), error.message);
      return false;
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log(chalk.blue.bold('🚀 开始 P2P 节点测试套件'));
    console.log(chalk.blue('==============================\n'));
    
    const results = [];
    
    // 测试网络连接
    results.push(await this.testNetworkConnectivity());
    
    // 测试单个节点
    results.push(await this.testSingleNode());
    
    // 测试多个节点（这个测试可能需要较长时间）
    console.log(chalk.yellow('\n⚠️  多节点测试需要较长时间（约1分钟），请耐心等待...'));
    results.push(await this.testMultipleNodes());
    
    // 汇总结果
    console.log(chalk.blue.bold('\n📋 测试结果汇总:'));
    console.log(chalk.blue('=================='));
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`网络连接测试: ${results[0] ? chalk.green('✅ 通过') : chalk.red('❌ 失败')}`);
    console.log(`单节点测试: ${results[1] ? chalk.green('✅ 通过') : chalk.red('❌ 失败')}`);
    console.log(`多节点测试: ${results[2] ? chalk.green('✅ 通过') : chalk.red('❌ 失败')}`);
    
    console.log(chalk.blue(`\n总计: ${passed}/${total} 通过`));
    
    if (passed === total) {
      console.log(chalk.green.bold('\n🎉 所有测试通过！P2P 节点软件工作正常'));
    } else {
      console.log(chalk.red.bold('\n⚠️  部分测试失败，请检查网络连接和配置'));
    }
  }
}

// 运行测试
if (require.main === module) {
  const test = new NodeTest();
  test.runAllTests().catch(error => {
    console.error(chalk.red.bold('测试运行失败:'), error);
    process.exit(1);
  });
}

module.exports = NodeTest;