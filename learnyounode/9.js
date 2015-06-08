var http = require('http');

http.get(process.argv[2],callback);

http.get(process.argv[3],callback);

http.get(process.argv[4],callback);

function callback(response){
	console.log("Got response: " + response.statusCode);
	response.on("data",function (data){
		console.log("Got data: " + data.toString());
	});
	response.on('error', function(e) {
		console.log("Got error: " + e.message);
	});
}
