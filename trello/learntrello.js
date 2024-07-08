const config = require("./config.js");
var Trello = require("trello");
var trello = new Trello(config.APIkey,config.token);

var cardstr = `readme: |
- https://docs.pears.com/pear-runtime/api
- https://docs.pears.com/guides/starting-a-pear-terminal-project`;

trello.addCard('pear api sample', cardstr, config.todolistid,
    function (error, trelloCard) {
        if (error) {
            console.log('Could not add card:', error);
        }
        else {
            console.log('Added card:', trelloCard);
        }
    });