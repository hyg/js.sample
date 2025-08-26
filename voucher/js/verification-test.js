const fs = require('fs');

// 引入voucher.js中的函数
const { parseVoucherText, generateYamlContent } = require('./voucher.js');

// 测试299号凭证
console.log('=== 测试299号凭证 ===');
try {
  const content299 = fs.readFileSync('299.txt', 'utf8');
  const parsed299 = parseVoucherText(content299);
  console.log('299号凭证解析结果:');
  console.log(JSON.stringify(parsed299, null, 2));
  const yaml299 = generateYamlContent(parsed299);
  console.log('生成的YAML内容:');
  console.log(yaml299);
  
  // 读取对应的AVR文件
  const avr299 = fs.readFileSync('AVR.299.yaml', 'utf8');
  console.log('预期的AVR.299.yaml内容:');
  console.log(avr299);
} catch (error) {
  console.log('299号凭证测试失败:', error.message);
}

console.log('\n====================\n');

// 测试300号凭证
console.log('=== 测试300号凭证 ===');
try {
  const content300 = fs.readFileSync('300.txt', 'utf8');
  const parsed300 = parseVoucherText(content300);
  console.log('300号凭证解析结果:');
  console.log(JSON.stringify(parsed300, null, 2));
  const yaml300 = generateYamlContent(parsed300);
  console.log('生成的YAML内容:');
  console.log(yaml300);
  
  // 读取对应的AVR文件
  const avr300 = fs.readFileSync('AVR.300.yaml', 'utf8');
  console.log('预期的AVR.300.yaml内容:');
  console.log(avr300);
} catch (error) {
  console.log('300号凭证测试失败:', error.message);
}

console.log('\n====================\n');

// 测试301号凭证
console.log('=== 测试301号凭证 ===');
try {
  const content301 = fs.readFileSync('301.txt', 'utf8');
  const parsed301 = parseVoucherText(content301);
  console.log('301号凭证解析结果:');
  console.log(JSON.stringify(parsed301, null, 2));
  const yaml301 = generateYamlContent(parsed301);
  console.log('生成的YAML内容:');
  console.log(yaml301);
  
  // 读取对应的AVR文件
  const avr301 = fs.readFileSync('AVR.301.yaml', 'utf8');
  console.log('预期的AVR.301.yaml内容:');
  console.log(avr301);
} catch (error) {
  console.log('301号凭证测试失败:', error.message);
}