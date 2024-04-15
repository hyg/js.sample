var fs = require('fs');
var yaml = require('js-yaml');

var data = yaml.load(fs.readFileSync("demo.yaml", 'utf8'));

forerror(42,"");
function forerror(name,indent) {
    var theindent = indent+"\t"
    for (var code in data.code) {
        //console.log("data.code[code]:"+data.code[code]["name"]);
        if(data.code[code]["name"] == name){
            var dependencies = data.code[code]["dependencies"];
            for (var d in dependencies) {
                console.log(theindent+"forerror:" + name + "\tfind dependencies:" + dependencies[d]["name"]);
                forerror(dependencies[d]["name"],theindent);
            }
        }else{
            //console.log("not my code");
        }
    }
}