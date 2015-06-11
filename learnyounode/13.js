var http = require('http');
var url = require('url');

var server = http.createServer(function (req, res) {
	if(req.method == 'GET') {
		var purl = url.parse(req.url, true);
		switch(purl.pathname){
			case '/api/parsetime':
				parsetime(purl,req, res);
				break;
			case '/api/unixtime':
				unixtime(purl,req, res);
				break;
		}
	}
});

server.listen(process.argv[2]);

function parsetime(purl,req, res){
	var iso = new Date(purl.query.iso);
	var obj = {hour:iso.getHours(),minute:iso.getMinutes(),second:iso.getSeconds()}
	console.log(obj);
	var body = JSON.stringify(obj);
	console.log(body);
	res.writeHead(200, { 'Content-Length': body.length,'Content-Type': 'application/json' })
	
	res.write(body,'utf8');
	res.end();
};

function unixtime(purl,req, res){
	var iso = new Date(purl.query.iso);
	var obj = {unixtime:iso.getTime()}
	console.log(obj);
	var body = JSON.stringify(obj);
	console.log(body);
	res.writeHead(200, { 'Content-Length': body.length,'Content-Type': 'application/json' })
	
	res.write(body,'utf8');
	res.end();
};

