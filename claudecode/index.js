const readline = require('readline-sync');
const colors = require('colors');
const DialogueManager = require('./src/DialogueManager');

async function main() {
    console.log('🤖 多轮对话工具启动...'.cyan);
    
    const manager = new DialogueManager();
    
    await manager.start();
}

main().catch(console.error);