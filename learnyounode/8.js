
var http = require('http');
var bl = require('bl');

http.get('http://pan.baidu.com/s/1qWzER3u',function (response){
	response.on('end',function (e){
		console.log("end..",e)
		return;
	});
	response.on('data',function(data){
		console.log("\n\ndata.length",data.length)
		console.log("\ndata:",data.toString())
	});
	/*
	response.pipe(bl(function (err,data){
		
		console.log("\n\n\n\ndata:",data.toString())
	}));
	*/
});
