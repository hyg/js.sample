#!/usr/bin/env node

const JamiClient = require('./core/jami-client');
const MeetingManager = require('./core/meeting-manager');
const DialogueEngine = require('./dialogue/dialogue-engine');
const VotingSystem = require('./voting/voting-system');
const AgreementGenerator = require('./agreement/agreement-generator');
const HierarchyManager = require('./hierarchy/hierarchy-manager');
const PluginManager = require('./config/plugins/plugin-manager');
const BusinessLogicPlugin = require('./config/plugins/business-logic-plugin');

const config = require('./config/bot.config');

class JamiStartupBot {
  constructor() {
    this.jamiClient = new JamiClient(config.jami);
    this.meetingManager = new MeetingManager(config);
    this.votingSystem = new VotingSystem(this.meetingManager);
    this.agreementGenerator = new AgreementGenerator(this.meetingManager);
    this.hierarchyManager = new HierarchyManager();
    this.pluginManager = new PluginManager();
    this.dialogueEngine = null;
    
    this.running = false;
    this.conversations = new Map();
  }

  async initialize() {
    try {
      console.log('初始化 Jami 创业会议机器人...');
      
      // 连接到 Jami 守护进程
      await this.jamiClient.connect();
      console.log('已连接到 Jami 守护进程');

      // 初始化对话引擎
      this.dialogueEngine = new DialogueEngine(this.meetingManager, this.jamiClient);

      // 注册业务逻辑插件
      const businessLogicPlugin = new BusinessLogicPlugin();
      this.pluginManager.registerPlugin('business-logic', businessLogicPlugin);

      // 设置消息监听
      this.setupMessageHandlers();

      // 设置投票完成处理
      this.votingSystem.setVoteCompletedHandler(this.handleVoteCompleted.bind(this));

      console.log('机器人初始化完成');
      return true;
    } catch (error) {
      console.error('机器人初始化失败:', error);
      return false;
    }
  }

  setupMessageHandlers() {
    this.jamiClient.onMessage('textMessage', async (message) => {
      const conversationId = message.conversationId;
      const participantId = message.author;
      const participantName = message.displayName || participantId;
      const content = message.body;

      try {
        await this.dialogueEngine.handleMessage(
          conversationId, 
          content, 
          participantId, 
          participantName
        );
      } catch (error) {
        console.error('处理消息失败:', error);
        await this.jamiClient.sendMessage(
          conversationId, 
          '抱歉，处理消息时出现错误。请稍后再试。'
        );
      }
    });

    this.jamiClient.onMessage('conversationCreated', async (message) => {
      console.log('新对话创建:', message.conversationId);
    });

    this.jamiClient.onMessage('conversationUpdated', async (message) => {
      console.log('对话更新:', message.conversationId);
    });
  }

  async handleVoteCompleted(vote) {
    console.log('投票完成:', vote.id, '结果:', vote.result?.passed ? '通过' : '未通过');
    
    // 触发插件钩子
    await this.pluginManager.executeHook('after_vote', {
      vote: vote,
      timestamp: new Date()
    });
  }

  async start() {
    if (this.running) {
      console.log('机器人已在运行中');
      return;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      return;
    }

    this.running = true;
    console.log('Jami 创业会议机器人已启动');
    console.log('使用 /start 开始创业筹备会议');
    console.log('使用 /help 查看所有命令');

    // 保持运行
    process.on('SIGINT', async () => {
      console.log('\n正在关闭机器人...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n正在关闭机器人...');
      await this.stop();
      process.exit(0);
    });
  }

  async stop() {
    this.running = false;
    console.log('机器人已停止');
  }

  async getStatus() {
    return {
      running: this.running,
      activeMeetings: this.meetingManager.meetings.size,
      plugins: this.pluginManager.getPlugins(),
      uptime: process.uptime()
    };
  }

  async exportAgreement(meetingId, format = 'markdown') {
    try {
      const agreement = this.agreementGenerator.generateAgreement(meetingId, format);
      
      // 保存到文件
      const fs = require('fs');
      const path = require('path');
      
      const filename = `startup-agreement-${meetingId}.${format === 'markdown' ? 'md' : format}`;
      const filepath = path.join(process.cwd(), 'agreements', filename);
      
      // 确保目录存在
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filepath, agreement);
      
      return {
        success: true,
        filename: filepath,
        size: agreement.length
      };
    } catch (error) {
      console.error('导出协议失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updatePluginConfig(pluginName, config) {
    return this.pluginManager.setPluginConfig(pluginName, config);
  }

  async getPluginConfig(pluginName) {
    return this.pluginManager.getPluginConfig(pluginName);
  }
}

// 启动机器人
async function main() {
  const bot = new JamiStartupBot();
  
  // 命令行参数处理
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Jami 创业会议机器人

使用方法:
  node src/index.js [选项]

选项:
  --help, -h     显示帮助信息
  --version, -v  显示版本信息
  --config, -c   显示当前配置
  --export       导出协议文件

环境变量:
  JAMI_ACCOUNT_ID      Jami 账户ID
  JAMI_DAEMON_HOST     Jami 守护进程主机 (默认: localhost)
  JAMI_DAEMON_PORT     Jami 守护进程端口 (默认: 8080)
    `);
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('Jami 创业会议机器人 v1.0.0');
    return;
  }

  if (args.includes('--config') || args.includes('-c')) {
    console.log('当前配置:', JSON.stringify(config, null, 2));
    return;
  }

  if (args.includes('--export')) {
    // 导出示例协议
    const meeting = bot.meetingManager.createMeeting('startup', 'example');
    const agreement = bot.agreementGenerator.generateAgreement(meeting.id, 'markdown');
    console.log('示例协议:\n', agreement);
    return;
  }

  // 启动机器人
  await bot.start();
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 自动启动
if (require.main === module) {
  main().catch(console.error);
}

module.exports = JamiStartupBot;