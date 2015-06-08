var http = require('http');

http.get('http://www.pku.edu.cn',function callback(response){
	console.log("Got response: " + response.statusCode);
	response.on("data",function (data){
		console.log("Got data: " + data);
	});
	response.on('error', function(e) {
		console.log("Got error: " + e.message);
	});
});