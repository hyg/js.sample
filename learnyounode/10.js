var strftime = require('strftime');
var net = require('net');

var server = net.createServer(function(socket){
	var data = strftime('%Y-%m-%d %H:%M');
	socket.write(data);
	socket.end();
});

server.listen(process.argv[2]);