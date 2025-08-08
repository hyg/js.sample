/*
  状态机引擎
  职责：加载配置、执行动作、持久化 store、事件广播
*/
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const EventEmitter = require('events');

const STORE_PATH = path.join(__dirname, 'store.json');
const DEF_PATH   = path.join(__dirname, 'fsm-definition.json');

class Engine extends EventEmitter {
  constructor() {
    super();
    this.store = this.loadStore();
    this.definition = this.loadDefinition();
    this.watchDefinition();
  }

  /* ---- 文件 I/O ---- */
  loadStore() {
    if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify({state:null,tasks:[],allowed:[],forbidden:[]},null,2));
    return JSON.parse(fs.readFileSync(STORE_PATH,'utf8'));
  }
  flushStore() {
    fs.writeFileSync(STORE_PATH, JSON.stringify(this.store,null,2));
  }
  loadDefinition() {
    return JSON.parse(fs.readFileSync(DEF_PATH,'utf8'));
  }
  watchDefinition() {
    chokidar.watch(DEF_PATH).on('change',()=>{
      this.definition = this.loadDefinition();
      this.emit('definitionReloaded');
      this.emit('stateChanged',this.store);
    });
  }

  /* ---- 事件处理 ---- */
  handleEvent(event, params={}) {
    const current = this.store.state;
    const rules = this.definition.states[current]?.transitions[event];
    if (!rules) return {ok:false, reason:'Event not allowed in current state'};

    // 执行动作
    for (const actionStr of rules.actions) {
      this.executeAction(actionStr, params);
    }

    // 切换状态
    this.store.state = rules.target;
    this.flushStore();
    this.emit('stateChanged', this.store);
    return {ok:true};
  }

  executeAction(str, params) {
    const [verb, ...rest] = str.split(':');
    const args = rest.join(':').split(',');
    switch (verb) {
      case 'addPermissions':
        for (const p of args) if (!this.store.allowed.includes(p)) this.store.allowed.push(p);
        break;
      case 'removePermissions':
        this.store.allowed = this.store.allowed.filter(p=>!args.includes(p));
        break;
      case 'movePermissions': {
        const [from,to] = args.pop().split('->');
        const list = args;
        if (from === 'Forbidden' && to === 'Allowed') {
          this.store.forbidden = this.store.forbidden.filter(p=>!list.includes(p));
          for (const p of list) if (!this.store.allowed.includes(p)) this.store.allowed.push(p);
        }
        if (from === 'Allowed' && to === 'Forbidden') {
          this.store.allowed = this.store.allowed.filter(p=>!list.includes(p));
          for (const p of list) if (!this.store.forbidden.includes(p)) this.store.forbidden.push(p);
        }
        break;
      }
      case 'addTask': {
        const taskName = params.taskName || args[0];
        if (taskName && !this.store.tasks.includes(taskName)) this.store.tasks.push(taskName);
        break;
      }
      case 'removeTask':
        this.store.tasks = this.store.tasks.filter(t=>t!==args[0]);
        break;
      case 'clearTasks':
        this.store.tasks = [];
        break;
      case 'clearPermissions':
        this.store.allowed = [];
        this.store.forbidden = [];
        break;
    }
  }

  getStore() { return this.store; }
}

module.exports = new Engine();