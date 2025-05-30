var jsonQuery = require('json-query');
var fs = require('fs');
var yaml = require('js-yaml');

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

var data = {
    people: [
        { date: "2025-05-01", name: 'Matt', country: 'NZ' },
        { date: "2025-04-01", name: 'Pete', country: 'AU' },
        { date: "2025-05-10", name: 'Mikey', country: 'NZ' }
    ]
}
var result = jsonQuery('people[*date~/^2025-05-[0-9]{2}$/]', { data: data, allowRegexp: true }).value;

data = {
    p1: { date: "2025-05-01", name: 'Matt', country: 'NZ' },
    p2: { date: "2025-04-01", name: 'Pete', country: 'AU' },
    p3: { date: "2025-05-10", name: 'Mikey', country: 'NZ' }
    
}
result = jsonQuery('[**][*date~/^2025-05-[0-9]{2}$/]', { data: data, allowRegexp: true }).value;


function loadAER(year) {
    var AERmap = new Object();
    var voucherfolder = "../../ego/data/voucher/" + year;
    fs.readdirSync(voucherfolder).forEach(file => {
        if (file.substr(0, 4) == "AER.") {
            var AER = yaml.load(fs.readFileSync(voucherfolder + "/" + file, 'utf8'), { schema: yaml.CORE_SCHEMA});
            AERmap[file] = AER;
        }
    });
    return AERmap;
}
var AERmap = loadAER(2025);
result = jsonQuery('[**][*date~/^2025-05-1[3-8]$/]', { data: AERmap, allowRegexp: true }).value;

log(yaml.dump(result));