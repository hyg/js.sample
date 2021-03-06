var http = require('http');
var map = require('through2-map')

var server = http.createServer(function (req, res) {
	console.log('HEADERS: ' + JSON.stringify(res.headers));

	if(req.method == 'POST') {
		/*req.pipe(map(function (chunk) {
		console.log('BODY: ' + chunk);
		return chunk.toString().split('').reverse().join('')
		})).pipe(res)};*/
		req.pipe(map(function (chunk) {
		console.log('BODY: ' + chunk);
		return chunk.toString().toUpperCase()
		})).pipe(res)};

});
server.listen(process.argv[2]);