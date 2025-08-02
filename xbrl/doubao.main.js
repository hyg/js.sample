const { extractFromOFD, xbrlToJson } = require('./doubao.xbrl');

async function run() {
  try {
    // 配置参数（银行回单使用bker_issuer）
    const ofdFilePath = path.resolve(__dirname, '250F981968D9.ofd'); // 绝对路径，避免相对路径问题
    const xbrlOutputPath = path.resolve(__dirname, 'extracted_bank.xbrl'); // 输出XBRL文件
    const configId = 'bker_issuer'; // 银行回单（开具方）的configId

    // 1. 提取XBRL
    const extractResult = await extractFromOFD(ofdFilePath, xbrlOutputPath);

    // 2. 转换为JSON（如果提取成功）
    const jsonResult = await xbrlToJson(extractResult.outputPath, configId);

    // 3. 保存JSON结果（可选）
    const jsonOutputPath = path.resolve(__dirname, 'bank_result.json');
    await fs.writeFile(jsonOutputPath, JSON.stringify(jsonResult, null, 2));
    console.log(`JSON结果已保存到：${jsonOutputPath}`);

  } catch (err) {
    console.error('===== 执行失败 =====', err.message);
    // 打印完整错误栈，便于排查
    console.error(err.stack);
  }
}

// 引入path和fs（补充缺失的依赖）
const path = require('path');
const fs = require('fs').promises;

run();
