var http = require('http');

http.get(process.argv[2],function callback(response){
	//console.log("Got response: " + response.statusCode);
	response.on("data",function (data){
		console.log(data.toString());
	});
	response.on('error', function(e) {
		console.log("Got error: " + e.message);
	});
});

// node 7.js http://www.pku.edu.cn