#!/usr/bin/env node

// 并行测试脚本 - 同时启动两个节点并监控发现过程
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动并行P2P节点测试...\n');

// 启动节点1
const node1 = spawn('node', ['node1.js'], {
  cwd: process.cwd()
});

console.log('=== 节点1输出 ===');
node1.stdout.on('data', (data) => {
  console.log(`[节点1] ${data}`);
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
    console.log(`[节点2] ${data}`);
  });

  node2.stderr.on('data', (data) => {
    console.error(`[节点2错误] ${data}`);
  });

  node2.on('close', (code) => {
    console.log(`[节点2] 进程退出，退出码: ${code}`);
  });
  
}, 5000);

// 60秒后停止所有测试
setTimeout(() => {
  console.log('\n=== 测试时间结束 ===');
  process.exit(0);
}, 60000);