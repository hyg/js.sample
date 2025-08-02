const java = require('java');
const path = require('path');
const fs = require('fs');

// 1. 强制开启java模块调试日志
java.setDebug(true);

// 2. 校验Java环境
console.log('Java版本:', java.getSystemPropertySync('java.version'));
console.log('Java类路径:', java.classpath);

// 3. 配置JAR路径（必须绝对路径）
const xbrlJar = path.resolve(__dirname, 'lib', 'xbrl-json-1.0.jar');
const fastJsonJar = path.resolve(__dirname, 'lib', 'fastjson-1.2.83.jar');
java.classpath = [xbrlJar, fastJsonJar];

// 4. 校验JAR文件是否存在
if (!fs.existsSync(xbrlJar)) {
  console.error('xbrl-json-1.0.jar不存在:', xbrlJar);
  process.exit(1);
}
if (!fs.existsSync(fastJsonJar)) {
  console.error('fastjson-1.2.83.jar不存在:', fastJsonJar);
  process.exit(1);
}

// 5. 校验OFD文件是否存在
const ofdPath = path.resolve(__dirname, '250F981968D9.ofd');
if (!fs.existsSync(ofdPath)) {
  console.error('OFD文件不存在:', ofdPath);
  process.exit(1);
}
console.log('OFD文件路径:', ofdPath);

// 6. 尝试加载工具类并调用最简单的方法
try {
  console.log('开始加载api.VoucherFileUtil...');
  const VoucherFileUtil = java.import('api.VoucherFileUtil');
  
  console.log('开始调用extractXBRLFromOFD（仅传入OFD路径）...');
  const result = VoucherFileUtil.extractXBRLFromOFDSync(ofdPath);
  
  console.log('调用成功，返回结果:', result ? result.toString() : '空结果');
} catch (err) {
  console.error('===== 捕获到错误 =====');
  console.error('错误信息:', err.message);
  console.error('错误栈:', err.stack);
}

// 7. 确保程序不会立即退出（用于异步操作调试）
setTimeout(() => {
  console.log('程序执行完毕');
}, 5000);
