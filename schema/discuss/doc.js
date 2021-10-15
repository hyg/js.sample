var fs = require('fs');
var yaml = require('js-yaml');

var a1 = yaml.load(fs.readFileSync("a1.yaml", 'utf8'));
console.log(a1);