
var Hashes = require('jshashes');
var DHT = require('bittorrent-dht'); // see https://github.com/webtorrent/bittorrent-dht
var fs = require('fs');
var http = require('http');

var url = require("url");
var yaml = require('js-yaml');

var SHA1 = new Hashes.SHA1;
var str = "cognize" ;
var infoHash = SHA1.hex(str);

console.log("SHA1.hex(\""+str+"\")="+infoHash);
// SHA1.hex(str)=31d82293d8e05b4b6d4828e068d43ab2900a4b26
// SHA1.b64(str)=Mdgik9jgW0ttSCjgaNQ6spAKSyY=

var dht = new DHT()

dht.on('peer', function (peer, Hash, from) {
  console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port + '\tHash : ' + Hash.toString('hex'));
  var options = {
	  hostname: peer.host,
	  port: peer.port,
      //port: 53879,
	  method: 'GET',
	  headers: {
		'Content-Type': 'application/x-yaml'
	  }
	};
  var req = http.request(options, function(res) {
	  //console.log('STATUS: ' + res.statusCode);
	  //console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');

	  res.on('data', function (chunk) {
		console.log('response BODY: ' + chunk);
	  });
	});
	
	req.write('dht test');
	req.end();
})

dht.on('ready', function () { 
  dht.announce(infoHash) ; //dhtjs 34857
  var addr = dht.address() ;
  console.log('ready... dht.address() return:\n' + addr.address + '\n' + addr.family + '\n' + addr.port) ;
})

// find peers for the given torrent info hash
dht.lookup(infoHash);

var server = http.createServer(function (req, res) {
	var chunk = ""; 
	req.on('data', function(data){
      chunk += data ;
    });
    req.on('end', function(){
        console.log('BODY: ' + chunk);
        console.log('BODY length: ' + chunk.length);
        console.log('method: ' + req.method);
        const ip = res.socket.remoteAddress;
        const port = res.socket.remotePort;
        console.log(`你的IP地址是 ${ip}，你的源端口是 ${port}。`);
        
        var body = yaml.load(chunk);
        if(req.method == 'POST') {
            
        } 
		if(req.method == 'PUT') {
		} 
		if(req.method == 'GET') {
			var pathname = url.parse(req.url).pathname;
			var realPath = pathname.substring(1);
			console.log(realPath);
		}
    })
});
server.listen(53879);  // letsX  53879

