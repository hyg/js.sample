import chalk from 'chalk';
import 'dotenv/config';
import { DialogueManager } from './services/DialogueManager.js';

const dialogueManager = new DialogueManager();

async function startInteractiveDialogue() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(chalk.blue.bold('🚀 多轮对话分析工具启动\n'));
  console.log(chalk.blue('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
  console.log(chalk.blue('┃  🤖 4步智能对话分析神器        ┃'));
  console.log(chalk.blue('┃  ① OpenAI兼容对话             ┃'));
  console.log(chalk.blue('┃  ② 豆包NER+RE分析             ┃'));
  console.log(chalk.blue('┃  ③ Mistral三元组稳定分析     ┃'));
  console.log(chalk.blue('┃  ④ 可视化递归深入探讨         ┃')); 
  console.log(chalk.blue('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n'));

  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  try {
    const systemPrompt = await askQuestion(chalk.green('请输入系统提示词: '));
    const userQuestion = await askQuestion(chalk.green('请输入您的问题: '));
    
    if (!systemPrompt || !userQuestion) {
      console.log(chalk.red('❌ 提示词和问题不能为空'));
      process.exit(1);
    }

    console.log(chalk.yellow('\n🔄 开始多维分析...\n'));
    
    const startTime = Date.now();
    await dialogueManager.startDialogue(systemPrompt, userQuestion);
    const duration = (Date.now() - startTime) / 1000;

    displayAnalysisSummary(duration);
    
    await handleExportOptions(rl);

  } catch (error) {
    console.error(chalk.red('❌ 分析失败:'), error.message);
  } finally {
    rl.close();
  }
}

function displayAnalysisSummary(duration) {
  const summary = dialogueManager.exportResults().summary;
  
  console.log(chalk.green.bold('\n🎉 分析完成!'));
  console.log(chalk.blue('='.repeat(50)));
  console.log(chalk.yellow(`├─ 分析节点总数: ${summary.totalNodes}`));
  console.log(chalk.yellow(`├─ 最大分析深度: ${summary.maxDepth}`));
  console.log(chalk.yellow(`└─ 处理耗时: ${duration.toFixed(1)}秒`));
  console.log(chalk.blue('='.repeat(50)));
}

async function handleExportOptions(rl) {
  console.log('\n💾 保存选项:');
  console.log(' 1) 保存完整Mermaid图表');
  console.log(' 2) 导出JSON数据');
  console.log(' 3) 显示最终分析树'); 
  console.log(' 0) 退出\n');

  const answer = await new Promise(resolve => {
    rl.question('选择: ', resolve);
  });

  switch (answer.trim()) {
    case '1':
      const fs = await import('fs');
      const mermaid = dialogueManager.generateFullMermaid();
      fs.writeFileSync('mermaid-diagram.md', mermaid);
      console.log(chalk.green('✅ 图表已保存至: mermaid-diagram.md'));
      break;
      
    case '2':
      const fs2 = await import('fs');
      const results = dialogueManager.exportResults();
      fs2.writeFileSync('analysis-results.json', JSON.stringify(results, null, 2));
      console.log(chalk.green('✅ 数据已保存至: analysis-results.json'));
      break;

    case '3':
      console.log(dialogueManager.generateFullMermaid());
      break;
  }
}

async function runQuickTest() {
  console.log(chalk.blue('🔬 运行快速测试...\n'));

  const testPrompt = '你是一位专业的领域专家，请提供准确、有深度的回答。';
  const testQuestion = '如何平衡人工智能发展与伦理规范的关系？具体需要考虑哪些方面？';

  try {
    await dialogueManager.startDialogue(testPrompt, testQuestion);
    
    console.log(chalk.green('\n✅ 测试完成!'));
    const summary = dialogueManager.exportResults().summary;
    console.log(`   总节点: ${summary.totalNodes} | 深度: ${summary.maxDepth}`);

  } catch (error) {
    console.error(chalk.red('❌ 测试失败:'), error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await runQuickTest();
  } else if (args.includes('--batch')) {
    console.log('批处理模式: 请提供JSON配置文件');
  } else {
    await startInteractiveDialogue();
  }
}

main().catch(console.error);