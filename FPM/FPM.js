var fs = require('fs');
var yaml = require('js-yaml');
var FSM = require('./FSM.js');

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

const objfilename = "./fpmobj.yaml";
const fpmmetadata = {
    init: "p0",
    p: {    
        p0: "the init protocol",
        p1: "protocol 1",
        p2: "protocol 2",
        p3: "protocol 3",
        p4: "protocol 4"},
    e:{
        e1: "effect a",
        e2: "effect b",
        e3: "effect c",
        e4: "effect d",
        e5: "effect e"
    },
    F: function(obj){
        if((obj.p == "p0") &(obj.log)){
            obj.p = "p1";
            return "e1";
        }else if((obj.p == "p1") &(obj.log)){
            obj.p = "p2";
            return "e2";
        }else if((obj.p == "p1") &(!obj.log)){
            obj.p = "p3";
            return "e3";
        }else if((obj.p == "p3") &(obj.log)){
            obj.p = "p4";
            return "e4";
        }else if((obj.p == "p4") &(obj.log)){
            obj.p = "p0";
            return "e5";
        }else{
            return "do nothing.";
        }
    }
};

module.exports = {
    debug: true,
    active: false,
    parent: null,
    init: function(id){
        var obj = new Object();
        obj.p = fpmmetadata.init;
        return obj;
    },
    log: function(obj,content){
        obj.log = Boolean(content);
        var effect = fpmmetadata.F(obj)
        return effect;
    },
    joint: function(id1,id2,termid){

    },
    spilit: function(obj,data){

    },
    save:function(obj){
        return fs.writeFileSync(objfilename,yaml.dump(obj));
    },
    load: function(){
        return yaml.load(fs.readFileSync(objfilename, 'utf8'));
    }
}