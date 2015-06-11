
var http = require('http');
var bl = require('bl');
var bytesum = 0;
var strsum = new bl();

http.get(process.argv[2],function (response){
	response.on('end',function (e){
		//console.log("end..",e)
		console.log(bytesum);
		console.log(strsum.toString());
		return;
	});
	response.on('data',function(data){
		bytesum += data.length;
		//console.log("\n\ndata.length",data.length)
		strsum.append(data.toString());
	});
	/*
	response.pipe(bl(function (err,data){
		
		console.log("\n\n\n\ndata:",data.toString())
	}));
	*/
});

// node 8.js http://pan.baidu.com/s/1qWzER3u
// node 8.js http://www.pku.edu.cn