var strftime = require('strftime');
var net = require('net');

var server = net.createServer(function(socket){
	var data = strftime('%Y-%m-%d %H:%M:%S');
	socket.write(data);
	socket.end();
});

server.listen(8000);