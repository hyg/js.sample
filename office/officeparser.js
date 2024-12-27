const officeParser = require('officeparser');

officeParser.parseOffice("buy.ods", function(data, err) {
    // "data" string in the callback here is the text parsed from the office file passed in the first argument above
    if (err) {
        console.log(err);
        return;
    }
    console.log(data);
})