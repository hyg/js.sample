var fs = require('fs');
var yaml = require('js-yaml');
var FSM = require('./FSM.js');

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

const objfilename = "./machineobj.yaml";
const initdata = {
    debug: true,
    active: false,
    hub: null,
    sub: null,
    type: null,
    data: null
};

const rootmachine = {};
const machine = {};
const eventmachine = {};

module.exports = {

};