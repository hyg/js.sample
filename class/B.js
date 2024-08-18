import yaml from "js-yaml";
import fs from "fs";


/* export function log (...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
} */

export class B {
    constructor(filename){
        this.fooddata = yaml.load(fs.readFileSync(filename, 'utf8'));
    }
    
}

B.prototype.debug = true;
B.prototype.tostring = function(){
    return yaml.dump(this.fooddata);
}

