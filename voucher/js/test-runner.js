#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 测试用例目录
const testCaseDir = path.join(__dirname, 'testcase');

// 获取所有测试用例
function getTestCases() {
  const testCases = [];
  
  // 读取testcase目录中的文件
  const files = fs.readdirSync(testCaseDir);
  
  // 找到所有的.txt文件作为测试用例
  files.forEach(file => {
    if (file.endsWith('.txt')) {
      const testCaseName = file.replace('.txt', '');
      const txtFile = file;
      const avrFile = `AVR.${testCaseName}.yaml`;
      const aerFile = `AER.${testCaseName}.yaml`;
      
      // 检查对应的AVR和AER文件是否存在
      if (files.includes(avrFile) && files.includes(aerFile)) {
        testCases.push({
          name: testCaseName,
          txtFile: path.join(testCaseDir, txtFile),
          avrFile: path.join(testCaseDir, avrFile),
          aerFile: path.join(testCaseDir, aerFile)
        });
      }
    }
  });
  
  return testCases;
}

// 显示测试用例列表
function listTestCases() {
  const testCases = getTestCases();
  
  console.log('可用的测试用例:');
  testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}`);
  });
}

// 运行单个测试用例
function runTestCase(testCaseName) {
  const testCases = getTestCases();
  const testCase = testCases.find(tc => tc.name === testCaseName);
  
  if (!testCase) {
    console.log(`未找到测试用例: ${testCaseName}`);
    return;
  }
  
  console.log(`运行测试用例: ${testCase.name}`);
  console.log(`原始凭证文件: ${testCase.txtFile}`);
  console.log(`预期AVR文件: ${testCase.avrFile}`);
  console.log(`预期AER文件: ${testCase.aerFile}`);
  
  // 读取原始凭证文件内容
  const txtContent = fs.readFileSync(testCase.txtFile, 'utf8');
  console.log('\n原始凭证内容:');
  console.log(txtContent);
  
  // 读取预期AVR文件内容
  const avrContent = fs.readFileSync(testCase.avrFile, 'utf8');
  console.log('\n预期AVR文件内容:');
  console.log(avrContent);
  
  // 读取预期AER文件内容
  const aerContent = fs.readFileSync(testCase.aerFile, 'utf8');
  console.log('\n预期AER文件内容:');
  console.log(aerContent);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    listTestCases();
    console.log('\n用法:');
    console.log('  node test-runner.js <测试用例名称>');
    console.log('  例如: node test-runner.js 299');
  } else {
    runTestCase(args[0]);
  }
}

// 如果是直接运行此脚本，则执行主函数
if (require.main === module) {
  main();
}