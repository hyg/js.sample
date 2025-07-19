class VotingSystem {
  constructor(meetingManager) {
    this.meetingManager = meetingManager;
    this.activeVotes = new Map();
    this.voteTimers = new Map();
  }

  createVote(meetingId, proposal, procedure = null, options = {}) {
    const meeting = this.meetingManager.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('会议不存在');
    }

    const vote = {
      id: this.generateVoteId(),
      meetingId,
      proposal,
      procedure,
      type: options.type || 'standard', // standard, unanimous, special
      threshold: this.calculateThreshold(meeting, options),
      participants: Array.from(meeting.participants.keys()),
      votes: new Map(),
      abstentions: new Set(),
      status: 'active',
      startTime: new Date(),
      endTime: null,
      timeout: options.timeout || 30 * 60 * 1000, // 30分钟默认
      result: null,
      metadata: {
        creator: options.creator,
        description: options.description,
        category: options.category || 'general'
      }
    };

    // 设置投票超时
    this.setVoteTimeout(vote);
    
    this.activeVotes.set(vote.id, vote);
    meeting.votes.push(vote);

    return vote;
  }

  calculateThreshold(meeting, options) {
    if (options.threshold) {
      return options.threshold;
    }

    // 第一次表决需要全体同意
    if (meeting.votes.length === 0) {
      return 1.0; // 100%
    }

    // 检查是否有生效的协议规定
    const agreement = meeting.agreement;
    if (agreement.sections.procedures.length > 0) {
      const relevantProcedure = agreement.sections.procedures.find(p => 
        p.appliesTo === options.category
      );
      if (relevantProcedure && relevantProcedure.threshold) {
        return relevantProcedure.threshold;
      }
    }

    // 默认阈值
    return 0.67; // 2/3多数
  }

  castVote(voteId, participantId, choice, options = {}) {
    const vote = this.activeVotes.get(voteId);
    if (!vote || vote.status !== 'active') {
      throw new Error('投票不存在或已结束');
    }

    const meeting = this.meetingManager.getMeeting(vote.meetingId);
    if (!meeting) {
      throw new Error('会议不存在');
    }

    if (!vote.participants.includes(participantId)) {
      throw new Error('无投票权限');
    }

    // 检查是否已投票
    if (vote.votes.has(participantId)) {
      if (!options.allowChange) {
        throw new Error('已投票，不允许修改');
      }
    }

    // 记录投票
    vote.votes.set(participantId, {
      choice,
      timestamp: new Date(),
      weight: this.calculateVoteWeight(meeting, participantId)
    });

    // 检查是否达到表决条件
    this.checkVoteCompletion(vote);

    return vote;
  }

  calculateVoteWeight(meeting, participantId) {
    // 根据角色权重计算投票权重
    const participant = meeting.participants.get(participantId);
    if (!participant || !participant.role) {
      return 1.0;
    }

    // 检查协议中是否有权重规定
    const agreement = meeting.agreement;
    if (agreement.sections.roles.length > 0) {
      const roleDefinition = agreement.sections.roles
        .flat()
        .find(r => r.name === participant.role);
      
      if (roleDefinition && roleDefinition.voteWeight) {
        return roleDefinition.voteWeight;
      }
    }

    return 1.0;
  }

  abstainFromVote(voteId, participantId) {
    const vote = this.activeVotes.get(voteId);
    if (!vote || vote.status !== 'active') {
      throw new Error('投票不存在或已结束');
    }

    vote.abstentions.add(participantId);
    vote.votes.set(participantId, {
      choice: 'abstain',
      timestamp: new Date(),
      weight: 0
    });

    this.checkVoteCompletion(vote);
    return vote;
  }

  checkVoteCompletion(vote) {
    const meeting = this.meetingManager.getMeeting(vote.meetingId);
    if (!meeting) return;

    const totalParticipants = vote.participants.length;
    const votesCast = vote.votes.size;
    const abstentionCount = vote.abstentions.size;
    const validVotes = votesCast - abstentionCount;

    // 检查是否所有人都投票
    if (votesCast < totalParticipants) {
      return; // 继续等待投票
    }

    // 计算投票结果
    const votesByChoice = this.aggregateVotes(vote);
    const totalWeight = Array.from(vote.votes.values())
      .filter(v => v.choice !== 'abstain')
      .reduce((sum, v) => sum + v.weight, 0);

    const yesWeight = votesByChoice.get('yes') || 0;
    const noWeight = votesByChoice.get('no') || 0;

    // 计算通过比例
    const passRatio = totalWeight > 0 ? yesWeight / totalWeight : 0;
    const passed = passRatio >= vote.threshold;

    // 结束投票
    this.finalizeVote(vote, {
      passed,
      yesWeight,
      noWeight,
      abstentionCount,
      totalWeight,
      passRatio,
      threshold: vote.threshold
    });
  }

  aggregateVotes(vote) {
    const results = new Map();
    
    for (const [participantId, voteData] of vote.votes) {
      if (voteData.choice === 'abstain') continue;
      
      const current = results.get(voteData.choice) || 0;
      results.set(voteData.choice, current + voteData.weight);
    }

    return results;
  }

  finalizeVote(vote, result) {
    vote.status = 'completed';
    vote.endTime = new Date();
    vote.result = {
      ...result,
      finalizedAt: new Date()
    };

    // 清除超时定时器
    if (this.voteTimers.has(vote.id)) {
      clearTimeout(this.voteTimers.get(vote.id));
      this.voteTimers.delete(vote.id);
    }

    // 应用投票结果
    if (result.passed) {
      this.applyVoteResult(vote);
    }

    // 触发事件
    this.emitVoteCompleted(vote);
  }

  applyVoteResult(vote) {
    const meeting = this.meetingManager.getMeeting(vote.meetingId);
    if (!meeting) return;

    // 根据投票类型应用结果
    if (vote.procedure) {
      // 这是程序定义投票
      meeting.agreement.sections.procedures.push({
        ...vote.proposal,
        id: vote.id,
        approvedBy: vote.id,
        approvedAt: new Date(),
        revisionHistory: [{
          version: 1,
          approvedAt: new Date(),
          changes: '初始制定'
        }]
      });
    } else {
      // 这是条款投票
      meeting.agreement.sections.terms.push({
        ...vote.proposal,
        id: vote.id,
        approvedBy: vote.id,
        approvedAt: new Date(),
        revisionHistory: [{
          version: 1,
          approvedAt: new Date(),
          changes: '初始制定'
        }]
      });
    }

    meeting.agreement.lastModified = new Date();
  }

  setVoteTimeout(vote) {
    const timer = setTimeout(() => {
      this.handleVoteTimeout(vote.id);
    }, vote.timeout);

    this.voteTimers.set(vote.id, timer);
  }

  handleVoteTimeout(voteId) {
    const vote = this.activeVotes.get(voteId);
    if (!vote || vote.status !== 'active') return;

    const meeting = this.meetingManager.getMeeting(vote.meetingId);
    if (!meeting) return;

    // 计算超时时的结果
    const votesByChoice = this.aggregateVotes(vote);
    const totalWeight = Array.from(vote.votes.values())
      .filter(v => v.choice !== 'abstain')
      .reduce((sum, v) => sum + v.weight, 0);

    const yesWeight = votesByChoice.get('yes') || 0;
    const passRatio = totalWeight > 0 ? yesWeight / totalWeight : 0;
    const passed = passRatio >= vote.threshold;

    this.finalizeVote(vote, {
      passed,
      yesWeight,
      noWeight: votesByChoice.get('no') || 0,
      abstentionCount: vote.abstentions.size,
      totalWeight,
      passRatio,
      threshold: vote.threshold,
      timedOut: true
    });
  }

  getVoteStatus(voteId) {
    const vote = this.activeVotes.get(voteId);
    if (!vote) return null;

    const votesByChoice = this.aggregateVotes(vote);
    const totalParticipants = vote.participants.length;
    const votesCast = vote.votes.size;
    const abstentionCount = vote.abstentions.size;

    return {
      id: vote.id,
      status: vote.status,
      proposal: vote.proposal,
      participants: totalParticipants,
      votesCast,
      abstentionCount,
      pendingVotes: totalParticipants - votesCast,
      results: {
        yes: votesByChoice.get('yes') || 0,
        no: votesByChoice.get('no') || 0,
        abstain: abstentionCount
      },
      threshold: vote.threshold,
      timeRemaining: vote.status === 'active' 
        ? Math.max(0, vote.timeout - (Date.now() - vote.startTime.getTime()))
        : 0
    };
  }

  cancelVote(voteId, reason = '手动取消') {
    const vote = this.activeVotes.get(voteId);
    if (!vote || vote.status !== 'active') {
      throw new Error('投票不存在或已结束');
    }

    vote.status = 'cancelled';
    vote.endTime = new Date();
    vote.result = {
      cancelled: true,
      reason,
      cancelledAt: new Date()
    };

    // 清除超时定时器
    if (this.voteTimers.has(voteId)) {
      clearTimeout(this.voteTimers.get(voteId));
      this.voteTimers.delete(voteId);
    }

    this.activeVotes.delete(voteId);
    return vote;
  }

  generateVoteId() {
    return `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  emitVoteCompleted(vote) {
    // 可以在这里添加事件监听器
    if (this.onVoteCompleted) {
      this.onVoteCompleted(vote);
    }
  }

  setVoteCompletedHandler(handler) {
    this.onVoteCompleted = handler;
  }

  // 获取会议的所有投票历史
  getMeetingVotes(meetingId) {
    const meeting = this.meetingManager.getMeeting(meetingId);
    if (!meeting) return [];

    return meeting.votes.map(vote => ({
      id: vote.id,
      proposal: vote.proposal,
      status: vote.status,
      result: vote.result,
      participants: vote.participants.length,
      votes: vote.votes.size
    }));
  }

  // 验证投票资格
  canVote(voteId, participantId) {
    const vote = this.activeVotes.get(voteId);
    if (!vote || vote.status !== 'active') {
      return { canVote: false, reason: '投票不存在或已结束' };
    }

    const meeting = this.meetingManager.getMeeting(vote.meetingId);
    if (!meeting) {
      return { canVote: false, reason: '会议不存在' };
    }

    if (!vote.participants.includes(participantId)) {
      return { canVote: false, reason: '无投票权限' };
    }

    if (vote.votes.has(participantId)) {
      return { canVote: false, reason: '已投票' };
    }

    return { canVote: true };
  }
}

module.exports = VotingSystem;