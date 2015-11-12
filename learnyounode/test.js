var http = require('http');

var server1 = http.createServer(function (req, res) {
	res.write("server1",'utf8');
	res.end();
});
server1.listen(80);

var server2 = http.createServer(function (req, res) {
	res.write("server2",'utf8');
	res.end();
});
server2.listen(81);