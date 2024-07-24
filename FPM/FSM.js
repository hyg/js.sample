var fs = require('fs');
var yaml = require('js-yaml');

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

module.exports = {
    
}