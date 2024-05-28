var { Level } = require("level");
var levelgraph = require("levelgraph");

// just use this in the browser with the provided bundle
var db = levelgraph(new Level("yourdb"));

/* var triple = { subject: "a", predicate: "b", object: "c", "someStuff": 42 };
db.put(triple, function() {
  db.get({ subject: "a" , predicate: "c"}, function(err, list) {
    console.log(list);
  });
}); */

db.put([{
    subject: "s1",
    predicate: "a",
    object: "s2"
}, {
    subject: "s2",
    predicate: "a",
    object: "s3"
}, {
    subject: "s3",
    predicate: "a",
    object: "s4"
}, {
    subject: "s4",
    predicate: "a",
    object: "s5"
}, {
    subject: "s5",
    predicate: "a",
    object: "s1"
}, {
    subject: "s1",
    predicate: "b",
    object: "s3"
}, {
    subject: "s3",
    predicate: "b",
    object: "s5"
}, {
    subject: "s5",
    predicate: "b",
    object: "s2"
}, {
    subject: "s2",
    predicate: "b",
    object: "s4"
}, {
    subject: "s4",
    predicate: "b",
    object: "s1"
}], function () {
    var state = "s1";
    db.get({
        subject: state,
        predicate: "a"
    }, function (err, results) {
        console.log(state, "-[a]->", results[0].object);
        state = results[0].object;
        db.get({
            subject: state,
            predicate: "a"
        }, function (err, results) {
            console.log(state, "-[a]->", results[0].object);
            state = results[0].object;
            db.get({
                subject: state,
                predicate: "a"
            }, function (err, results) {
                console.log(state, "-[a]->", results[0].object);
                state = results[0].object;
                db.get({
                    subject: state,
                    predicate: "a"
                }, function (err, results) {
                    console.log(state, "-[a]->", results[0].object);
                    state = results[0].object;
                    db.get({
                        subject: state,
                        predicate: "a"
                    }, function (err, results) {
                        console.log(state, "-[a]->", results[0].object);
                        state = results[0].object;
                        db.get({
                            subject: state,
                            predicate: "b"
                        }, function (err, results) {
                            console.log(state, "-[b]->", results[0].object);
                            state = results[0].object;

                            db.get({
                                subject: state,
                                predicate: "b"
                            }, function (err, results) {
                                console.log(state, "-[b]->", results[0].object);
                                state = results[0].object;
                                db.get({
                                    subject: state,
                                    predicate: "b"
                                }, function (err, results) {
                                    console.log(state, "-[b]->", results[0].object);
                                    state = results[0].object;
                                    db.get({
                                        subject: state,
                                        predicate: "b"
                                    }, function (err, results) {
                                        console.log(state, "-[b]->", results[0].object);
                                        state = results[0].object;
                                        db.get({
                                            subject: state,
                                            predicate: "b"
                                        }, function (err, results) {
                                            console.log(state, "-[b]->", results[0].object);
                                            state = results[0].object;
                                        });
                                    });
                                });
                            });
                        });
                    })
                })
            })
        })
    })




});