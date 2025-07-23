#!/usr/bin/env node

// 长时间并行测试脚本 - 同时启动两个节点并监控发现过程
const { spawn } = require('child_process');

console.log('🚀 启动长时间并行P2P节点测试...\n');

// 启动节点1
const node1 = spawn('node', ['node1.js'], {
  cwd: process.cwd()
});

console.log('=== 节点1输出 ===');
node1.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[节点1] ${output}`);
  
  // 检查是否发现节点
  if (output.includes('发现') && output.includes('个节点')) {
    console.log('🎉 [重要] 节点1发现了其他节点!');
  }
  
  // 检查是否收到消息
  if (output.includes('收到消息')) {
    console.log('📩 [重要] 节点1收到了消息!');
  }
});

node1.stderr.on('data', (data) => {
  console.error(`[节点1错误] ${data}`);
});

node1.on('close', (code) => {
  console.log(`[节点1] 进程退出，退出码: ${code}`);
});

// 等待几秒后启动节点2
setTimeout(() => {
  console.log('\n=== 5秒后启动节点2 ===');
  
  const node2 = spawn('node', ['node2.js'], {
    cwd: process.cwd()
  });

  console.log('\n=== 节点2输出 ===');
  node2.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[节点2] ${output}`);
    
    // 检查是否发现节点
    if (output.includes('发现') && output.includes('个节点')) {
      console.log('🎉 [重要] 节点2发现了其他节点!');
    }
    
    // 检查是否收到消息
    if (output.includes('收到消息')) {
      console.log('📩 [重要] 节点2收到了消息!');
    }
  });

  node2.stderr.on('data', (data) => {
    console.error(`[节点2错误] ${data}`);
  });

  node2.on('close', (code) => {
    console.log(`[节点2] 进程退出，退出码: ${code}`);
  });
  
}, 5000);

// 120秒后停止所有测试
setTimeout(() => {
  console.log('\n=== 测试时间结束 ===');
  process.exit(0);
}, 120000);