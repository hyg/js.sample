const jora = require('jora');
var fs = require('fs');
var yaml = require('js-yaml');

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

var users = [
    { 'user': 'barney', 'age': 36, 'active': true },
    { 'user': 'fred', 'age': 40, 'active': false },
    { 'user': 'pebbles', 'age': 1, 'active': true }
];
function loadAER(year) {
    var AERmap = new Object();
    var voucherfolder = "../../ego/data/voucher/" + year;
    fs.readdirSync(voucherfolder).forEach(file => {
        if (file.substr(0, 4) == "AER.") {
            var AER = yaml.load(fs.readFileSync(voucherfolder + "/" + file, 'utf8'), { schema: yaml.CORE_SCHEMA });
            AERmap[file] = AER;
        }
    });
    return AERmap;
}
var AERmap = loadAER(2025);
var result,subset,debit,credit ;
const str1 = "2025-05-10";
const str2 = "2025-05-17";

//var result = jora('.foo.bar')({ a: 42 }) // undefined
//result = jora('2 + 2')() // 4
//result = jora('filter(=>age>34)')(users);
//result = jora('.[age>34]')(users);
//result = jora('.entries().filter(=> ((value.date > "2025-05-13") and (value.date < "2025-05-16")) )')(AERmap);
//result = jora('.entries().[(value.date > "2025-05-13") and (value.date < "2025-05-16")]')(AERmap);
//result = jora('.entries().filter(=> value.date.match("2025-01"))')(AERmap);
//result = jora('.entries().[value.date.match("2025-01")]')(AERmap);

//result = jora('.values().[(date > "2025-05-13") and (date < "2025-05-16")]')(AERmap);
//result = jora('.values().[date.match("2025-05")]')(AERmap);

subset = jora('.values().[date.match("2025-06")]')(AERmap);
debit = jora('.AccountingEntry.debit.group(=>AccountTitle,=>amount).({AccountTitle: key,amount: value.sum()})')(subset);
credit = jora('.AccountingEntry.credit.group(=>AccountTitle).({AccountTitle: key,amount: value.amount.sum()})')(subset);

//log(yaml.dump(subset));
//log(yaml.dump(debit));
//log(yaml.dump(credit));

var credit2 = jora('.({AccountTitle,amount: -amount})')(credit);
//log(yaml.dump(credit2));

result = jora('.group(=>AccountTitle,=>amount).({AccountTitle: key,amount: value.sum()})')([...debit,...credit2]);

log(yaml.dump(result));
console.table(result);
