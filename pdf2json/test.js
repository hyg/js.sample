let fs = require('fs'),
    path = require("path"),
    PDFParser = require("pdf2json"),
    yaml = require('js-yaml'),
    async = require('async');

//emitter.setMaxListeners(Infinity);
require('events').EventEmitter.defaultMaxListeners = 80;

let pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errdata => console.error(errdata.parserError) );


let data = new Object();
data.date = null;
data.title = null;
data.VoucherID = null;
data.VoucherType = null;
data.summary = null;
data.amount = null;
data.item = [];
let dataitem = new Object();
dataitem.name = "name";
dataitem.data = "data";
data.item.push(dataitem);

let rawdata = new Object();
let itemid = 0 ;
let laststr ;
let laststrIsname = false;
let Isbody = false ;
let Isname = false ;
let filename = "";

pdfParser.on("pdfParser_dataReady", pdfdata => {
  console.log(pdfdata);

  //console.log(pdfrawdata.formImage.Pages[0]);
  rawdata = new Object();
  itemid = 0 ;
  laststrIsname = false;
  Isbody = false ;
  Isname = false ;
  filename = "";

  for(var pageid in pdfdata.formImage.Pages){
    for(var testid in pdfdata.formImage.Pages[pageid].Texts){
      text = decodeURI(pdfdata.formImage.Pages[pageid].Texts[testid].R[0].T)
      rawdata[itemid++] = text;

      //console.log("text = " + text + "\tIsbody = " + Isbody + "\tIsname = " + Isname +"\n\tlaststr = " + laststr + "\tlaststrIsname = " + laststrIsname) ;

      if("回单编号：" == laststr){
        filename = text ;
      }
      laststr = text;
      laststrIsname = Isname ;
    }
  }
  data.rawdata = rawdata ;
  //console.log(data);
  console.log(filename);
  fs.writeFile(filename+".yaml", yaml.dump(data), function(err, result) {
    if(err) console.log('error', err);
  });

});


let dir = "D:\\huangyg\\5-学门科技\\a-管理工作\\财务\\回单";
  let arr = fs.readdirSync(dir);
  arr.forEach(async function(item){
      let fullpath = path.join(dir,item);
      let stats = fs.statSync(fullpath);
      if(stats.isDirectory()){
        console.log(fullpath + "is a directory.");
      }else{
        console.log(fullpath);
        await pdfParser.loadPDF(fullpath);
      }
  });

//pdfParser.loadPDF("002614004999.pdf");


/* 
D:\huangyg\git\js.sample\pdf2json>node test
批次号：
2047000420210531000000082001
总张数：
1
当前第
1
张
回 单
借方
凭证号码：
凭证种类：
借贷标志：
非转账类交易
转账方式：
110060974018010012087
付款人账号：
主账号：
北京学门科技有限公司
付款人名称：
交通银行北京上地支行
开户行名称：
收款人账号：
收款人名称：
开户行名称：
CNY
币种：
50.00
金额：
人民币 伍拾圆整
金额大写：
网银服务年费从2019年01月27日至2020年01月26日
摘要：
附加信息：
回单编号：
002614004999
回单类型：
公共收费
业务名称：
20200126
1
EEA0000001834317
EEA0000
01110296999
经办柜员：
打印机构：
记账机构：
01110800999
复核柜员：
EEA0000
次
EEA0000
打印次数：
会计流水号：
记账柜员：
记账日期：
授权柜员：
打印柜员：


D:\huangyg\git\js.sample\pdf2json>node test
text = 批次号： laststr = undefined     laststrIsname = false
text = 2047000420210531000000082001     laststr = 批次号：      laststrIsname = true
text = 总张数： laststr = 2047000420210531000000082001  laststrIsname = false
text = 1        laststr = 总张数：      laststrIsname = true
text = 当前第   laststr = 1     laststrIsname = false
text = 1        laststr = 当前第        laststrIsname = false
text = 张       laststr = 1     laststrIsname = false
text = 回 单    laststr = 张    laststrIsname = false
text = 借方     laststr = 回 单 laststrIsname = false
text = 凭证号码：       laststr = 借方  laststrIsname = false
text = 凭证种类：       laststr = 凭证号码：    laststrIsname = true
text = 借贷标志：       laststr = 凭证种类：    laststrIsname = true
text = 非转账类交易     laststr = 借贷标志：    laststrIsname = true
text = 转账方式：       laststr = 非转账类交易  laststrIsname = false
text = 110060974018010012087    laststr = 转账方式：    laststrIsname = true
text = 付款人账号：     laststr = 110060974018010012087 laststrIsname = false
text = 主账号： laststr = 付款人账号：  laststrIsname = true
text = 北京学门科技有限公司     laststr = 主账号：      laststrIsname = true
text = 付款人名称：     laststr = 北京学门科技有限公司  laststrIsname = false
text = 交通银行北京上地支行     laststr = 付款人名称：  laststrIsname = true
text = 开户行名称：     laststr = 交通银行北京上地支行  laststrIsname = false
text = 收款人账号：     laststr = 开户行名称：  laststrIsname = true
text = 收款人名称：     laststr = 收款人账号：  laststrIsname = true
text = 开户行名称：     laststr = 收款人名称：  laststrIsname = true
text = CNY      laststr = 开户行名称：  laststrIsname = true
text = 币种：   laststr = CNY   laststrIsname = false
text = 50.00    laststr = 币种：        laststrIsname = true
text = 金额：   laststr = 50.00 laststrIsname = false
text = 人民币 伍拾圆整  laststr = 金额：        laststrIsname = true
text = 金额大写：       laststr = 人民币 伍拾圆整       laststrIsname = false
text = 网银服务年费从2019年01月27日至2020年01月26日     laststr = 金额大写：    laststrIsname = true
text = 摘要：   laststr = 网银服务年费从2019年01月27日至2020年01月26日  laststrIsname = false
text = 附加信息：       laststr = 摘要：        laststrIsname = true
text = 回单编号：       laststr = 附加信息：    laststrIsname = true
text = 002614004999     laststr = 回单编号：    laststrIsname = true
text = 回单类型：       laststr = 002614004999  laststrIsname = false
text = 公共收费 laststr = 回单类型：    laststrIsname = true
text = 业务名称：       laststr = 公共收费      laststrIsname = false
text = 20200126 laststr = 业务名称：    laststrIsname = true
text = 1        laststr = 20200126      laststrIsname = false
text = EEA0000001834317 laststr = 1     laststrIsname = false
text = EEA0000  laststr = EEA0000001834317      laststrIsname = false
text = 01110296999      laststr = EEA0000       laststrIsname = false
text = 经办柜员：       laststr = 01110296999   laststrIsname = false
text = 打印机构：       laststr = 经办柜员：    laststrIsname = true
text = 记账机构：       laststr = 打印机构：    laststrIsname = true
text = 01110800999      laststr = 记账机构：    laststrIsname = true
text = 复核柜员：       laststr = 01110800999   laststrIsname = false
text = EEA0000  laststr = 复核柜员：    laststrIsname = true
text = 次       laststr = EEA0000       laststrIsname = false
text = EEA0000  laststr = 次    laststrIsname = false
text = 打印次数：       laststr = EEA0000       laststrIsname = false
text = 会计流水号：     laststr = 打印次数：    laststrIsname = true
text = 记账柜员：       laststr = 会计流水号：  laststrIsname = true
text = 记账日期：       laststr = 记账柜员：    laststrIsname = true
text = 授权柜员：       laststr = 记账日期：    laststrIsname = true
text = 打印柜员：       laststr = 授权柜员：    laststrIsname = true
{
  '批次号：': '2047000420210531000000082001',
  '总张数：': '1',
  '借贷标志：': '非转账类交易',
  '转账方式：': '110060974018010012087',
  '主账号：': '北京学门科技有限公司',
  '付款人名称：': '交通银行北京上地支行',
  '开户行名称：': 'CNY',
  '币种：': '50.00',
  '金额：': '人民币 伍拾圆整',
  '金额大写：': '网银服务年费从2019年01月27日至2020年01月26日',
  '回单编号：': '002614004999',
  '回单类型：': '公共收费',
  '业务名称：': '20200126',
  '记账机构：': '01110800999',
  '复核柜员：': 'EEA0000'
}
*/