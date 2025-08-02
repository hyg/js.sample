const java = require('java');
const path = require('path');
const fs = require('fs');

// 1. 校验Java环境（替代setDebug的调试方式）
try {
  console.log('===== Java环境信息 =====');
  console.log('Java版本:', java.getSystemPropertySync('java.version'));
  console.log('Java安装路径:', java.getSystemPropertySync('java.home'));
} catch (err) {
  console.error('获取Java环境失败:', err.message);
  process.exit(1);
}

// 2. 配置JAR路径（必须使用绝对路径）
const xbrlJar = path.resolve(__dirname, 'lib', 'xbrl-json-1.0.jar');
const fastJsonJar = path.resolve(__dirname, 'lib', 'fastjson-1.2.83.jar');
java.classpath = [xbrlJar, fastJsonJar];

console.log('\n===== 类路径配置 =====');
console.log('xbrl-json-1.0.jar路径:', xbrlJar);
console.log('fastjson-1.2.83.jar路径:', fastJsonJar);

// 3. 校验JAR文件是否存在
if (!fs.existsSync(xbrlJar)) {
  console.error('\n错误：xbrl-json-1.0.jar不存在，请检查路径');
  process.exit(1);
}
if (!fs.existsSync(fastJsonJar)) {
  console.error('\n错误：fastjson-1.2.83.jar不存在，请检查路径');
  process.exit(1);
}

// 4. 校验OFD文件是否存在
const ofdPath = path.resolve(__dirname, '250F981968D9.ofd');
console.log('\n===== OFD文件信息 =====');
console.log('OFD文件路径:', ofdPath);
if (!fs.existsSync(ofdPath)) {
  console.error('错误：OFD文件不存在，请检查文件名或路径');
  process.exit(1);
}

// 5. 尝试加载工具类并调用方法
try {
  console.log('\n===== 开始调用工具包 =====');
  console.log('加载api.VoucherFileUtil...');
  const VoucherFileUtil = java.import('api.VoucherFileUtil');
  
  // 调用1个参数的方法（仅提取，不指定输出路径）
  console.log('调用extractXBRLFromOFD（仅OFD路径）...');
  const result = VoucherFileUtil.extractXBRLFromOFDSync(ofdPath);
  
  // 输出结果（无论是否为空）
  console.log('\n===== 调用结果 =====');
  if (result) {
    console.log('返回对象信息:', result.toString());
    // 尝试获取常用属性（根据文档推测可能的方法）
    try {
      const fileName = result.getFileNameSync(); // 假设可能存在的方法
      const fileSize = result.getSizeSync();
      console.log('提取的文件名:', fileName);
      console.log('文件大小:', fileSize);
    } catch (e) {
      console.log('无法获取详细属性（可能方法名不同）:', e.message);
    }
  } else {
    console.log('工具包返回空结果，可能OFD中不包含XBRL内容');
  }
} catch (err) {
  console.error('\n===== 调用失败 =====');
  console.error('错误信息:', err.message);
  console.error('错误栈:', err.stack);
}

// 确保程序完成输出
setTimeout(() => {
  console.log('\n程序执行结束');
}, 3000);
