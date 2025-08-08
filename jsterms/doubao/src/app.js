const { startWebServer } = require('./web/server');
const { startCliInterface } = require('./cli/cli');

// 启动双界面服务
async function startApp() {
  console.log('启动有限状态机清单系统...');
  // 并行启动Web服务和CLI界面
  startWebServer();
  startCliInterface();
}

startApp();
