const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置路径
const config = {
  javaCommand: 'java',
  jarPath: path.join(__dirname, 'xbrl-json-1.0.jar'),
  dependencyPath: path.join(__dirname, 'fastjson-1.2.83.jar'),
  compressPath: path.join(__dirname, 'commons-compress-1.21.jar'),
  pdfboxPath: path.join(__dirname, 'pdfbox-2.0.24.jar'),
  loggingPath: path.join(__dirname, 'commons-logging-1.2.jar'),
  workingDir: __dirname
};

// 生成类路径字符串
const getClassPath = () => {
  return `"${config.jarPath}${path.delimiter}${config.dependencyPath}${path.delimiter}${config.compressPath}${path.delimiter}${config.pdfboxPath}${path.delimiter}${config.loggingPath}${path.delimiter}${config.workingDir}"`;
};

// 通用方法调用函数
const invokeJavaMethod = (methodName, ...args) => {
  return new Promise((resolve, reject) => {
    // 构建命令参数：第一个参数是方法名，后面是方法参数
    const params = [methodName, ...args].map(arg => `"${arg}"`).join(' ');
    const command = `${config.javaCommand} -cp ${getClassPath()} Invoker ${params}`;
    
    console.log('=== 执行 Java 命令 ===');
    console.log('命令:', command);
    console.log('====================');
    
    exec(command, { cwd: config.workingDir }, (error, stdout, stderr) => {
      if (error) {
        console.log('=== Java 执行错误 ===');
        console.log('错误信息:', error.message);
        console.log('==================');
        return reject(new Error(`Java 执行错误: ${error.message}`));
      }
      
      // 注意：Java 程序使用 System.err.println 输出调试信息，这不是真正的错误
      if (stderr && stderr.trim()) {
        console.log('=== Java 调试输出 ===');
        console.log(stderr.trim());
        console.log('==================');
      }
      
      if (stdout && stdout.trim()) {
        console.log('=== Java 标准输出 ===');
        console.log('原始输出长度:', stdout.length);
        console.log('原始输出预览:', stdout.substring(0, 200) + (stdout.length > 200 ? '...' : ''));
        console.log('==================');
      }
      
      try {
        // 尝试解析 JSON 输出
        const result = JSON.parse(stdout.trim());
        console.log('=== JSON 解析成功 ===');
        console.log('解析结果类型:', typeof result);
        console.log('==================');
        resolve(JSON.stringify(result)); // 返回JSON字符串
      } catch (parseError) {
        console.log('=== JSON 解析失败 ===');
        console.log('错误信息:', parseError.message);
        console.log('==================');
        // 如果不是 JSON，返回原始字符串
        resolve(stdout.trim());
      }
    });
  });
};

// === 具体方法封装 ===

// 1. 从 OFD 中提取 XBRL
const extractXBRLFromOFD = async (ofdFilePath, outputFile = null) => {
  console.log('\n=== 开始 OFD 提取 ===');
  
  // 检查输入文件是否存在
  const absoluteInputPath = path.resolve(ofdFilePath);
  console.log('检查输入文件:', absoluteInputPath);
  if (!fs.existsSync(absoluteInputPath)) {
    throw new Error(`输入文件不存在: ${absoluteInputPath}`);
  }
  console.log('输入文件存在，大小:', fs.statSync(absoluteInputPath).size, '字节');
  
  // 如果没有指定输出文件，使用默认名称
  if (!outputFile) {
    outputFile = path.join(__dirname, `extracted_${path.basename(ofdFilePath, '.ofd')}.xbrl`);
  }
  console.log('输出文件路径:', outputFile);
  
  // 确保输出目录存在
  const absoluteOutputPath = path.resolve(outputFile);
  const outputDir = path.dirname(absoluteOutputPath);
  if (!fs.existsSync(outputDir)) {
    console.log('创建输出目录:', outputDir);
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('准备调用 Java 方法...');
  return invokeJavaMethod('extractXBRLFromOFD', absoluteInputPath, absoluteOutputPath);
};

// 2. 从 PDF 中提取 XBRL
const extractXBRLFromPDF = async (pdfFilePath, outputFile = null) => {
  console.log('\n=== 开始 PDF 提取 ===');
  
  // 检查输入文件是否存在
  const absoluteInputPath = path.resolve(pdfFilePath);
  console.log('检查输入文件:', absoluteInputPath);
  if (!fs.existsSync(absoluteInputPath)) {
    throw new Error(`输入文件不存在: ${absoluteInputPath}`);
  }
  console.log('输入文件存在，大小:', fs.statSync(absoluteInputPath).size, '字节');
  
  // 如果没有指定输出文件，使用默认名称
  if (!outputFile) {
    outputFile = path.join(__dirname, `extracted_${path.basename(pdfFilePath, '.pdf')}.xbrl`);
  }
  console.log('输出文件路径:', outputFile);
  
  // 确保输出目录存在
  const absoluteOutputPath = path.resolve(outputFile);
  const outputDir = path.dirname(absoluteOutputPath);
  if (!fs.existsSync(outputDir)) {
    console.log('创建输出目录:', outputDir);
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('准备调用 Java 方法...');
  return invokeJavaMethod('extractXBRLFromPDF', absoluteInputPath, absoluteOutputFile);
};

// 3. 从 PDF 中提取附件
const extractAttachFromPDF = async (pdfFilePath, outputPath) => {
  console.log('\n=== 开始 PDF 附件提取 ===');
  
  // 检查输入文件是否存在
  const absoluteInputPath = path.resolve(pdfFilePath);
  console.log('检查输入文件:', absoluteInputPath);
  if (!fs.existsSync(absoluteInputPath)) {
    throw new Error(`输入文件不存在: ${absoluteInputPath}`);
  }
  
  // 确保输出目录存在
  const absoluteOutputPath = path.resolve(outputPath);
  if (!fs.existsSync(absoluteOutputPath)) {
    console.log('创建输出目录:', absoluteOutputPath);
    fs.mkdirSync(absoluteOutputPath, { recursive: true });
  }
  
  console.log('准备调用 Java 方法...');
  return invokeJavaMethod('extractAttachFromPDF', absoluteInputPath, absoluteOutputPath);
};

// 4. 从 PDF 中提取 XML（国库集中支付电子凭证）
const extractXMLFromPDF = async (pdfFilePath) => {
  console.log('\n=== 开始 PDF XML 提取 ===');
  
  // 检查输入文件是否存在
  const absoluteInputPath = path.resolve(pdfFilePath);
  console.log('检查输入文件:', absoluteInputPath);
  if (!fs.existsSync(absoluteInputPath)) {
    throw new Error(`输入文件不存在: ${absoluteInputPath}`);
  }
  
  console.log('准备调用 Java 方法...');
  return invokeJavaMethod('extractXMLFromPDF', absoluteInputPath);
};

// 5. JSON 转 XBRL
const jsonToXbrl = async (jsonString, configId) => {
  console.log('\n=== 开始 JSON 转 XBRL ===');
  console.log('配置ID:', configId);
  console.log('JSON 字符串长度:', jsonString.length);
  console.log('JSON 字符串预览:', jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''));
  
  // 将 JSON 字符串压缩为一行，避免命令行解析问题
  const compressedJson = JSON.stringify(JSON.parse(jsonString));
  console.log('压缩后 JSON 长度:', compressedJson.length);
  
  console.log('准备调用 Java 方法...');
  return invokeJavaMethod('json2Xbrl', compressedJson, configId);
};

// 6. XBRL 转 JSON
const xbrlToJson = async (xbrlXml, configId) => {
  console.log('\n=== 开始 XBRL 转 JSON ===');
  console.log('配置ID:', configId);
  console.log('XBRL XML 长度:', xbrlXml.length);
  console.log('XBRL XML 预览:', xbrlXml.substring(0, 100) + (xbrlXml.length > 100 ? '...' : ''));
  
  // 将 XBRL 内容写入临时文件
  const tempFile = path.join(__dirname, 'temp_xbrl.xml');
  fs.writeFileSync(tempFile, xbrlXml, 'utf8');
  console.log('已将 XBRL 内容写入临时文件:', tempFile);
  
  // 修改调用方式，传递文件路径而不是直接传递 XML 内容
  console.log('准备调用 Java 方法...');
  return invokeJavaMethod('xbrl2JsonFromFile', tempFile, configId);
};

// 7. XML 转 JSON
const xmlToJson = async (xmlValue) => {
  console.log('\n=== 开始 XML 转 JSON ===');
  console.log('XML 长度:', xmlValue.length);
  console.log('XML 预览:', xmlValue.substring(0, 100) + (xmlValue.length > 100 ? '...' : ''));
  
  console.log('准备调用 Java 方法...');
  return invokeJavaMethod('xml2Json', xmlValue);
};

// 8. 从 PDF 中提取 XML 报文（中央财政电子票据）
const extractXMLFromCEBPDF = async (pdfFilePath) => {
  console.log('\n=== 开始 CEB PDF XML 提取 ===');
  
  // 检查输入文件是否存在
  const absoluteInputPath = path.resolve(pdfFilePath);
  console.log('检查输入文件:', absoluteInputPath);
  if (!fs.existsSync(absoluteInputPath)) {
    throw new Error(`输入文件不存在: ${absoluteInputPath}`);
  }
  
  console.log('准备调用 Java 方法...');
  return invokeJavaMethod('extractXMLFromCEBPDF', absoluteInputPath);
};

// === 新增：使用示例文件测试 ===

// 使用 bkrs.json 示例文件测试
const testBkrsJsonSample = async () => {
  console.log('\n==========================================');
  console.log('      测试 bkrs.json 示例文件');
  console.log('==========================================');
  
  const bkrsFile = 'bkrs.json';
  
  if (fs.existsSync(bkrsFile)) {
    try {
      console.log('\n=== 读取 bkrs.json 文件 ===');
      const bkrsJson = fs.readFileSync(bkrsFile, 'utf8');
      console.log('文件大小:', bkrsJson.length, '字节');
      
      // 解析 JSON 并显示基本信息
      const bkrsData = JSON.parse(bkrsJson);
      console.log('\n=== bkrs.json 基本信息 ===');
      console.log('发行方识别码:', bkrsData.IdentificationCodeOfIssuer);
      console.log('币种:', bkrsData.Currency);
      console.log('客户结算银行账户:', bkrsData.CustomerSettlementBankAccount);
      console.log('客户账户名称:', bkrsData.NameOfCustomerAccount);
      console.log('银行对账单年份:', bkrsData.YearOfBankReconciliationStatement);
      console.log('银行对账单月份:', bkrsData.MonthOfBankReconciliationStatement);
      console.log('对账明细条数:', bkrsData.InformationOfReconcileDetailsTuple.length);
      console.log('期末账户余额:', bkrsData.AccountBalanceAtTheEndOfReconciliationCycleAmount);
      
      // 转换为 XBRL
      console.log('\n=== bkrs.json 转 XBRL ===');
      const xbrlResult = await jsonToXbrl(bkrsJson, 'bkrs');
      console.log('转换成功，XBRL 长度:', xbrlResult.length);
      
      // 保存 XBRL 结果到文件
      const xbrlFile = 'bkrs_json_converted.xbrl';
      fs.writeFileSync(xbrlFile, xbrlResult, 'utf8');
      console.log('已保存 XBRL 到文件:', xbrlFile);
      
      // 再转换回 JSON 验证
      console.log('\n=== XBRL 转 JSON 验证 ===');
      const jsonResult = await xbrlToJson(xbrlResult, 'bkrs');
      console.log('转换成功');
      
      // 验证转换结果
      console.log('\n=== 转换结果验证 ===');
      const originalData = JSON.parse(bkrsJson);
      const convertedData = JSON.parse(jsonResult);
      
      // 比较关键字段
      const keyFields = [
        'IdentificationCodeOfIssuer',
        'Currency',
        'CustomerSettlementBankAccount',
        'NameOfCustomerAccount',
        'YearOfBankReconciliationStatement',
        'MonthOfBankReconciliationStatement',
        'AccountBalanceAtTheEndOfReconciliationCycleAmount'
      ];
      
      let allMatch = true;
      keyFields.forEach(field => {
        const originalValue = originalData[field];
        const convertedValue = convertedData[field];
        const match = originalValue === convertedValue;
        console.log(`${field}: ${match ? '✓' : '✗'} (原始: ${originalValue}, 转换: ${convertedValue})`);
        if (!match) allMatch = false;
      });
      
      // 比较对账明细条数
      const originalDetails = originalData.InformationOfReconcileDetailsTuple;
      const convertedDetails = convertedData.InformationOfReconcileDetailsTuple;
      const detailsMatch = originalDetails.length === convertedDetails.length;
      console.log(`对账明细条数: ${detailsMatch ? '✓' : '✗'} (原始: ${originalDetails.length}, 转换: ${convertedDetails.length})`);
      if (!detailsMatch) allMatch = false;
      
      console.log('\n=== 验证结果 ===');
      console.log('所有关键字段匹配:', allMatch ? '✓' : '✗');
      
      // 显示第一条对账明细的比较
      if (originalDetails.length > 0 && convertedDetails.length > 0) {
        console.log('\n=== 第一条对账明细比较 ===');
        const firstOriginal = originalDetails[0];
        const firstConverted = convertedDetails[0];
        console.log('原始:', JSON.stringify(firstOriginal, null, 2));
        console.log('转换:', JSON.stringify(firstConverted, null, 2));
      }
      
    } catch (error) {
      console.error('测试 bkrs.json 出错:', error.message);
    }
  } else {
    console.log('bkrs.json 文件不存在');
  }
};

// 使用 bkrs.xml 示例文件测试
const testBkrsXmlSample = async () => {
  console.log('\n==========================================');
  console.log('      测试 bkrs.xml 示例文件');
  console.log('==========================================');
  
  const bkrsFile = 'bkrs.xml';
  
  if (fs.existsSync(bkrsFile)) {
    try {
      console.log('\n=== 读取 bkrs.xml 文件 ===');
      const bkrsXml = fs.readFileSync(bkrsFile, 'utf8');
      console.log('文件大小:', bkrsXml.length, '字节');
      
      // 解析 XML 并显示基本信息
      console.log('\n=== bkrs.xml 基本信息 ===');
      
      // 提取基本信息
      const identificationCode = bkrsXml.match(/<bkrs:IdentificationCodeOfIssuer[^>]*>([^<]+)<\/bkrs:IdentificationCodeOfIssuer>/);
      const currency = bkrsXml.match(/<bkrs:Currency[^>]*>([^<]+)<\/bkrs:Currency>/);
      const customerAccount = bkrsXml.match(/<bkrs:CustomerSettlementBankAccount[^>]*>([^<]+)<\/bkrs:CustomerSettlementBankAccount>/);
      const nameOfCustomer = bkrsXml.match(/<bkrs:NameOfCustomerAccount[^>]*>([^<]+)<\/bkrs:NameOfCustomerAccount>/);
      const year = bkrsXml.match(/<bkrs:YearOfBankReconciliationStatement[^>]*>([^<]+)<\/bkrs:YearOfBankReconciliationStatement>/);
      const month = bkrsXml.match(/<bkrs:MonthOfBankReconciliationStatement[^>]*>([^<]+)<\/bkrs:MonthOfBankReconciliationStatement>/);
      const finalBalance = bkrsXml.match(/<bkrs:AccountBalanceAtTheEndOfReconciliationCycleAmount[^>]*>([^<]+)<\/bkrs:AccountBalanceAtTheEndOfReconciliationCycleAmount>/);
      
      console.log('发行方识别码:', identificationCode ? identificationCode[1] : '未找到');
      console.log('币种:', currency ? currency[1] : '未找到');
      console.log('客户结算银行账户:', customerAccount ? customerAccount[1] : '未找到');
      console.log('客户账户名称:', nameOfCustomer ? nameOfCustomer[1] : '未找到');
      console.log('银行对账单年份:', year ? year[1] : '未找到');
      console.log('银行对账单月份:', month ? month[1] : '未找到');
      console.log('期末账户余额:', finalBalance ? finalBalance[1] : '未找到');
      
      // 计算对账明细条数
      const detailMatches = bkrsXml.match(/<bkrs:InformationOfReconcileDetailsTuple>/g);
      console.log('对账明细条数:', detailMatches ? detailMatches.length : 0);
      
      // 转换为 JSON
      console.log('\n=== bkrs.xml 转 JSON ===');
      const jsonResult = await xbrlToJson(bkrsXml, 'bkrs');
      console.log('转换成功，JSON 长度:', jsonResult.length);
      
      // 保存 JSON 结果到文件
      const jsonFile = 'bkrs_xml_converted.json';
      fs.writeFileSync(jsonFile, jsonResult, 'utf8');
      console.log('已保存 JSON 到文件:', jsonFile);
      
      // 解析转换后的 JSON
      const convertedData = JSON.parse(jsonResult);
      console.log('\n=== 转换后的 JSON 结构 ===');
      console.log('发行方识别码:', convertedData.IdentificationCodeOfIssuer);
      console.log('币种:', convertedData.Currency);
      console.log('客户结算银行账户:', convertedData.CustomerSettlementBankAccount);
      console.log('客户账户名称:', convertedData.NameOfCustomerAccount);
      console.log('银行对账单年份:', convertedData.YearOfBankReconciliationStatement);
      console.log('银行对账单月份:', convertedData.MonthOfBankReconciliationStatement);
      console.log('对账明细条数:', convertedData.InformationOfReconcileDetailsTuple ? convertedData.InformationOfReconcileDetailsTuple.length : 0);
      console.log('期末账户余额:', convertedData.AccountBalanceAtTheEndOfReconciliationCycleAmount);
      
      // 再转换回 XBRL 验证
      console.log('\n=== JSON 转 XBRL 验证 ===');
      const xbrlResult = await jsonToXbrl(jsonResult, 'bkrs');
      console.log('转换成功，XBRL 长度:', xbrlResult.length);
      
      // 保存验证结果到文件
      const verifyFile = 'bkrs_xml_verify.xbrl';
      fs.writeFileSync(verifyFile, xbrlResult, 'utf8');
      console.log('已保存验证 XBRL 到文件:', verifyFile);
      
      // 比较原始 XBRL 和验证 XBRL
      console.log('\n=== XBRL 内容比较 ===');
      const originalLines = bkrsXml.split('\n').filter(line => line.trim());
      const verifyLines = xbrlResult.split('\n').filter(line => line.trim());
      
      console.log('原始 XBRL 行数:', originalLines.length);
      console.log('验证 XBRL 行数:', verifyLines.length);
      
      // 比较关键字段
      const compareField = (fieldName) => {
        const originalPattern = new RegExp(`<bkrs:${fieldName}[^>]*>([^<]+)<\/bkrs:${fieldName}>`);
        const verifyPattern = new RegExp(`<bkrs:${fieldName}[^>]*>([^<]+)<\/bkrs:${fieldName}>`);
        const originalMatch = bkrsXml.match(originalPattern);
        const verifyMatch = xbrlResult.match(verifyPattern);
        const originalValue = originalMatch ? originalMatch[1] : '未找到';
        const verifyValue = verifyMatch ? verifyMatch[1] : '未找到';
        const match = originalValue === verifyValue;
        console.log(`${fieldName}: ${match ? '✓' : '✗'} (原始: ${originalValue}, 验证: ${verifyValue})`);
        return match;
      };
      
      const fieldsToCompare = [
        'IdentificationCodeOfIssuer',
        'Currency',
        'CustomerSettlementBankAccount',
        'NameOfCustomerAccount',
        'YearOfBankReconciliationStatement',
        'MonthOfBankReconciliationStatement',
        'AccountBalanceAtTheEndOfReconciliationCycleAmount'
      ];
      
      let allFieldsMatch = true;
      fieldsToCompare.forEach(field => {
        if (!compareField(field)) allFieldsMatch = false;
      });
      
      console.log('\n=== 验证结果 ===');
      console.log('所有关键字段匹配:', allFieldsMatch ? '✓' : '✗');
      
    } catch (error) {
      console.error('测试 bkrs.xml 出错:', error.message);
    }
  } else {
    console.log('bkrs.xml 文件不存在');
  }
};

// 对比 bkrs.json 和 bkrs.xml 的转换结果
const compareBkrsConversions = async () => {
  console.log('\n==========================================');
  console.log('      对比 bkrs.json 和 bkrs.xml 转换结果');
  console.log('==========================================');
  
  const jsonFile = 'bkrs.json';
  const xmlFile = 'bkrs.xml';
  
  if (fs.existsSync(jsonFile) && fs.existsSync(xmlFile)) {
    try {
      // 读取文件
      const bkrsJson = fs.readFileSync(jsonFile, 'utf8');
      const bkrsXml = fs.readFileSync(xmlFile, 'utf8');
      
      // 转换 JSON -> XBRL -> JSON
      console.log('\n=== JSON -> XBRL -> JSON ===');
      const xbrlFromJson = await jsonToXbrl(bkrsJson, 'bkrs');
      const jsonFromXbrl = await xbrlToJson(xbrlFromJson, 'bkrs');
      
      // 转换 XML -> JSON -> XBRL
      console.log('\n=== XML -> JSON -> XBRL ===');
      const jsonFromXml = await xbrlToJson(bkrsXml, 'bkrs');
      const xbrlFromJson2 = await jsonToXbrl(jsonFromXml, 'bkrs');
      
      // 比较结果
      console.log('\n=== 转换结果比较 ===');
      console.log('JSON -> XBRL -> JSON 结果长度:', jsonFromXbrl.length);
      console.log('XML -> JSON -> XBRL 结果长度:', xbrlFromJson2.length);
      
      // 解析 JSON 结果
      const originalJsonData = JSON.parse(bkrsJson);
      const convertedJsonData = JSON.parse(jsonFromXbrl);
      const convertedXmlData = JSON.parse(jsonFromXml);
      
      // 比较关键字段
      console.log('\n=== 关键字段比较 ===');
      const keyFields = [
        'IdentificationCodeOfIssuer',
        'Currency',
        'CustomerSettlementBankAccount',
        'NameOfCustomerAccount',
        'YearOfBankReconciliationStatement',
        'MonthOfBankReconciliationStatement',
        'AccountBalanceAtTheEndOfReconciliationCycleAmount'
      ];
      
      console.log('原始 JSON vs JSON->XBRL->JSON:');
      keyFields.forEach(field => {
        const originalValue = originalJsonData[field];
        const convertedValue = convertedJsonData[field];
        const match = originalValue === convertedValue;
        console.log(`${field}: ${match ? '✓' : '✗'} (原始: ${originalValue}, 转换: ${convertedValue})`);
      });
      
      console.log('\n原始 XML vs XML->JSON->XML:');
      keyFields.forEach(field => {
        const originalValue = originalJsonData[field];
        const convertedValue = convertedXmlData[field];
        const match = originalValue === convertedValue;
        console.log(`${field}: ${match ? '✓' : '✗'} (原始: ${originalValue}, 转换: ${convertedValue})`);
      });
      
      console.log('\nJSON->XBRL->JSON vs XML->JSON->XBRL:');
      keyFields.forEach(field => {
        const jsonValue = convertedJsonData[field];
        const xmlValue = convertedXmlData[field];
        const match = jsonValue === xmlValue;
        console.log(`${field}: ${match ? '✓' : '✗'} (JSON: ${jsonValue}, XML: ${xmlValue})`);
      });
      
    } catch (error) {
      console.error('对比转换结果出错:', error.message);
    }
  } else {
    console.log('缺少 bkrs.json 或 bkrs.xml 文件');
  }
};

// === 主执行函数 ===
const main = async () => {
  try {
    console.log('==========================================');
    console.log('          XBRL 工具包测试开始');
    console.log('==========================================');
    
    // 检查必要的文件是否存在
    const ofdFile = '250F981968D9.ofd';
    const pdfFile = '250F981968D9.pdf';
    const jsonFile = 'inv_ord_issuer.json';
    const bkrsJsonFile = 'bkrs.json';
    const bkrsXmlFile = 'bkrs.xml';
    
    console.log('\n=== 检查文件是否存在 ===');
    console.log(`OFD 文件: ${ofdFile} - ${fs.existsSync(ofdFile) ? '存在' : '不存在'}`);
    console.log(`PDF 文件: ${pdfFile} - ${fs.existsSync(pdfFile) ? '存在' : '不存在'}`);
    console.log(`JSON 文件: ${jsonFile} - ${fs.existsSync(jsonFile) ? '存在' : '不存在'}`);
    console.log(`BKRS JSON 文件: ${bkrsJsonFile} - ${fs.existsSync(bkrsJsonFile) ? '存在' : '不存在'}`);
    console.log(`BKRS XML 文件: ${bkrsXmlFile} - ${fs.existsSync(bkrsXmlFile) ? '存在' : '不存在'}`);
    
    let ofdXbrlContent = null; // 保存 OFD 提取的 XBRL 内容，用于后续转换
    
    // 示例 1: 从 OFD 提取 XBRL
    if (fs.existsSync(ofdFile)) {
      console.log('\n==========================================');
      console.log('          步骤 1: OFD 转 XBRL');
      console.log('==========================================');
      
      const ofdOutputFile = 'extracted_ofd.xbrl';
      try {
        console.log('开始提取 OFD 文件...');
        const ofdResult = await extractXBRLFromOFD(ofdFile, ofdOutputFile);
        console.log('\n=== OFD 提取结果 ===');
        const parsedResult = JSON.parse(ofdResult);
        console.log(JSON.stringify(parsedResult, null, 2));
        
        // 保存 XBRL 内容用于后续转换
        if (parsedResult.content) {
          ofdXbrlContent = parsedResult.content;
          console.log('\n已保存 XBRL 内容用于后续转换，长度:', ofdXbrlContent.length);
        }
        
        // 检查输出文件是否存在
        if (fs.existsSync(ofdOutputFile)) {
          console.log('\n=== OFD 输出文件信息 ===');
          const stats = fs.statSync(ofdOutputFile);
          console.log('文件大小:', stats.size, '字节');
          console.log('创建时间:', stats.birthtime);
          console.log('修改时间:', stats.mtime);
          
          console.log('\n=== OFD 输出文件内容 ===');
          const ofdContent = fs.readFileSync(ofdOutputFile, 'utf8');
          console.log(ofdContent);
        } else {
          console.log('\nOFD 输出文件不存在');
        }
      } catch (error) {
        console.error('OFD 提取出错:', error.message);
      }
    } else {
      console.log('\n跳过 OFD 提取，文件不存在');
    }
    
    // 示例 2: 使用 OFD 提取的 XBRL 内容转换为 JSON
    if (ofdXbrlContent) {
      console.log('\n==========================================');
      console.log('      步骤 2: OFD 的 XBRL 转 JSON');
      console.log('==========================================');
      
      try {
        console.log('开始转换 XBRL 为 JSON...');
        const jsonResult = await xbrlToJson(ofdXbrlContent, 'bkrs'); // 使用 OFD 中的 voucherType
        console.log('\n=== XBRL 转 JSON 结果 ===');
        console.log(jsonResult);
      } catch (error) {
        console.error('XBRL 转 JSON 出错:', error.message);
      }
    } else {
      console.log('\n跳过 XBRL 转 JSON，没有可用的 XBRL 内容');
    }
    
    // 示例 3: 从 PDF 提取 XBRL
    if (fs.existsSync(pdfFile)) {
      console.log('\n==========================================');
      console.log('          步骤 3: PDF 转 XBRL');
      console.log('==========================================');
      
      const pdfOutputFile = 'extracted_pdf.xbrl';
      try {
        console.log('开始提取 PDF 文件...');
        const pdfResult = await extractXBRLFromPDF(pdfFile, pdfOutputFile);
        console.log('\n=== PDF 提取结果 ===');
        const parsedResult = JSON.parse(pdfResult);
        console.log(JSON.stringify(parsedResult, null, 2));
        
        // 检查输出文件是否存在
        if (fs.existsSync(pdfOutputFile)) {
          console.log('\n=== PDF 输出文件信息 ===');
          const stats = fs.statSync(pdfOutputFile);
          console.log('文件大小:', stats.size, '字节');
          console.log('创建时间:', stats.birthtime);
          console.log('修改时间:', stats.mtime);
          
          console.log('\n=== PDF 输出文件内容 ===');
          const pdfContent = fs.readFileSync(pdfOutputFile, 'utf8');
          console.log(pdfContent);
        } else {
          console.log('\nPDF 输出文件不存在');
        }
      } catch (error) {
        console.error('PDF 提取出错:', error.message);
      }
    } else {
      console.log('\n跳过 PDF 提取，文件不存在');
    }
    
    // 示例 4: 创建示例 JSON 文件并测试转换
    console.log('\n==========================================');
    console.log('      步骤 4: JSON 转 XBRL 转 JSON');
    console.log('==========================================');
    
    console.log('\n=== 创建示例 JSON 文件 ===');
    const sampleJsonContent = {
      "invOrdIssuer": {
        "invoiceCode": "12345678",
        "invoiceNumber": "12345678",
        "invoiceDate": "\"2023-01-01\"",  // 日期需要加引号
        "sellerName": "示例销售方",
        "sellerTaxCode": "123456789012345",
        "buyerName": "示例购买方",
        "buyerTaxCode": "123456789012345",
        "amount": "100.00",
        "taxAmount": "13.00",
        "totalAmount": "113.00",
        "remarks": "示例备注"
      }
    };
    
    fs.writeFileSync(jsonFile, JSON.stringify(sampleJsonContent, null, 2));
    console.log(`已创建示例 JSON 文件: ${jsonFile}`);
    
    console.log('\n=== JSON 转 XBRL ===');
    try {
      const sampleJson = fs.readFileSync(jsonFile, 'utf8');
      console.log('读取 JSON 文件成功，长度:', sampleJson.length);
      
      const xbrlResult = await jsonToXbrl(sampleJson, 'inv_ord_issuer');
      console.log('\n=== JSON 转 XBRL 结果 ===');
      console.log(xbrlResult);
      
      // 示例 5: XBRL 转 JSON
      console.log('\n=== XBRL 转 JSON ===');
      const jsonResult = await xbrlToJson(xbrlResult, 'inv_ord_issuer');
      console.log('\n=== XBRL 转 JSON 结果 ===');
      console.log(jsonResult);
      
      // 验证转换结果
      console.log('\n=== 转换结果验证 ===');
      const originalJson = JSON.parse(sampleJson);
      const convertedJson = JSON.parse(jsonResult);
      console.log('原始 JSON 和转换后的 JSON 是否相同:', JSON.stringify(originalJson) === JSON.stringify(convertedJson));
      
    } catch (error) {
      console.error('JSON/XBRL 转换出错:', error.message);
    }
    
    // 示例 5: 使用 bkrs.json 示例文件测试
    await testBkrsJsonSample();
    
    // 示例 6: 使用 bkrs.xml 示例文件测试
    await testBkrsXmlSample();
    
    // 示例 7: 对比 bkrs.json 和 bkrs.xml 的转换结果
    await compareBkrsConversions();
    
    console.log('\n==========================================');
    console.log('          XBRL 工具包测试完成');
    console.log('==========================================');
    
  } catch (error) {
    console.error('执行出错:', error.message);
    console.error(error.stack);
  }
};

// 执行主函数
main();

// 导出所有函数
module.exports = {
  extractXBRLFromOFD,
  extractXBRLFromPDF,
  extractAttachFromPDF,
  extractXMLFromPDF,
  jsonToXbrl,
  xbrlToJson,
  xmlToJson,
  extractXMLFromCEBPDF,
  testBkrsJsonSample,
  testBkrsXmlSample,
  compareBkrsConversions
};