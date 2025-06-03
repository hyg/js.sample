var _ = require('lodash');
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
            var AER = yaml.load(fs.readFileSync(voucherfolder + "/" + file, 'utf8'), { schema: yaml.CORE_SCHEMA });
            AERmap[file] = AER;
        }
    });
    return AERmap;
}

var users = [
    { 'user': 'barney', 'age': 36, 'active': true },
    { 'user': 'fred', 'age': 40, 'active': false },
    { 'user': 'pebbles', 'age': 1, 'active': true }
];

var result = _.filter(users, function (o) { return !o.active; });
// => objects for ['fred']

// The `_.matches` iteratee shorthand.
result = _.filter(users, { 'age': 36, 'active': true });
// => objects for ['barney']

// The `_.matchesProperty` iteratee shorthand.
result = _.filter(users, ['active', false]);
// => objects for ['fred']

// The `_.property` iteratee shorthand.
result = _.filter(users, 'active');
// => objects for ['barney']

// Combining several predicates using `_.overEvery` or `_.overSome`.
result = _.filter(users, _.overSome([{ 'age': 36 }, ['age', 40]]));
// => objects for ['fred', 'barney']

var AERmap = loadAER(2025);
const date1 = new Date('2025-05-13');
const date2 = new Date('2025-05-15');

result = _.filter(AERmap, function (o) {
    const date = new Date(o.date);
    if (date > date1 & date < date2) {
        return o;
    }
});

const str1 = '2025-05-15';
const str2 = '2025-05-18';

result = _.filter(AERmap, function (o) {
    if (o.date > str1 & o.date < str2) {
        return o;
    }
});

result = _.filter(AERmap, ['date', str1]);
//console.log(result);
//result = _.chain(users).value();
//log(_.inRange("16","17","18"));
// result = _.chain(users).gte('age', 30).value(); 
//log(_.gte("2025-05-14","2025-05-15"));
result = _(AERmap)
    .filter(o => o.date > str1 & o.date < str2)
    .value();
//log(_.split('2025-05-15','-',2))
log(yaml.dump(result));