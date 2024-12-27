var XLSX = require("xlsx");
//var fs = require("fs");
//XLSX.set_fs(fs);

var workbook = XLSX.readFile("buy.ods");
//console.log(workbook);
var wsnames = workbook.SheetNames;
//console.log(wsnames);
var worksheet = workbook.Sheets["2025.食."];
//console.log(worksheet);
//D1: { t: 's', v: '总计', w: '总计' }
console.log(workbook.Sheets["2025.食."].D1);
//worksheet.D1.w = "test";
//workbook.Sheets["2025.食."].D1.w = "test";
workbook.Sheets["2025.食."].D1 = { t: 's', v: 'test', w: '总计' };
console.log(workbook.Sheets["2025.食."].D1);
//XLSX.utils.sheet_add_aoa(worksheet, { t: 's', v: '总计', w: 'test' }, { origin: "D1" });
// => 无显示不退出。
XLSX.writeFile(workbook, "test.ods");