import * as term1 from "./term1.mjs";
import * as term2 from "./term2.mjs";

export let metadata = {
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
    };
  
export function init(){
        metadata.text = maketext();
        metadata.readme = makereadme();
        metadata.code = makecode();
    };
    
export function maketext(){
        var text = "";
        for(var i in metadata.subterm){
            let subterm = metadata.subterm[i];
            let subtext = subterm.term.text ;
            text += subterm.localid + " " + subtext + "\n";
        }
        return text ;
    };

export function makereadme(){
        var readme = "";
        for(var i in metadata.subterm){
            let subterm = metadata.subterm[i];
            let submetadata = subterm.term.metadata ;
            readme += subterm.localid + " " + submetadata.readme + "\n";
        }
        return readme ;
    };

export function makecode(){
    	let code = new Object();
    	for(var i in metadata.subterm){
    		let subterm = metadata.subterm[i];
    		let subenv = subterm.term.env ;
			for(var e in subenv.event){
				let eventname = subterm.localid + subenv.event[e];
				code[eventname] = subterm.term.code[subenv.event[e]];
				//code[eventname] = function(){
				//	console.log("%o",this);
				//	metadata.subterm[i].term.code[subenv.event[e]];
				//}
			}
    	}
    	return code;
    }

