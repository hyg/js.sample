var jsonQuery = require('json-query');
var fs = require('fs');
var yaml = require('js-yaml');

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

function loadAER(year) {
    var AERmap = new Object();
    var voucherfolder = "../../ego/data/voucher/" + year;
    fs.readdirSync(voucherfolder).forEach(file => {
        if (file.substr(0, 4) == "AER.") {
            var AER = yaml.load(fs.readFileSync(voucherfolder + "/" + file, 'utf8'), { schema: yaml.FAILSAFE_SCHEMA });
            AERmap[file] = AER;
        }
    });
    return AERmap;
}
var date1= new Date("2025-05-01");
var date2= new Date("2025-05-10");
var helpers = {
    period: function(input){
        //log(yaml.dump(input));
        var date = Date.parse(input.date);
      if (date > date1 & date < date2){
        return input
      }
    }
}
var AERmap = loadAER(2025);
//log(yaml.dump(AERmap));

var result = jsonQuery('[**][*:period]', {data: AERmap, locals: helpers}).value;
log(yaml.dump(result));