var fs = require('fs');

fs.readFile(process.argv[2],function callback(err,buf){
	var str = buf.toString();
	var lines = str.split("\n");

	console.log(lines.length-1)
});
