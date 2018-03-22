
var Hashes = require('jshashes');
var DHT = require('bittorrent-dht'); // see https://github.com/webtorrent/bittorrent-dht

var SHA1 = new Hashes.SHA1;
var str = "cognize" ;
var infoHash = SHA1.hex(str);
//infoHash = 'e3811b9539cacff680e418124272177c47477157' ;

console.log("SHA1.hex("+str+")="+infoHash);
// SHA1.hex(str)=31d82293d8e05b4b6d4828e068d43ab2900a4b26
// SHA1.b64(str)=Mdgik9jgW0ttSCjgaNQ6spAKSyY=


var dht = new DHT()

dht.announce(infoHash,34857) ; //dhtjs


dht.listen(20000, function () {
  console.log('now listening')
})

dht.on('peer', function (peer, infoHash, from) {
  console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port)
})

// find peers for the given torrent info hash
dht.lookup(infoHash)