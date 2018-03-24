var krpc = require('k-rpc')
var rpc = krpc()

var Hashes = require('jshashes');

var SHA1 = new Hashes.SHA1;
var str = "cognize" ;
var infoHash = SHA1.hex(str);
 
var target = new Buffer(infoHash, 'hex')

/*
rpc.on('query', function (query, peer) {
  console.log('rpc.on.query | query: ',query)
  console.log('rpc.on.query | peer: ',peer)

  var q = query.q.toString()
  console.log('received %s query from %s:%d', q, peer.address, peer.port)
  if (q == 'X') {
    console.log('q == X...')
    rpc.response(peer, {q: 'X'}, {q: 'cognize'})
  }
})
*/
var then = Date.now()

rpc.populate(rpc.id, {q: 'find_node', a: {id: rpc.id, target: rpc.id}}, function () {
  console.log('(populated)', Date.now() - then)
})

rpc.closest(target, {q: 'get_peers', a: {info_hash: target}}, visit, function (_, n) {
  console.log('(closest)', Date.now() - then, n)
})

function visit (res, peer) {
  var peers = res.r.values ? parsePeers(res.r.values) : []
  if (peers.length) {
    console.log('count peers:', peers.length)
    rpc.queryAll(peers, {q: 'X'}, onreply,function(err, numberOfReplies){
      console.log('queryAll | err:',err)
      console.log('queryAll | numberOfReplies:',numberOfReplies)
    })
  }

  console.log('visit | res: ',res)
  console.log('visit | peer: ',peer)
  console.log('visit | peers: ',peers)
}

function onreply(reply,node){
    console.log('onreply | reply :',reply)
    console.log('onreply | node :',node)
}


function parsePeers (buf) {
  var peers = []

  try {
    for (var i = 0; i < buf.length; i++) {
      var port = buf[i].readUInt16BE(4)
      if (!port) continue
      peers.push({
        host: parseIp(buf[i], 0),
        port: port
      })
    }
  } catch (err) {
    // do nothing
  }

  return peers
}

function parseIp (buf, offset) {
  return buf[offset++] + '.' + buf[offset++] + '.' + buf[offset++] + '.' + buf[offset++]
}