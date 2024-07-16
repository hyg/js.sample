var fs = require('fs');

const args = process.argv.slice(2);
const jsonfilename = args[0];
const data = JSON.parse(fs.readFileSync(jsonfilename, 'utf8'));

if (data.url.includes("eshian.com")) {
    var elementdata = parseeshian(data.table);
    console.log("elementdata:\n%s", elementdata);
}


function parseeshian(table) {
    //console.log("enter parseeshian:\n%s",table[0].tbody);
    var data = new Object();

    for (var i in table[0].tbody) {
        var tr = table[0].tbody[i].tr;
        //console.log("i: %d\ntr:", i, tr);
        var key, value;
        for (var j in tr) {
            var item = tr[j];
            //console.log("j: %d\nitem:", j, item);
            if (item.th != null) {
                key = item.th;
            } else if (item.td != null) {
                value = item.td;
                data[key] = value;
                //console.log("key: %s\t value: %s", key, value);
            } else {
                //console.log("unknow item:", item);
            }
        }
    }
    return data;
}