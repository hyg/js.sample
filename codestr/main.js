var fs = require('fs');
var yaml = require('js-yaml');

var dataobj = yaml.load(fs.readFileSync("test.yaml"));

var mjsstr =  dataobj.mjs ;
import(mjsstr).then((code)=>{
    code.datatoview(dataobj);
}).catch((err) => {
    console.log("error:"+err);
});

var jsstr =  dataobj.js ;
try{
    require(jsstr).datatoview(dataobj);
}
catch(err){
    console.log("error:"+err);
};