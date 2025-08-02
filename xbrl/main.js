const xbrlTool = require('./VoucherFileUtil');

async function testXbrlConversion() {
    try {
        // 从PDF提取XBRL到指定文件
        //const extractResult = await xbrlTool.extractXBRLFromOFD("d:\\huangyg\\git\\js.sample\\xbrl\\250F981968D9.OBS3-2025-45Khb9zEQZe1Z7Mcu02o8A_69afecdfa01f4f4e914583dc83363c8c.ofd");
        //const extractResult = await xbrlTool.extractXBRLFromOFD("250F981968D9.ofd");
        const extractResult = await xbrlTool.extractXBRLFromPDF("250F981968D9.pdf");
        
        console.log('提取结果:', extractResult);

        // XBRL转JSON
        const jsonResult = await xbrlTool.xbrl2Json(extractResult,'bker_issuer');
        console.log('XBRL转JSON结果:', jsonResult);

    } catch (error) {
        console.error('操作失败:', error);
    }
}

testXbrlConversion();
