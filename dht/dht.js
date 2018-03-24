const net = require('net');

var Hashes = require('jshashes');
var DHT = require('bittorrent-dht'); // see https://github.com/webtorrent/bittorrent-dht

var SHA1 = new Hashes.SHA1;
var str = "cognize" ;
var infoHash = SHA1.hex(str);
//infoHash = 'e3811b9539cacff680e418124272177c47477157' ;

console.log("SHA1.hex(\""+str+"\")="+infoHash);
// SHA1.hex(str)=31d82293d8e05b4b6d4828e068d43ab2900a4b26
// SHA1.b64(str)=Mdgik9jgW0ttSCjgaNQ6spAKSyY=


var dht = new DHT()

dht.on('peer', function (peer, Hash, from) {
  console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port + '\tHash : ' + Hash.toString('hex'));

  //var addr = dht.address() ;
  //console.log('dht.address() return:\n' + addr.address + '\n' + addr.family + '\n' + addr.port) ;
})
//dht.on('node', function (node) { 
  //console.log(' found a new node \t');
  //console.log(node );
//})
dht.on('listening', function () { 
  var addr = dht.address() ;
  console.log('listening... dht.address() return:\n' + addr.address + '\n' + addr.family + '\n' + addr.port) ;
})

dht.on('ready', function () { 
  var addr = dht.address() ;
  console.log('ready... dht.address() return:\n' + addr.address + '\n' + addr.family + '\n' + addr.port) ;
  dht.announce(infoHash) ; //dhtjs 34857
  
  tcpserver.listen(addr.port,addr.address)
})

dht.on('warning', function (err) { 
    console.log('warning | err:' ,err) ;
})

// find peers for the given torrent info hash
dht.lookup(infoHash);


var tcpserver = net.createServer(function(sock) {
   console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
   
    // 为这个socket实例添加一个"data"事件处理函数
    sock.on('data', function(data) {
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
        // 回发该数据，客户端将收到来自服务端的数据
        sock.write('You said "' + data + '"');
    });

    // 为这个socket实例添加一个"close"事件处理函数
    sock.on('close', function(data) {
        console.log('CLOSED: ' +
            sock.remoteAddress + ' ' + sock.remotePort);
    });
})