var http = require('http');

http.get(process.argv[2],function callback(response){
	//console.log("Got response: " + response.statusCode);
	response.setEncoding('utf8');
	response.on("data",console.log);
	response.on('error', console.error);
});

// node 7.js http://www.pku.edu.cn