const readline = require('readline');
const chalk = require('chalk');
const fsm = require('../fsm/engine');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.green('> ')
});

function displayStatus() {
  const status = fsm.getCurrentStatus();
  
  console.log('\n' + chalk.bold('=== 当前状态 ==='));
  console.log(chalk.blue(`Current State: ${status.currentState}`));

  // 显示系统事件
  console.log('\n' + chalk.bold('=== 系统事件 ==='));
  const systemEvents = status.events.filter(e => !['reviewDocuments', 'prepareReport', 'approveBudgets', 'exportData', 'clearAllTasks'].includes(e));
  console.log(`  ${systemEvents.join(' | ')}`);

  // 显示任务操作（直接作为事件）
  console.log('\n' + chalk.bold('=== 待完成任务（输入名称添加） ==='));
  const taskEvents = ['reviewDocuments', 'prepareReport', 'approveBudgets', 'clearAllTasks'];
  console.log(`  可用任务: ${taskEvents.join(' | ')}`);
  console.log(`  已添加任务: ${status.lists.tasks.length > 0 ? status.lists.tasks.join(' | ') : '无'}`);

  // 显示权限操作（直接作为事件）
  console.log('\n' + chalk.bold('=== 允许的职权（输入名称添加） ==='));
  const permEvents = ['viewDashboard', 'viewProfile', 'approveRequests', 'manageUsers', 'exportData'];
  console.log(`  可用权限: ${permEvents.join(' | ')}`);
  console.log(`  已拥有权限: ${status.lists.allowedPermissions.length > 0 ? status.lists.allowedPermissions.join(' | ') : '无'}`);

  // 显示禁止的职权
  console.log('\n' + chalk.bold('=== 禁止的职权 ==='));
  console.log(`  ${status.lists.forbiddenPermissions.length > 0 ? status.lists.forbiddenPermissions.join(' | ') : '无'}`);

  rl.prompt();
}

function startCliInterface() {
  console.log(chalk.cyan('=== CLI界面启动 ==='));
  console.log('输入事件名称触发操作（输入 exit 退出）');
  displayStatus();

  rl.on('line', (input) => {
    const inputTrimmed = input.trim();
    if (inputTrimmed === 'exit') {
      rl.close();
      process.exit(0);
    }

    fsm.handleEvent(inputTrimmed);
    displayStatus();
  });
}

module.exports = { startCliInterface };
