const NodeManager = require('./node-manager');
const chalk = require('chalk');
const config = require('../config/config');

class P2PNode {
  constructor() {
    this.nodeManager = null;
    this.isShuttingDown = false;
  }

  /**
   * 启动节点
   */
  async start() {
    try {
      console.log(chalk.blue.bold('🌟 P2P 节点软件 v1.0.0'));
      console.log(chalk.blue('===================================='));
      
      // 解析命令行参数
      const args = this.parseArgs();
      
      // 创建节点管理器
      this.nodeManager = new NodeManager({
        port: args.port || config.node.defaultPort
      });

      // 注册自定义消息处理器
      this.setupCustomHandlers();

      // 设置优雅关闭
      this.setupGracefulShutdown();

      // 启动节点
      await this.nodeManager.start();
      
      console.log(chalk.green.bold('\n🎉 节点运行中...'));
      console.log(chalk.yellow('按 Ctrl+C 优雅关闭节点'));
      
      // 显示帮助信息
      this.showHelp();

    } catch (error) {
      console.error(chalk.red.bold('❌ 启动失败:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 解析命令行参数
   */
  parseArgs() {
    const args = {};
    const argv = process.argv.slice(2);
    
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--port' || argv[i] === '-p') {
        args.port = parseInt(argv[i + 1]);
        i++;
      } else if (argv[i] === '--help' || argv[i] === '-h') {
        this.showUsage();
        process.exit(0);
      }
    }
    
    return args;
  }

  /**
   * 设置自定义消息处理器
   */
  setupCustomHandlers() {
    // 自定义聊天消息处理器
    this.nodeManager.registerMessageHandler('chat', (data, peerId) => {
      console.log(chalk.cyan(`💬 [${peerId}]: ${data.message}`));
    });

    // 文件共享消息处理器
    this.nodeManager.registerMessageHandler('file_request', (data, peerId) => {
      console.log(chalk.magenta(`📁 文件请求 [${peerId}]: ${data.filename}`));
      // 这里可以实现文件共享逻辑
    });

    // 系统公告处理器
    this.nodeManager.registerMessageHandler('announcement', (data, peerId) => {
      console.log(chalk.yellow(`📢 系统公告 [${peerId}]: ${data.message}`));
    });
  }

  /**
   * 设置优雅关闭
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) {
        console.log(chalk.red('\n强制退出...'));
        process.exit(1);
      }
      
      this.isShuttingDown = true;
      console.log(chalk.yellow(`\n收到 ${signal} 信号，正在优雅关闭...`));
      
      try {
        if (this.nodeManager) {
          const availableNodes = await this.nodeManager.stop();
          
          // 显示可用的引导节点
          if (availableNodes && availableNodes.length > 0) {
            console.log(chalk.green.bold('\n🔗 当前可用的 IP 和端口（可作为今后的 DHT BOOTSTRAPS）:'));
            console.log(chalk.cyan('const bootstrapNodes = ['));
            availableNodes.forEach((node, index) => {
              const isLast = index === availableNodes.length - 1;
              console.log(chalk.cyan(`    { host: '${node.host}', port: ${node.port} }${isLast ? '' : ','}`));
            });
            console.log(chalk.cyan('];'));
          }
        }
        
        console.log(chalk.green.bold('\n✅ 节点已安全关闭'));
        process.exit(0);
      } catch (error) {
        console.error(chalk.red.bold('关闭时出错:'), error.message);
        process.exit(1);
      }
    };

    // 监听退出信号
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));

    // 监听未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error(chalk.red.bold('未捕获的异常:'), error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(chalk.red.bold('未处理的 Promise 拒绝:'), reason);
      shutdown('unhandledRejection');
    });
  }

  /**
   * 显示使用帮助
   */
  showUsage() {
    console.log(chalk.blue.bold('P2P 节点软件使用说明'));
    console.log(chalk.blue('==================='));
    console.log('\n用法: npm start [选项]');
    console.log('\n选项:');
    console.log('  -p, --port <端口>    指定监听端口 (默认: 8080)');
    console.log('  -h, --help          显示此帮助信息');
    console.log('\n示例:');
    console.log('  npm start');
    console.log('  npm start -- --port 9000');
  }

  /**
   * 显示运行时帮助
   */
  showHelp() {
    console.log(chalk.blue('\n💡 运行时命令:'));
    console.log(chalk.blue('================'));
    console.log('  • 查看状态: 节点会自动每 30 秒显示状态报告');
    console.log('  • 发送消息: 可通过编程接口发送自定义消息');
    console.log('  • 优雅关闭: 按 Ctrl+C 安全关闭并显示可用节点');
    console.log(chalk.blue('================\n'));
  }
}

// 创建并启动节点
const p2pNode = new P2PNode();
p2pNode.start().catch(error => {
  console.error(chalk.red.bold('启动失败:'), error);
  process.exit(1);
});

module.exports = P2PNode;