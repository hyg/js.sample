
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
})

// find peers for the given torrent info hash
dht.lookup(infoHash);
dht.announce(infoHash,34857) ; //dhtjs

