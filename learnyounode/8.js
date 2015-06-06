
var http = require('http'),bl = require('bl');

http.get('http://www.pku.edu.cn',function (response){
	response.pipe(bl(function (err,data){
		console.log("\n\n\n\ndata:",data.toString())
	}));
});
