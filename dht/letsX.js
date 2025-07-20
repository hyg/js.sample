var Hashes = require('jshashes');
var DHT = require('bittorrent-dht'); // see https://github.com/webtorrent/bittorrent-dht

var SHA1 = new Hashes.SHA1;
var str = "31d82293d8e05b4b6d4828e068d43ab2900a4b26" ;
var infoHash = SHA1.hex(str);

console.log("SHA1.hex(\""+str+"\")="+infoHash);


var dht = new DHT()

dht.on('peer', function (peer, infoHash, from) {
  console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port)
  
})


dht.on('ready', function () { 
  var addr = dht.address() ;
  console.log('ready... dht.address() return:\t' + typeof addr + addr.family + '\t' + addr.address + ':' + addr.port) ;
  
  //console.log('socket info | dht._rpc : \t',dht._prc) ;
  //console.log('socket info | dht._rpc.socket : \t',dht._prc.socket) ;
  
  
  dht.announce(infoHash) ; //dhtjs 34857
  console.log('dht.announce(infoHash) ; //dhtjs 34857\t',infoHash) ;


  dht.lookup(infoHash);
  console.log('dht.lookup(infoHash);\t',infoHash) ;
})