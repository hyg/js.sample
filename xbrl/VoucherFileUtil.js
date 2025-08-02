const java = require('java');
const path = require('path');

// 加载 JAR 文件（支持绝对路径或相对路径）
//java.classpath.push('C:\\Users\\hyg\\Downloads\\1.基础工具包（推广应用版V1.0）\\xbrl-json-1.0.jar');
java.classpath.push('xbrl-json-1.0.jar');
java.classpath.push('fastjson-1.2.83.jar');

// 引入工具类
const VoucherFileUtil = java.import('api.VoucherFileUtil');


/**
 * 从OFD中提取XBRL文件
 * @param {string} ofdFilePath OFD文件路径
 * @returns {Promise<Object>} 提取的XBRL文件信息
 */
async function extractXBRLFromOFD(ofdFilePath) {
    try {
        // 调用静态方法: static VoucherFileInfo extractXBRLFromOFD(String ofdFilePath)
        const result = await VoucherFileUtil.extractXBRLFromOFD(ofdFilePath);
        return convertVoucherFileInfo(result);
    } catch (error) {
        console.error('从OFD提取XBRL失败:', error);
        throw error;
    }
}

/**
 * 从OFD中将XBRL文件提取到指定位置
 * @param {string} ofdFilePath OFD文件路径
 * @param {string} outputFile 输出文件路径
 * @returns {Promise<Object>} 提取的XBRL文件信息
 */
async function extractXBRLFromOFDToFile(ofdFilePath, outputFile) {
    try {
        // 调用静态方法: static VoucherFileInfo extractXBRLFromOFD(String ofdFilePath, String outputFile)
        const result = await VoucherFileUtil.extractXBRLFromOFD(ofdFilePath, outputFile);
        return convertVoucherFileInfo(result);
    } catch (error) {
        console.error('从OFD提取XBRL到文件失败:', error);
        throw error;
    }
}

/**
 * 从PDF中提取XBRL文件
 * @param {string} pdfFilePath PDF文件路径
 * @returns {Promise<Object>} 提取的XBRL文件信息
 */
async function extractXBRLFromPDF(pdfFilePath) {
    try {
        // 调用静态方法: static VoucherFileInfo extractXBRLFromPDF(String pdfFilePath)
        const result = await VoucherFileUtil.extractXBRLFromPDF(pdfFilePath);
        return convertVoucherFileInfo(result);
    } catch (error) {
        console.error('从PDF提取XBRL失败:', error);
        throw error;
    }
}

/**
 * 从PDF中将XBRL文件提取到指定位置
 * @param {string} pdfFilePath PDF文件路径
 * @param {string} outputFile 输出文件路径
 * @returns {Promise<Object>} 提取的XBRL文件信息
 */
async function extractXBRLFromPDFToFile(pdfFilePath, outputFile) {
    try {
        // 调用静态方法: static VoucherFileInfo extractXBRLFromPDF(String pdfFilePath, String outputFile)
        const result = await VoucherFileUtil.extractXBRLFromPDF(pdfFilePath, outputFile);
        return convertVoucherFileInfo(result);
    } catch (error) {
        console.error('从PDF提取XBRL到文件失败:', error);
        throw error;
    }
}

/**
 * JSON转XBRL
 * @param {string} json JSON字符串
 * @param {string} configId 配置ID
 * @returns {Promise<string>} XBRL字符串
 */
async function json2Xbrl(json, configId) {
    try {
        // 调用静态方法: static String json2Xbrl(String json, String configId)
        return await VoucherFileUtil.json2Xbrl(json, configId);
    } catch (error) {
        console.error('JSON转XBRL失败:', error);
        throw error;
    }
}

/**
 * XBRL转JSON
 * @param {string} xbrlXml XBRL XML字符串
 * @param {string} configId 配置ID
 * @returns {Promise<Object>} JSON对象
 */
async function xbrl2Json(xbrlXml, configId) {
    try {
        // 调用静态方法: static JSONObject xbrl2Json(String xbrlXml, String configId)
        const jsonObject = await VoucherFileUtil.xbrl2Json(xbrlXml, configId);

        // 将Java的JSONObject转换为JavaScript对象
        return JSON.parse(jsonObject.toString());
    } catch (error) {
        console.error('XBRL转JSON失败:', error);
        throw error;
    }
}

/**
 * 将VoucherFileInfo对象转换为JavaScript对象
 * 这里假设VoucherFileInfo有以下方法: getFilePath(), getSize(), getContentType()
 * 根据实际类结构可能需要调整
 * @param {Object} voucherFileInfo Java的VoucherFileInfo对象
 * @returns {Promise<Object>} 转换后的JavaScript对象
 */
async function convertVoucherFileInfo(voucherFileInfo) {
    if (!voucherFileInfo) return null;

    try {
        return {
            filePath: await voucherFileInfo.getFilePath(),
            size: await voucherFileInfo.getSize(),
            contentType: await voucherFileInfo.getContentType(),
            // 根据实际的VoucherFileInfo类的getter方法添加更多属性
        };
    } catch (error) {
        console.error('转换VoucherFileInfo失败:', error);
        return {
            raw: voucherFileInfo.toString()
        };
    }
}

// 导出所有方法
module.exports = {
    extractXBRLFromOFD,
    extractXBRLFromOFDToFile,
    extractXBRLFromPDF,
    extractXBRLFromPDFToFile,
    json2Xbrl,
    xbrl2Json
};
