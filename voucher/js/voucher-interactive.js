#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 获取目标路径（脚本所在目录）
const targetPath = __dirname;

// 查找最新的ID
function getLatestId() {
  const files = fs.readdirSync(targetPath);
  let maxId = 0;
  
  files.forEach(file => {
    const match = file.match(/^AVR\.(\d+)\.yaml$/);
    if (match) {
      const id = parseInt(match[1]);
      if (id > maxId) {
        maxId = id;
      }
    }
  });
  
  return maxId;
}

// 解析输入文本
function parseVoucherText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line !== '');
  const result = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 处理301凭证格式
    if (line === '支付时间' && i + 1 < lines.length) {
      result.payTime = lines[i + 1];
    } else if (line === '订单号' && i + 1 < lines.length) {
      result.transactionId = lines[i + 1];
    } else if (line === '商家订单号' && i + 1 < lines.length) {
      result.merchantId = lines[i + 1];
    } else if (line === '商品说明' && i + 1 < lines.length) {
      result.product = lines[i + 1];
    } else if (line === '收款方全称' && i + 1 < lines.length) {
      result.merchantName = lines[i + 1];
    } else if (line.startsWith('-') && !isNaN(parseFloat(line))) {
      // 金额行，以负号开头的数字
      result.amount = Math.abs(parseFloat(line)).toFixed(2);
    } else if (line.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      // 支付时间格式：2025-08-24 19:38:20
      result.payTime = line;
    } else if (line.match(/^\d{28,}$/)) {
      // 订单号格式：28位以上的数字
      result.transactionId = line;
    } else if (line.match(/^[A-Z0-9]+$/)) {
      // 商家订单号格式：大写字母和数字组合
      if (!result.merchantId) {
        result.merchantId = line;
      }
    }
    
    // 处理299、300凭证格式
    if (line === '交易单号' && i + 1 < lines.length) {
      result.transactionId = lines[i + 1];
    } else if (line === '商户单号' && i + 1 < lines.length) {
      result.merchantId = lines[i + 1];
    } else if (line === '商品' && i + 1 < lines.length) {
      result.product = lines[i + 1];
    } else if (line === '商户全称' && i + 1 < lines.length) {
      result.merchantName = lines[i + 1];
    }
  }
  
  return result;
}

// 转换日期格式
function convertDate(dateStr) {
  // 将 "2025年8月22日 20:21:28" 转换为 "2025-08-22 20:21:28"
  const match = dateStr.match(/^(\d+)年(\d+)月(\d+)日\s+(.+)$/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    const time = match[4];
    return `${year}-${month}-${day} ${time}`;
  }
  return dateStr;
}

// 生成YAML内容
function generateYamlContent(data) {
  const date = convertDate(data.payTime);
  const transactionId = data.transactionId || '';
  const merchantId = data.merchantId || '';
  const amount = data.amount || '0.00';
  
  // 提取商品信息中的订单号
  let orderNumber = '';
  if (data.product) {
    // 处理多种格式：
    // 1. 美团订单-25082211100300001304615814784876
    // 2. 商户单号XP2125082220200492539796002493
    // 3. 充值:阿里云服务购买,业务交易号:CFP202508241937299046
    const orderMatch = data.product.match(/(?:.*-)?([A-Z0-9]+)$/);
    if (orderMatch) {
      orderNumber = orderMatch[1];
    }
  }
  
  // 生成摘要
  let summary = '';
  if (data.product) {
    if (data.product.includes('阿里云')) {
      summary = '阿里云充值';
    } else if (data.product.includes('美团')) {
      summary = '商品购买';
    } else {
      // 默认摘要
      summary = data.product.split(':')[0].replace('充值', '').trim() || '商品购买';
    }
  }
  
  let yaml = `date: ${date}\n`;
  yaml += `title: 支付宝账单\n`;
  yaml += `VoucherID: ${transactionId}\n`;
  yaml += `VoucherType: 订单号\n`;
  yaml += `amount: ${amount}\n`;
  yaml += `summary: ${summary}\n`;
  yaml += `comment:\n`;
  
  if (merchantId) {
    yaml += `  - name: 商户订单号\n`;
    yaml += `    value: ${merchantId}\n`;
  }
  
  if (orderNumber) {
    if (data.product && data.product.includes('美团')) {
      yaml += `  - name: 美团订单\n`;
      yaml += `    value: ${orderNumber}\n`;
    } else if (data.product && data.product.includes('业务交易号')) {
      yaml += `  - name: 业务交易号\n`;  // 业务交易号
      yaml += `    value: ${orderNumber}\n`;
    }
  }
  
  return yaml;
}

// 保存YAML文件
function saveYamlFile(content, id) {
  const filename = `AVR.${id}.yaml`;
  const filepath = path.join(targetPath, filename);
  fs.writeFileSync(filepath, content, 'utf8');
  return filename;
}

// 处理用户输入
function processUserInput(inputText) {
  // 解析输入文本
  const parsedData = parseVoucherText(inputText);
  
  // 获取新ID
  const latestId = getLatestId();
  const newId = latestId + 1;
  
  // 生成YAML内容
  const yamlContent = generateYamlContent(parsedData);
  
  // 保存文件
  const filename = saveYamlFile(yamlContent, newId);
  
  // 输出文件名和内容
  console.log(`\n生成文件: ${filename}`);
  console.log('文件内容:');
  console.log(yamlContent);
  
  return filename;
}

// 创建交互式界面
function createInteractiveInterface() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function promptUser() {
    console.log('\n请输入电子凭证（输入完成后输入"END"结束）:');
    let inputLines = [];
    
    rl.on('line', (line) => {
      if (line.trim() === 'END') {
        // 处理输入
        if (inputLines.length > 0) {
          const inputText = inputLines.join('\n');
          try {
            processUserInput(inputText);
          } catch (error) {
            console.error('处理输入时出错:', error.message);
          }
        }
        
        // 移除事件监听器并重新开始
        rl.removeAllListeners('line');
        promptUser();
      } else {
        inputLines.push(line);
      }
    });
  }
  
  promptUser();
}

// 主函数
function main() {
  if (process.stdin.isTTY) {
    // 交互式模式
    console.log('电子凭证自动整理工具');
    createInteractiveInterface();
  } else {
    // 管道模式
    let inputText = '';
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      inputText += chunk;
    });
    
    process.stdin.on('end', () => {
      if (inputText.trim() !== '') {
        try {
          processUserInput(inputText);
        } catch (error) {
          console.error('处理输入时出错:', error.message);
        }
      }
    });
  }
}

// 如果是直接运行此脚本，则执行主函数
if (require.main === module) {
  main();
}