
var http = require('http');
var bl = require('bl');

http.get('http://www.pku.edu.cn',function (response){
	response.on('end',function (e){
		console.log("end..",e.toString())
	});
	response.pipe(bl(function (err,data){
		console.log("\n\n\n\ndata:",data.toString())
	}));
});
