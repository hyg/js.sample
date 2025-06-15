const term1 = require("./term1.js");
const term2 = require("./term2.js");
const EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();

exports.metadata = {
        id: "12",
        name: "term12",
        readme: "readme12",
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
    };

exports.env = {};  
exports.init = function(){
         exports.text =  maketext();
         exports.metadata.readme =  makereadme();
         exports.code =  makecode();
    };
maketext = function(){
        var text = "";
        for(var i in exports.metadata.subterm){
            subterm =  exports.metadata.subterm[i];
            subtext = subterm.term.text ;
            text += subterm.localid + " " + subtext + "\n";
        }
        return text ;
    };
makereadme = function(){
        var readme = "";
        for(var i in exports.metadata.subterm){
            subterm =  exports.metadata.subterm[i];
            submetadata = subterm.term.metadata ;
            readme += subterm.localid + " " + submetadata.readme + "\n";
        }
        return readme ;
    };
makecode = function(){
    	code = new Object();
    	for(var i in exports.metadata.subterm){
    		subterm = exports.metadata.subterm[i];
    		subenv = subterm.term.env ;
			for(var e in subenv.event){
				var eventname = subterm.localid + subenv.event[e];
				code[eventname] = subterm.term.code[subenv.event[e]];
				//code[eventname] = function(){
				//	console.log("%o",this);
					// subterm[i].term.metadata.code[subenv.event[e]];
				//}
			}
    	}
    	return code;
    }
