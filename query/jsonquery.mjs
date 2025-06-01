import { jsonquery } from '@jsonquerylang/jsonquery'
//var jsonquery = require('@jsonquerylang/jsonquery');
//var fs = require('fs');
//var yaml = require('js-yaml');
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
var fs = require('fs');
var yaml = require('js-yaml');

/* function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
} */

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

const data = {
  "friends": [
    { "name": "Chris", "age": 23, "city": "New York" },
    { "name": "Emily", "age": 19, "city": "Atlanta" },
    { "name": "Joe", "age": 32, "city": "New York" },
    { "name": "Kevin", "age": 19, "city": "Atlanta" },
    { "name": "Michelle", "age": 27, "city": "Los Angeles" },
    { "name": "Robert", "age": 45, "city": "Manhattan" },
    { "name": "Sarah", "age": 31, "city": "New York" }
  ]
}

// Get the array containing the friends from the object, filter the friends that live in New York,
// sort them by age, and pick just the name and age out of the objects.
var result = jsonquery(data, `
  .friends 
    | filter(.city == "New York") 
    | sort(.age) 
    | pick(.name, .age)
`)
// result = [
//   { "name": "Chris", "age": 23 },
//   { "name": "Sarah", "age": 31 },
//   { "name": "Joe", "age": 32 }
// ]

result = jsonquery(AERmap, `
  values()
    | filter((.date > "2025-05-13") and (.date < "2025-05-15"))
  `);
console.log(yaml.dump(result));