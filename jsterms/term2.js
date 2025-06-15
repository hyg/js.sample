
exports.metadata = {
        id: "222222",
        name: "term2",
        readme: "term2 readme"
        };
        
exports.text = "term2 text";

exports.env = {
        	rule: ["r10","r11"],
        	event: ["e10","e11"],
        	state: ["s10","s1"],
        	action: ["a10","a11"],
        	asset: []
        };
        
var state = "s10";
exports.code = {
        	e11: function(){
                console.log("enter e11. state=",state);
        		 state = "s10";
                a10("r10");
        	},
        	e10: function(){
                console.log("enter e10. state=",state);
        		var ret ;
        		switch( state){
        			case "s10":
        				 state = "s11";
                         a11("r10");
        				break;
        			case "s11":
        			      state = "s10";
        			      a10("r10");
                          a11("r11");
        			    break;
        		}
        		return ret;
        	}
        }

        	function a10(rule){
        		console.log(rule+": action a10.");
       		};
        	function a11(rule){
            		console.log(rule+": action a11.");
           	};
