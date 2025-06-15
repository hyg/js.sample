const yaml = require('js-yaml');
const term = require("./term12.js");

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

term.init();
//log(yaml.dump(term.metadata));
//log("%o",term.metadata);
term.code["1.e1"]();
term.code["1.e2"]();
term.code["1.e2"]();
term.code["1.e2"]();
term.code["2.e10"]();
term.code["2.e10"]();
term.code["1.e2"]();
//log("%o",term.metadata);
