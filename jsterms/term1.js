
exports.metadata = {
        id: "111111",
        name: "term1",
        readme: "term1 readme"};
exports.text =  "term1 text";

exports.env = {
        	rule: ["r0","r1","r2"],
        	event: ["e0","e1","e2"],
        	state: ["s0","s1","s2"],
        	action: ["a0","a1","a2"],
        	asset: []
        };

var state = "s0";
exports.code = {
        	e0: function(){
                console.log("enter e0. state=",state);
        		 state = "s0";	
        	},
        	e1: function(){
        		console.log("enter e1. state=",state);
        		 state = "s1";
        		//console.log("%o",this);
        		 a1("r0");
        	},
        	e2: function(){
                console.log("enter e2. state=",state);
        		var ret ;
        		switch( state){
        			case "s0":
        				 state = "s1";
        				 a0("r0");
        				 a2("r1");
        				break;
        			case "s1":
        			      state = "s2";
        			      a1("r0");
        			      a0("r1");
        			     break;
        			case "s2":
        				 state = "s0";
        				 a0("r0");
        				 a1("r1");
        			    break;
        		}
        		return ret;
        	}
        };

        	function a0(rule){
        		console.log(rule+": action a0.");
       		};
            
        	function a1(rule){
           		console.log(rule+": action a1.");
           	};
	        function a2(rule){
	        	console.log(rule+": action a2.");
           	};