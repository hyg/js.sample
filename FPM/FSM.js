var fs = require('fs');
var yaml = require('js-yaml');

function log(...s) {
    s[0] = log.caller.name + "> " + s[0];
    console.log(...s);
}

const objfilename = "./fsmobj.yaml";
const fsmmetadata = {
    init: "s0",
    s: {
        s0: "state 0",
        s1: "state 1",
        s2: "state 2",
        s3: "state 3"
    },
    e: {
        e0: "event 0",
        e1: "event 1",
        e2: "event 2"
    },
    a: {
        a0: function (obj) {
            log("action 0");
        },
        a1: function (obj) {
            log("action 1");
        },
        a2: function (obj) {
            log("action 2");
        }
    },
    F: function (obj, event) {
        log("state: %s\tevent: %s", obj.s, event);
        if ((obj.s == "s0") & (event == "e0")) {
            this.a.a0(obj);
            this.a.a1(obj);
            obj.s = "s1";
        } else if ((obj.s == "s0") && (event == "e1")) {
            this.a.a2(obj);
            obj.s = "s2";
        } else if ((obj.s == "s1") && (event == "e1")) {
            this.a.a1(obj);
            obj.s = "s3";
        } else if ((obj.s == "s2") && (event == "e1")) {
            this.a.a2(obj);
            obj.s = "s3";
        } else if ((obj.s == "s3") && (event == "e0")) {
            module.exports.release(obj);
        } else if ((obj.s == "s3") && (event == "e1")) {
            this.a.a1(obj);
            obj.s = "s0";
        } else if ((obj.s == "s3") && (event == "e2")) {
            this.a.a2(obj);
            obj.s = "s3";
        }else {
            log("do nothing.")
        }
        return obj.s;
    }
}

module.exports = {
    init: function (id, parent) {
        var obj = new Object();
        obj.parent = parent;
        // switch(id)...
        obj.s = fsmmetadata.init;
        obj.metadata = "fsmmetadata";
        return obj;
    },
    save: function (obj) {
        return fs.writeFileSync(objfilename,yaml.dump(obj));
    },
    load: function () {
        return yaml.load(fs.readFileSync(objfilename, 'utf8'));
    },
    event: function (obj, event) {
        return eval(obj.metadata).F(obj,event);
    },
    release: function () {

    },
    joint: function(id1,id2,data){

    },
    split: function(obj,data){

    }
}