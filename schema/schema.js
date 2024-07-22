function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

const manifest = ["text","law","code"];
const workflow = {
    text: [code,law],
    law: "schema for law",
    code: "schema for code"
}
const level = {
    task1: 0,
    "task1.code": 0,
    "task1.law":0,
    "schema for task1.code.text": 1
}

module.exports = {
    starttask: function(){

    },
    finishtask: function(){

    },
    makefrontlist: function(){

    }
}