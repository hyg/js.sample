
module.exports = {
    metadata: {
        id: "111111",
        name: "term1",
        text: "term1 text",
        readme: "term1 readme",
        env: {
        	rule: ["r0","r1","r2"],
        	event: ["e0","e1","e2"],
        	state: ["s0","s1","s2"],
        	action: ["a0","a1","a2"],
        	asset: []
        },
        code: {
        	state: "s0",
        	e0: function(){
        		this.state = "s0";	
        	},
        	e1: function(){
        		console.log("enter e1");
        		this.state = "s1";
        		//console.log("%o",this);
        		this.a1("r0");
        	},
        	e2: function(){
        		var ret ;
        		switch(this.state){
        			case "s0":
        				this.state = "s1";
        				this.a0("r0");
        				this.a2("r1");
        				break;
        			case "s1":
        			     this.state = "s2";
        			     this.a1("r0");
        			     this.a0("r1");
        			     break;
        			case "s2":
        				this.state = "s0";
        				this.a0("r0");
        				this.a1("r1");
        			    break;
        		}
        		return ret;
        	},
        	a0: function(rule){
        		console.log(rule+": action a0.");
       		},
        	a1: function(rule){
           		console.log(rule+": action a1.");
           	},
	        a2: function(rule){
	        	console.log(rule+": action a2.");
           	}
        }
    }
}
