const term1 = require("./term1.js");
const term2 = require("./term2.js");
const EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();

module.exports = {
    metadata: {
        id: "12",
        name: "term12",
        env: {},
        subterm: [
            {
                localid: "1.",
                term: term1
            },
            {
                localid: "2.",
                term: term2
            }
        ]
    },
    init: function(){
        this.metadata.text = this.maketext();
        this.metadata.readme = this.makereadme();
        this.metadata.code = this.makecode();
    },
    maketext: function(){
        var text = "";
        for(var i in this.metadata.subterm){
            subterm = this.metadata.subterm[i];
            submetadata = subterm.term.metadata ;
            text += subterm.localid + " " + submetadata.text + "\n";
        }
        return text ;
    },
    makereadme: function(){
        var readme = "";
        for(var i in this.metadata.subterm){
            subterm = this.metadata.subterm[i];
            submetadata = subterm.term.metadata ;
            readme += subterm.localid + " " + submetadata.readme + "\n";
        }
        return readme ;
    },
    makecode: function(){
    	code = new Object();
    	for(var i in this.metadata.subterm){
    		subterm = this.metadata.subterm[i];
    		subenv = subterm.term.metadata.env ;
			for(var e in subenv.event){
				var eventname = subterm.localid + subenv.event[e];
				code[eventname] = subterm.term.metadata.code[subenv.event[e]];
				//code[eventname] = function(){
				//	console.log("%o",this);
					//this.subterm[i].term.metadata.code[subenv.event[e]];
				//}
			}
    	}
    	return code;
    }
}
