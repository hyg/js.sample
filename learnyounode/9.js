var http = require('http');
var async = require('async');
var bl = require('bl');

async.parallel([
function(cb){
	http.get(process.argv[2],function(response){
		response.pipe(bl(function (err, data) {
			if (err) return cb(err)
			cb(null,data.toString());
		}))
	})
},
function(cb){
	http.get(process.argv[3],function(response){
		response.pipe(bl(function (err, data) {
			if (err) return cb(err)
			cb(null,data.toString());
		}))
	})
},
function(cb){
	http.get(process.argv[4],function(response){
		response.pipe(bl(function (err, data) {
			if (err) return cb(err)
			cb(null,data.toString());
		}))
	})
}
],function cb(err,results){
	if (err) throw err;
	console.log(results[0]);
	console.log(results[1]);
	console.log(results[2]);
});


// node 9.js http://www.nodejs.org http://www.pku.edu.cn http://www.xuemen.com 