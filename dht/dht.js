const net = require('net');
const request = require('request');

var Hashes = require('jshashes');
var DHT = require('bittorrent-dht'); // see https://github.com/webtorrent/bittorrent-dht

var natip ;
request('http://api.ipify.org', function (error, response, body) {
  //console.log('error:', error); // Print the error if one occurred
  //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  //console.log('body:', body); // Print the HTML for the Google homepage.
  natip = body;
});

var SHA1 = new Hashes.SHA1;
var str = "Let's X test." ;
//var str = "cognize" ;
var infoHash = SHA1.hex(str);
//infoHash = 'e3811b9539cacff680e418124272177c47477157' ;

console.log("SHA1.hex(\""+str+"\")="+infoHash);
// SHA1.hex(str)=31d82293d8e05b4b6d4828e068d43ab2900a4b26
// SHA1.b64(str)=Mdgik9jgW0ttSCjgaNQ6spAKSyY=

var dht = new DHT()
var peers ;

dht.on('ready', function () { 
  var addr = dht.address() ;
  console.log('ready... dht.address() return:\t' + addr.family + '\t' + addr.address + ':' + addr.port) ;
  dht.announce(infoHash) ; //dhtjs 34857
  console.log('dht.announce(infoHash) ; //dhtjs 34857\t',infoHash) ;
  tcpserver.listen(addr.port,addr.address)
  console.log('tcpserver.listen(addr.port,addr.address)\t',addr.port,addr.address) ;
  dht.lookup(infoHash,scanpeer);
  console.log('dht.lookup(infoHash);\t',infoHash) ;
  peers = new Object();
})

dht.on('peer', function (peer, Hash, from) {
  console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port + '\tHash : ' + Hash.toString('hex'));

  //var addr = dht.address() ;
  //console.log('dht.address() return:\n' + addr.address + '\n' + addr.family + '\n' + addr.port) ;
  if(peer.host != natip){
    peers[peer.host+':'+peer.port] = peer ;
  }
})

function scanpeer(err,n){
  console.log('scanpeer... :\t' , err,'\t',n ) ;
  var client = new net.Socket();
  for(key in peers){
    var peer = peers[key];
    console.log('scanpeer... peer :\t' ,peer.host,':', peer.port ) ;
    
    client.connect(peer.port , peer.host, function() {
      console.log('CONNECTED TO: ' + peer.host + ':' + peer.port);
      // 建立连接后立即向服务器发送数据，服务器将收到这些数据 
      client.write('Let\'s X');
    });
    client.on('error', function(err) {
        console.log('error event:\t',err);
    })
    
    // 为客户端添加“data”事件处理函数
    // data是服务器发回的数据
    client.on('data', function(data) {
      console.log('DATA: ' + data);
      // 完全关闭连接
      client.destroy();
    });
  }
}

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
