var fs = require('fs');
var yaml = require('js-yaml');

var dataobj = yaml.load(fs.readFileSync("test.yaml"));
var codestr =  dataobj.code ;
import(codestr).then((code)=>{
    code.datatoview(dataobj);
}).catch((err) => {
    console.log("error:"+err);
});