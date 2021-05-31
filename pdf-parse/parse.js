const fs = require('fs');
const path = require("path");
const pdf = require('pdf-parse');
const yaml = require('js-yaml');

let dataBuffer = fs.readFileSync('002614004999.pdf');

pdf(dataBuffer).then(function (data) {

  // number of pages
  console.log(data.numpages);
  // number of rendered pages
  console.log(data.numrender);
  // PDF info
  console.log(data.info);
  // PDF metadata
  console.log(data.metadata);
  // PDF.js version
  // check https://mozilla.github.io/pdf.js/getting_started/
  console.log(data.version);
  // PDF text
  console.log(data.text);

});

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

let dir = "D:\\huangyg\\5-学门科技\\a-管理工作\\财务\\回单";
let arr = fs.readdirSync(dir);
arr.forEach(function (item) {
  let fullpath = path.join(dir, item);
  let stats = fs.statSync(fullpath);
  if (stats.isDirectory()) {
    console.log(fullpath + "is a directory.");
  } else {
    console.log(fullpath);
    let dataBuffer = fs.readFileSync(fullpath);
    pdf(dataBuffer).then(function (rawdata) {
      //console.log(data.text);
      data.rawdata = rawdata.text ;
      fs.writeFile(item.substring(0, item.lastIndexOf("."))+".yaml", yaml.dump(data), function(err, result) {
        if(err) console.log('error', err);
      });
    });
  }
});