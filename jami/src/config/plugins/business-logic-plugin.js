class BusinessLogicPlugin {
  constructor() {
    this.name = 'business-logic';
    this.defaultConfig = {
      meetingFlow: {
        steps: [
          'introduction',
          'participant-setup',
          'basic-rules',
          'direction-discussion',
          'role-definition',
          'procedure-definition',
          'final-agreement'
        ],
        autoAdvance: false,
        requireUnanimousFirst: true
      },
      voting: {
        defaultThreshold: 0.67,
        timeoutMinutes: 30,
        allowAbstention: true,
        voteWeights: {
          'founder': 2.0,
          'co-founder': 1.5,
          'member': 1.0
        }
      },
      agreement: {
        sections: ['preface', 'roles', 'procedures', 'terms', 'misc'],
        formats: ['markdown', 'json', 'html'],
        includeHistory: true
      }
    };

    this.hooks = {
      'before_meeting_start': this.beforeMeetingStart.bind(this),
      'after_meeting_end': this.afterMeetingEnd.bind(this),
      'before_vote': this.beforeVote.bind(this),
      'after_vote': this.afterVote.bind(this),
      'generate_agreement': this.generateAgreement.bind(this),
      'validate_proposal': this.validateProposal.bind(this)
    };
  }

  async beforeMeetingStart(context, meetingData) {
    console.log('会议开始前检查...');
    
    // 检查最小参与者数量
    if (meetingData.participants?.length < 2) {
      return {
        ...context,
        warning: '建议至少2人参与会议'
      };
    }

    // 设置默认配置
    return {
      ...context,
      config: {
        ...this.defaultConfig,
        ...context.config
      }
    };
  }

  async afterMeetingEnd(context, meetingData) {
    console.log('会议结束处理...');
    
    // 生成协议摘要
    const summary = {
      duration: meetingData.endTime - meetingData.startTime,
      participants: meetingData.participants?.length || 0,
      votes: meetingData.votes?.length || 0,
      messages: meetingData.messages?.length || 0,
      agreements: meetingData.agreement?.sections?.terms?.length || 0
    };

    return {
      ...context,
      summary,
      nextSteps: this.generateNextSteps(meetingData)
    };
  }

  async beforeVote(context, voteData) {
    console.log('投票前验证...');
    
    // 检查提案有效性
    const validation = this.validateProposal(voteData.proposal);
    if (!validation.valid) {
      return {
        ...context,
        error: validation.error
      };
    }

    // 检查投票权限
    const hasPermission = this.checkVotingPermission(voteData.participants, voteData.proposal);
    if (!hasPermission.valid) {
      return {
        ...context,
        error: hasPermission.error
      };
    }

    return context;
  }

  async afterVote(context, voteResult) {
    console.log('投票后处理...');
    
    // 记录投票结果
    const record = {
      id: voteResult.id,
      proposal: voteResult.proposal,
      result: voteResult.result,
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      voteRecord: record
    };
  }

  async generateAgreement(context, agreementData) {
    console.log('生成协议...');
    
    // 添加标准条款
    const standardTerms = this.getStandardTerms();
    const enhancedAgreement = {
      ...agreementData,
      sections: {
        ...agreementData.sections,
        terms: [...agreementData.sections.terms, ...standardTerms]
      }
    };

    return enhancedAgreement;
  }

  validateProposal(proposal) {
    if (!proposal || typeof proposal !== 'object') {
      return { valid: false, error: '提案格式无效' };
    }

    if (!proposal.title || !proposal.content) {
      return { valid: false, error: '提案必须包含标题和内容' };
    }

    if (proposal.type === 'role' &. !proposal.responsibilities) {
      return { valid: false, error: '角色提案必须包含职责描述' };
    }

    if (proposal.type === 'procedure' &. !proposal.threshold) {
      return { valid: false, error: '程序提案必须包含表决阈值' };
    }

    return { valid: true };
  }

  checkVotingPermission(participants, proposal) {
    if (!participants || participants.length < 2) {
      return { valid: false, error: '至少需要2人参与投票' };
    }

    return { valid: true };
  }

  generateNextSteps(meetingData) {
    const steps = [];

    if (meetingData.agreement?.sections?.terms?.length === 0) {
      steps.push('需要制定基本条款');
    }

    if (meetingData.agreement?.sections?.roles?.length === 0) {
      steps.push('需要定义角色架构');
    }

    if (meetingData.agreement?.sections?.procedures?.length === 0) {
      steps.push('需要建立决策程序');
    }

    steps.push('准备公司注册材料');
    steps.push('制定详细实施计划');

    return steps;
  }

  getStandardTerms() {
    return [
      {
        id: 'confidentiality',
        title: '保密条款',
        content: '所有会议参与者须对讨论内容保密',
        revisedBy: 'majority_vote'
      },
      {
        id: 'good_faith',
        title: '诚信原则',
        content: '所有参与者须本着诚信原则参与讨论和决策',
        revisedBy: 'unanimous_vote'
      },
      {
        id: 'dispute_resolution',
        title: '争议解决',
        content: '争议应通过协商解决，必要时可寻求第三方调解',
        revisedBy: 'majority_vote'
      }
    ];
  }

  // 动态更新业务逻辑
  updateConfig(newConfig) {
    this.defaultConfig = {
      ...this.defaultConfig,
      ...newConfig
    };
    console.log('业务逻辑配置已更新');
  }

  // 获取当前配置
  getConfig() {
    return this.defaultConfig;
  }

  // 验证配置
  validateConfig(config) {
    const errors = [];

    if (config.meetingFlow?.steps?.length < 3) {
      errors.push('会议流程至少需要3个步骤');
    }

    if (config.voting?.defaultThreshold < 0.5 || config.voting?.defaultThreshold > 1) {
      errors.push('表决阈值必须在0.5到1之间');
    }

    if (config.voting?.timeoutMinutes < 5) {
      errors.push('投票超时时间不能少于5分钟');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = BusinessLogicPlugin;