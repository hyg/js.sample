import DHT from 'bittorrent-dht'
import magnet from 'magnet-uri'

const uri = 'magnet:?xt=urn:btih:e3811b9539cacff680e418124272177c47477157'
const parsed = magnet(uri)

console.log(parsed.infoHash) // 'e3811b9539cacff680e418124272177c47477157'

const dht = new DHT()

dht.listen(20000, function () {
    console.log('now listening')
})

dht.on('peer', function (peer, infoHash, from) {
    console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port)
})

dht.on('node', function (node) {
    console.log('found node: %O ', node);
})

dht.on('warning', function (err) {
    console.log('warning: %O ', err);
})

dht.on('error', function (err) {
    console.log('error: %O ', err);
})

dht.on('ready', function () {
    console.log('ready');
})

var secretHash = "58c5d8483c4e7d19b86d1351d6cf89b9ae232400";

const INTERVAL_ANNOUNCE = 60 * 1000;
const INTERVAL_LOOKUP = 60 * 1000;

setInterval(() => dht.announce(secretHash), INTERVAL_ANNOUNCE);
setInterval(() => dht.lookup(secretHash, (err, peers) => {
    if (err) return console.error(err);
    console.log('发现 peer:%O', peers);
    // peers = [{ host, port }, ...]
}), INTERVAL_LOOKUP);
