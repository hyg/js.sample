# Jami 创业会议机器人

一个基于 Jami 的聊天机器人，专门用于创业筹备会议，引导对话、记录发言、组织表决，并自动生成结构化的创业协议。

## 功能特性

- **智能会议引导**: 按步骤引导创业筹备会议
- **实时表决系统**: 支持多种表决机制（全体同意、多数通过等）
- **发言记录**: 自动记录所有会议发言和讨论内容
- **协议生成**: 自动生成结构化的创业协议文档
- **角色层级**: 按任免关系定义角色层级
- **决策程序**: 按修订关系定义决策程序层级
- **插件系统**: 支持动态扩展和更新业务逻辑
- **多格式导出**: 支持 Markdown、JSON、HTML 格式导出

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
JAMI_ACCOUNT_ID=your-account-id
JAMI_DAEMON_HOST=localhost
JAMI_DAEMON_PORT=8080
```

### 3. 启动机器人

```bash
npm start
```

或使用开发模式：

```bash
npm run dev
```

## 使用方法

### 基本命令

在 Jami 对话中发送以下命令：

- `/start` - 开始创业筹备会议
- `/join` - 加入会议
- `/speak [内容]` - 发言
- `/vote [yes|no]` - 表决
- `/next` - 进入下一步
- `/status` - 查看会议状态
- `/help` - 显示帮助

### 会议流程

1. **介绍会议流程** - 介绍会议目的和流程
2. **确定会议参与者** - 确认所有参与者
3. **制定基本规则** - 制定会议基本规则
4. **讨论创业方向** - 讨论创业项目方向
5. **制定角色架构** - 定义各个角色和职责
6. **制定决策程序** - 建立决策机制和程序
7. **表决通过协议** - 对最终协议进行表决

### 协议结构

生成的创业协议包含以下部分：

- **前言** - 协议背景和目标
- **角色定义** - 按层级定义所有角色
- **决策程序** - 按层级定义所有决策程序
- **条款内容** - 所有决策条款
- **不产生决策的条款** - 说明性和参考性条款
- **修订历史** - 所有条款的修订记录
- **会议记录摘要** - 会议过程和统计信息

## 配置系统

### 业务逻辑配置

可以通过插件系统动态更新业务逻辑：

```javascript
// 在代码中更新配置
await bot.updatePluginConfig('business-logic', {
  meetingFlow: {
    steps: ['step1', 'step2', 'step3'],
    autoAdvance: true
  },
  voting: {
    defaultThreshold: 0.75,
    timeoutMinutes: 60
  }
});
```

### 自定义插件

创建自定义插件：

```javascript
class CustomPlugin {
  constructor() {
    this.name = 'custom-plugin';
    this.hooks = {
      'before_meeting_start': this.beforeStart.bind(this),
      'after_meeting_end': this.afterEnd.bind(this)
    };
  }

  async beforeStart(context, meetingData) {
    // 自定义会议开始前逻辑
    return context;
  }

  async afterEnd(context, meetingData) {
    // 自定义会议结束后逻辑
    return context;
  }
}

// 注册插件
bot.pluginManager.registerPlugin('custom', new CustomPlugin());
```

## 开发说明

### 项目结构

```
src/
├── core/                 # 核心功能
│   ├── jami-client.js    # Jami 客户端
│   └── meeting-manager.js # 会议管理
├── dialogue/             # 对话系统
│   └── dialogue-engine.js # 对话引擎
├── voting/               # 表决系统
│   └── voting-system.js   # 表决管理
├── agreement/            # 协议生成
│   └── agreement-generator.js # 协议生成器
├── hierarchy/            # 层级管理
│   └── hierarchy-manager.js # 层级管理器
├── config/               # 配置管理
│   ├── bot.config.js     # 主配置
│   └── plugins/          # 插件系统
└── index.js             # 主入口
```

### API 接口

#### 会议管理

```javascript
// 创建会议
const meeting = bot.meetingManager.createMeeting('startup', conversationId);

// 添加参与者
bot.meetingManager.addParticipant(meeting.id, participantId, name);

// 添加消息
bot.meetingManager.addMessage(meeting.id, participantId, message);

// 开始表决
const vote = bot.meetingManager.startVoting(meeting.id, proposal);
```

#### 协议生成

```javascript
// 生成协议
const agreement = bot.agreementGenerator.generateAgreement(meeting.id, 'markdown');

// 导出协议
const result = await bot.exportAgreement(meeting.id, 'json');
```

#### 层级管理

```javascript
// 计算角色层级
const level = bot.hierarchyManager.calculateRoleLevel(role, allRoles);

// 获取角色层级图
const hierarchy = bot.hierarchyManager.buildRoleHierarchy(roles);

// 验证层级完整性
const analysis = bot.hierarchyManager.getHierarchyAnalysis(roles, procedures);
```

## 测试

运行测试：

```bash
npm test
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License