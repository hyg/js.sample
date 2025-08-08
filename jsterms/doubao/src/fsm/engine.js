const fs = require('fs');
const path = require('path');
const { actions, getGlobalState } = require('./actions');

const FSM_DEFINITION_PATH = path.join(__dirname, 'fsm-definition.json');

class FSM {
  constructor() {
    this.currentState = null;
    this.states = {};
    this.events = []; // 存储所有可触发事件
    this.loadDefinition();
  }

  loadDefinition() {
    try {
      const definition = JSON.parse(fs.readFileSync(FSM_DEFINITION_PATH, 'utf8'));
      this.states = definition.states;
      this.events = definition.events || []; // 加载全局事件清单
      this.currentState = this.currentState || definition.initialState;
      console.log(`[状态机] 已加载定义，当前状态: ${this.currentState}`);
    } catch (error) {
      console.error(`[状态机错误] 加载定义失败: ${error.message}`);
    }
  }

  handleEvent(eventName) {
    this.loadDefinition();
    const currentStateConfig = this.states[this.currentState];
    if (!currentStateConfig) {
      console.error(`[状态机错误] 无效状态: ${this.currentState}`);
      return;
    }

    const transition = currentStateConfig.transitions.find(t => t.event === eventName);
    if (!transition) {
      console.log(`[状态机] 状态 ${this.currentState} 不支持事件: ${eventName}`);
      return;
    }

    if (transition.actions && transition.actions.length > 0) {
      transition.actions.forEach(actionName => {
        if (actions[actionName]) {
          actions[actionName]();
        } else {
          console.warn(`[状态机警告] 未实现的动作: ${actionName}`);
        }
      });
    }

    this.currentState = transition.target;
    console.log(`[状态机] 事件 ${eventName} 触发状态转换: ${this.currentState}`);
  }

  getCurrentStatus() {
    return {
      currentState: this.currentState,
      lists: getGlobalState(),
      events: this.events // 新增：返回所有可触发事件
    };
  }
}

module.exports = new FSM();
