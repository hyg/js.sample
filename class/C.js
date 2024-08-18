import yaml from "js-yaml";
import fs from "fs";


export function log(...s) {
    //s[0] = log.caller.name + "> " + s[0];
    console.trace();
    console.log(...s);
}

function tostring(data) {
    return yaml.dump(data);
}

export function C(filename) {
    var obj = new Object();
    obj.fooddata = yaml.load(fs.readFileSync(filename, 'utf8'));
    obj.debug = true;
    obj.tostring = tostring;
    return obj;
}