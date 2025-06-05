var fs = require('fs');
var yaml = require('js-yaml');
const { keyBy } = require('lodash');

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

//subset = Object.values(AERmap).filter(({date})=> date>str1 && date < str2);
subset = Object.values(AERmap).filter(({date})=> date.match("2025-06"));
var initialValue = new Array();
debit = subset.reduce((accumulator, currentValue) => {accumulator.push(...currentValue.AccountingEntry.debit);return accumulator;},initialValue);
initialValue = new Array();
credit = subset.reduce((accumulator, currentValue) => {accumulator.push(...currentValue.AccountingEntry.credit);return accumulator;},initialValue);
//Object.groupBy(Object.values(AERmap).AccountingEntry.,()=>{});
//log(yaml.dump(subset));
var credit2 = credit.map((x)=>new Object({"AccountTitle":x.AccountTitle,"asset":x.asset,"amount":-1*x.amount}));

result = Object.groupBy([...debit,...credit2],({AccountTitle,asset})=>AccountTitle+","+asset);
const result2 = Object.entries(result).map(([title, records]) => ({
    title,
    amount: records.reduce((acc, curr) => acc + curr.amount, 0),
  }));
//var result2 = result.map((x)=>)
//log(yaml.dump(debit));
//log(yaml.dump(credit));
//log(yaml.dump(credit2));

log(yaml.dump(result2));
//console.table(result);
