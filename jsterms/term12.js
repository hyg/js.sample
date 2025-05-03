const term1 = require("./term1.js");
const term2 = require("./term2.js");

module.exports = {
    metadata: {
        id: "12",
        name: "term12",
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
    }
}