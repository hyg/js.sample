const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置路径
const config = {
  // Java 命令路径（确保已配置环境变量）
  javaCommand: 'java',
  
  // JAR 包路径（根据实际位置修改）
  jarPath: path.join(__dirname, 'xbrl-json-1.0.jar'),
  
  // 依赖路径（fastjson）
  dependencyPath: path.join(__dirname, 'fastjson-1.2.83.jar'),
  
  // 工作目录（包含 JAR 和依赖）
  workingDir: __dirname
};

// 生成类路径字符串
const getClassPath = () => {
  return `"${config.jarPath}${path.delimiter}${config.dependencyPath}"`;
};

// 通用方法调用函数
const invokeJavaMethod = (methodName, ...args) => {
  return new Promise((resolve, reject) => {
    // 构建命令参数
    const params = args.map(arg => `"${arg}"`).join(' ');
    const command = `${config.javaCommand} -cp ${getClassPath()} api.VoucherFileUtil ${methodName} ${params}`;
    
    // 执行命令
    exec(command, { cwd: config.workingDir }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Java 执行错误: ${error.message}`));
      }
      
      if (stderr) {
        return reject(new Error(`Java 错误输出: ${stderr}`));
      }
      
      try {
        // 尝试解析 JSON 输出
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (parseError) {
        // 如果不是 JSON，返回原始字符串
        resolve(stdout.trim());
      }
    });
  });
};

// === 具体方法封装 ===

// 1. 从 OFD 中提取 XBRL
const extractXBRLFromOFD = async (ofdFilePath, outputFile = null) => {
  return outputFile 
    ? invokeJavaMethod('extractXBRLFromOFD', ofdFilePath, outputFile)
    : invokeJavaMethod('extractXBRLFromOFD', ofdFilePath);
};

// 2. 从 PDF 中提取 XBRL
const extractXBRLFromPDF = async (pdfFilePath, outputFile = null) => {
  return outputFile 
    ? invokeJavaMethod('extractXBRLFromPDF', pdfFilePath, outputFile)
    : invokeJavaMethod('extractXBRLFromPDF', pdfFilePath);
};

// 3. 从 PDF 中提取附件
const extractAttachFromPDF = async (pdfFilePath, outputPath) => {
  return invokeJavaMethod('extractAttachFromPDF', pdfFilePath, outputPath);
};

// 4. 从 PDF 中提取 XML（国库集中支付电子凭证）
const extractXMLFromPDF = async (pdfFilePath) => {
  return invokeJavaMethod('extractXMLFromPDF', pdfFilePath);
};

// 5. JSON 转 XBRL
const jsonToXbrl = async (jsonString, configId) => {
  return invokeJavaMethod('json2Xbrl', jsonString, configId);
};

// 6. XBRL 转 JSON
const xbrlToJson = async (xbrlXml, configId) => {
  return invokeJavaMethod('xbrl2Json', xbrlXml, configId);
};

// 7. XML 转 JSON
const xmlToJson = async (xmlValue) => {
  return invokeJavaMethod('xml2Json', xmlValue);
};

// 8. 从 PDF 中提取 XML 报文（中央财政电子票据）
const extractXMLFromCEBPDF = async (pdfFilePath) => {
  return invokeJavaMethod('extractXMLFromCEBPDF', pdfFilePath);
};

// === 使用示例 ===

(async () => {
  try {
    // 示例 1: 从 OFD 提取 XBRL
    console.log('=== 从 OFD 提取 XBRL ===');
    const ofdResult = await extractXBRLFromOFD('250F981968D9.ofd');
    console.log('OFD 提取结果:', ofdResult);
    
    // 示例 2: 从 PDF 提取 XBRL
    console.log('\n=== 从 PDF 提取 XBRL ===');
    const pdfResult = await extractXBRLFromPDF('example.pdf', 'output.xbrl');
    console.log('PDF 提取结果:', pdfResult);
    
    // 示例 3: JSON 转 XBRL
    console.log('\n=== JSON 转 XBRL ===');
    const sampleJson = fs.readFileSync('inv_ord_issuer.json', 'utf8');
    const xbrlResult = await jsonToXbrl(sampleJson, 'inv_ord_issuer');
    console.log('XBRL 转换结果:', xbrlResult.substring(0, 100) + '...');
    
    // 示例 4: XBRL 转 JSON
    console.log('\n=== XBRL 转 JSON ===');
    const jsonResult = await xbrlToJson(xbrlResult, 'inv_ord_issuer');
    console.log('JSON 转换结果:', JSON.stringify(jsonResult, null, 2));
    
  } catch (error) {
    console.error('执行出错:', error.message);
  }
})();

module.exports = {
  extractXBRLFromOFD,
  extractXBRLFromPDF,
  extractAttachFromPDF,
  extractXMLFromPDF,
  jsonToXbrl,
  xbrlToJson,
  xmlToJson,
  extractXMLFromCEBPDF
};