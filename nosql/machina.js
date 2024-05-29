// node.js/CommonJS:
var machina = require('machina');

var fiveelements = new machina.Fsm({
    namespace: "five-elements",
    initialState: "s1",
    states: {
        s1: {
            "a": "s2",
            "b": "s3"
        },
        s2: {
            "a": "s3",
            'b': "s4"
        },
        s3: {
            "a": "s4",
            'b': "s5"
        },
        s4: {
            "a": "s5",
            'b': "s1"
        },
        s5: {
            "a": "s1",
            'b': "s2"
        }
    }
});
fiveelements.on("transition", function (data) {
    console.log("we just transitioned from " + data.fromState + " to " + data.toState);
});

fiveelements.handle("a");
fiveelements.handle("a");
fiveelements.handle("a");
fiveelements.handle("a");
fiveelements.handle("a");
fiveelements.handle("b");
fiveelements.handle("b");
fiveelements.handle("b");
fiveelements.handle("b");
fiveelements.handle("b");