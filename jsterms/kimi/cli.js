#!/usr/bin/env node
const readline = require('readline');
const chalk = require('chalk');
const engine = require('./engine');

const rl = readline.createInterface({input:process.stdin, output:process.stdout});

engine.on('stateChanged', draw);

function draw(){
  console.clear();
  const s = engine.getStore();
  console.log(chalk.bold('=== 当前状态 ==='));
  console.log('Current State:', chalk.yellowBright(s.state));
  console.log('');

  console.log(chalk.bold('=== 系统事件 ==='));
  const def = engine.loadDefinition();
  Object.keys(def.events)
    .filter(ev=>!def.events[ev].params)
    .forEach(ev=>process.stdout.write(ev+' | '));
  console.log('\n');

  console.log(chalk.bold('=== 待完成任务 ==='));
  console.log('已添加:', s.tasks.join(', ') || '(无)');
  console.log('可用任务: reviewDocuments | prepareReport | approveBudgets | clearAllTasks');
  console.log('');

  console.log(chalk.bold('=== 允许的职权 ==='));
  console.log('已拥有:', s.allowed.join(', ') || '(无)');
  console.log('');

  console.log(chalk.bold('=== 禁止的职权 ==='));
  console.log(s.forbidden.join(', ') || '(无)');
  console.log('');
}

rl.on('line', line=>{
  const cmd = line.trim();
  if(!cmd) return rl.prompt();

  // 支持两种格式：event 或 addTask:xxx
  let event, params={};
  if(cmd.startsWith('addTask:')){
    event = 'addTask';
    params = {taskName: cmd.split(':')[1]};
  }else{
    event = cmd;
  }
  const res = engine.handleEvent(event, params);
  if(!res.ok){
    console.log(chalk.red('Error: '+res.reason));
  }
  rl.prompt();
});

// 初次绘制
draw();
rl.prompt();