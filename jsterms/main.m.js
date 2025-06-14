const yaml = require('js-yaml');
require1 = require("esm")(module);
const term = require1("./term12.mjs");

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

term.init();
//log(yaml.dump(term.metadata));
log("%o",term.metadata);
term.metadata.code["1.e1"]();
