
module.exports = {
    metadata: {
        id: "222222",
        name: "term2",
        text: "term2 text",
        readme: "term2 readme",
		env: {
        	rule: ["r10","r11"],
        	event: ["e10","e11"],
        	state: ["s10","s1"],
        	action: ["a10","a11"],
        	asset: []
        },
        code: {
        	state: "s10",
        	e11: function(){
        		this.state = "s10";
                a10("r10");
        	},
        	e10: function(){
        		var ret ;
        		switch(this.state){
        			case "s10":
        				this.state = "s11";
                        this.a11("r10");
        				break;
        			case "s11":
        			     this.state = "s10";
        			     this.a10("r10");
                         this.a11("r11");
        			    break;
        		}
        		return ret;
        	},
        	a10: function(rule){
        		console.log(rule+": action a0.");
       		},
        	a11: function(rule){
            		console.log(rule+": action a1.");
           	}
        }
    }
}
