class DialogueEngine {
  constructor(meetingManager, jamiClient) {
    this.meetingManager = meetingManager;
    this.jamiClient = jamiClient;
    this.conversationStates = new Map();
    this.commandHandlers = new Map();
    this.initCommandHandlers();
  }

  initCommandHandlers() {
    this.commandHandlers.set('/start', this.handleStart.bind(this));
    this.commandHandlers.set('/join', this.handleJoin.bind(this));
    this.commandHandlers.set('/speak', this.handleSpeak.bind(this));
    this.commandHandlers.set('/vote', this.handleVote.bind(this));
    this.commandHandlers.set('/next', this.handleNext.bind(this));
    this.commandHandlers.set('/status', this.handleStatus.bind(this));
    this.commandHandlers.set('/help', this.handleHelp.bind(this));
  }

  async handleMessage(conversationId, message, participantId, participantName) {
    const state = this.getConversationState(conversationId);
    
    // 检查是否是命令
    if (message.startsWith('/')) {
      const [command, ...args] = message.split(' ');
      const handler = this.commandHandlers.get(command);
      if (handler) {
        return await handler(conversationId, args.join(' '), participantId, participantName);
      }
    }

    // 处理普通消息
    return await this.handleRegularMessage(conversationId, message, participantId, participantName);
  }

  getConversationState(conversationId) {
    if (!this.conversationStates.has(conversationId)) {
      this.conversationStates.set(conversationId, {
        meeting: null,
        participants: new Map(),
        currentStep: 0,
        state: 'idle'
      });
    }
    return this.conversationStates.get(conversationId);
  }

  async handleStart(conversationId, args, participantId, participantName) {
    const state = this.getConversationState(conversationId);
    
    if (state.meeting) {
      return await this.sendMessage(conversationId, '会议已经开始，使用 /join 加入');
    }

    const meeting = this.meetingManager.createMeeting('startup', conversationId);
    state.meeting = meeting;
    state.state = 'meeting';

    await this.sendMessage(conversationId, 
      `🚀 创业筹备会议开始！\n\n` +
      `会议议程：\n` +
      meeting.agenda.map((item, index) => `${index + 1}. ${item}`).join('\n') +
      `\n\n使用 /join 加入会议，/help 查看帮助`
    );

    return await this.proceedToNextStep(conversationId);
  }

  async handleJoin(conversationId, args, participantId, participantName) {
    const state = this.getConversationState(conversationId);
    
    if (!state.meeting) {
      return await this.sendMessage(conversationId, '会议尚未开始，使用 /start 开始会议');
    }

    const success = this.meetingManager.addParticipant(state.meeting.id, participantId, participantName);
    if (success) {
      state.participants.set(participantId, participantName);
      await this.sendMessage(conversationId, `${participantName} 加入了会议`);
      
      if (state.participants.size === 1) {
        return await this.proceedToNextStep(conversationId);
      }
    }

    return success;
  }

  async handleSpeak(conversationId, message, participantId, participantName) {
    const state = this.getConversationState(conversationId);
    
    if (!state.meeting) {
      return await this.sendMessage(conversationId, '会议尚未开始');
    }

    if (!state.participants.has(participantId)) {
      return await this.sendMessage(conversationId, '请先使用 /join 加入会议');
    }

    const meeting = this.meetingManager.getMeeting(state.meeting.id);
    if (meeting.state === 'voting') {
      return await this.sendMessage(conversationId, '当前正在表决，请等待表决结束');
    }

    this.meetingManager.addMessage(state.meeting.id, participantId, message);
    
    // 根据当前步骤提供引导
    const currentStep = meeting.agenda[meeting.currentStep];
    let response = `${participantName} 发言已记录`;
    
    switch (currentStep) {
      case '介绍会议流程':
        response += '\n\n请每位参与者自我介绍，并说明期望的创业方向';
        break;
      case '确定会议参与者':
        response += '\n\n请确认所有参与者都已加入，然后我们将开始制定基本规则';
        break;
      case '制定基本规则':
        response += '\n\n请提出你认为重要的基本规则，例如：决策方式、股权分配原则等';
        break;
      case '讨论创业方向':
        response += '\n\n请分享你对创业项目的想法：市场机会、产品定位、商业模式等';
        break;
      case '制定角色架构':
        response += '\n\n请提出需要的角色：CEO、CTO、产品经理等，并说明职责';
        break;
      case '制定决策程序':
        response += '\n\n请提出决策机制：重大事项如何表决、日常决策如何执行等';
        break;
      case '表决通过协议':
        response += '\n\n准备进行最终表决，请确认所有内容是否已充分讨论';
        break;
    }

    return await this.sendMessage(conversationId, response);
  }

  async handleVote(conversationId, vote, participantId, participantName) {
    const state = this.getConversationState(conversationId);
    
    if (!state.meeting) {
      return await this.sendMessage(conversationId, '会议尚未开始');
    }

    if (!state.participants.has(participantId)) {
      return await this.sendMessage(conversationId, '请先使用 /join 加入会议');
    }

    const meeting = this.meetingManager.getMeeting(state.meeting.id);
    if (meeting.state !== 'voting') {
      return await this.sendMessage(conversationId, '当前没有进行表决');
    }

    const currentVote = meeting.votes[meeting.votes.length - 1];
    if (!currentVote || currentVote.status !== 'active') {
      return await this.sendMessage(conversationId, '当前没有进行表决');
    }

    const choice = vote.toLowerCase();
    if (!['yes', 'no'].includes(choice)) {
      return await this.sendMessage(conversationId, '请使用 /vote yes 或 /vote no');
    }

    this.meetingManager.castVote(state.meeting.id, currentVote.id, participantId, choice);
    
    const result = this.meetingManager.checkVoteResult(state.meeting.id, currentVote.id);
    
    if (result) {
      const status = result.passed ? '通过' : '未通过';
      await this.sendMessage(conversationId, 
        `表决结果：${status}\n` +
        `赞成：${result.yesVotes}/${result.threshold * 100}%\n` +
        `反对：${result.noVotes}`
      );

      if (result.passed) {
        return await this.proceedToNextStep(conversationId);
      }
    } else {
      const voted = Array.from(meeting.participants.values()).filter(p => p.hasVoted).length;
      const total = meeting.participants.size;
      await this.sendMessage(conversationId, `${participantName} 已投票 (${voted}/${total})`);
    }
  }

  async handleNext(conversationId, args, participantId, participantName) {
    const state = this.getConversationState(conversationId);
    
    if (!state.meeting) {
      return await this.sendMessage(conversationId, '会议尚未开始');
    }

    const meeting = this.meetingManager.getMeeting(state.meeting.id);
    if (meeting.state === 'voting') {
      return await this.sendMessage(conversationId, '当前正在表决，请等待表决结束');
    }

    // 检查是否有足够的参与者
    if (state.participants.size < 2) {
      return await this.sendMessage(conversationId, '需要至少2人参加会议');
    }

    return await this.proceedToNextStep(conversationId);
  }

  async handleStatus(conversationId, args, participantId, participantName) {
    const state = this.getConversationState(conversationId);
    
    if (!state.meeting) {
      return await this.sendMessage(conversationId, '会议尚未开始');
    }

    const meeting = this.meetingManager.getMeeting(state.meeting.id);
    const currentStep = meeting.agenda[meeting.currentStep];
    const participants = Array.from(state.participants.values()).join(', ');
    
    let status = `会议状态：${meeting.state}\n`;
    status += `当前步骤：${currentStep}\n`;
    status += `参与者：${participants}\n`;
    status += `消息数：${meeting.messages.length}\n`;
    status += `表决数：${meeting.votes.length}`;

    return await this.sendMessage(conversationId, status);
  }

  async handleHelp(conversationId, args, participantId, participantName) {
    const helpText = `
创业筹备会议机器人命令：

/start - 开始会议
/join - 加入会议
/speak [内容] - 发言
/vote [yes|no] - 表决
/next - 进入下一步
/status - 查看状态
/help - 显示帮助

会议流程：
1. 介绍会议流程
2. 确定会议参与者
3. 制定基本规则
4. 讨论创业方向
5. 制定角色架构
6. 制定决策程序
7. 表决通过协议

每次表决需要多数同意才能通过。
第一次表决需要全体同意。
    `;

    return await this.sendMessage(conversationId, helpText.trim());
  }

  async handleRegularMessage(conversationId, message, participantId, participantName) {
    // 将普通消息作为发言处理
    return await this.handleSpeak(conversationId, message, participantId, participantName);
  }

  async proceedToNextStep(conversationId) {
    const state = this.getConversationState(conversationId);
    const meeting = this.meetingManager.getMeeting(state.meeting.id);
    
    const nextStep = this.meetingManager.nextStep(state.meeting.id);
    
    if (nextStep === 'completed') {
      const agreementText = this.meetingManager.generateAgreementText(state.meeting.id);
      await this.sendMessage(conversationId, 
        `🎉 会议完成！\n\n` +
        `创业协议已生成：\n\n` +
        agreementText
      );
      return;
    }

    const currentStep = meeting.agenda[nextStep];
    let message = `进入第${nextStep + 1}步：${currentStep}\n\n`;

    switch (currentStep) {
      case '介绍会议流程':
        message += '请每位参与者自我介绍，并说明期望的创业方向。讨论结束后使用 /next 进入下一步。';
        break;
      case '确定会议参与者':
        message += '请确认所有参与者都已加入。完成后使用 /next 进入下一步。';
        break;
      case '制定基本规则':
        message += '请提出你认为重要的基本规则，例如：决策方式、股权分配原则等。讨论结束后表决。';
        break;
      case '讨论创业方向':
        message += '请分享你对创业项目的想法：市场机会、产品定位、商业模式等。讨论结束后表决。';
        break;
      case '制定角色架构':
        message += '请提出需要的角色：CEO、CTO、产品经理等，并说明职责。讨论结束后表决。';
        break;
      case '制定决策程序':
        message += '请提出决策机制：重大事项如何表决、日常决策如何执行等。讨论结束后表决。';
        break;
      case '表决通过协议':
        message += '请确认所有内容是否已充分讨论。准备进行最终表决。';
        break;
    }

    // 某些步骤需要表决
    if (['制定基本规则', '讨论创业方向', '制定角色架构', '制定决策程序', '表决通过协议'].includes(currentStep)) {
      const vote = this.meetingManager.startVoting(state.meeting.id, {
        step: currentStep,
        description: `是否同意${currentStep}的内容？`
      });
      
      message += '\n\n正在进行表决，请使用 /vote yes 或 /vote no';
    }

    return await this.sendMessage(conversationId, message);
  }

  async sendMessage(conversationId, message) {
    try {
      await this.jamiClient.sendMessage(conversationId, message);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  }
}

module.exports = DialogueEngine;