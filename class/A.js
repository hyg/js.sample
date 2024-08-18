import yaml from "js-yaml";
import fs from "fs";


/* export function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
} */

export function A(filename) {
    this.fooddata = yaml.load(fs.readFileSync(filename, 'utf8'));
}

A.prototype.debug = true;
A.prototype.tostring = function () {
    return yaml.dump(this.fooddata);
}
