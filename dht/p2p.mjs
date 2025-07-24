import DHT from 'bittorrent-dht';
import bencode from 'bencode';

/* 复用socket时启用这段
import dgram from 'dgram';

const socket = dgram.createSocket('udp4');
socket.bind(30000, () => {
    console.log('Socket is listening on port 30000');
});
// 监听端口
socket.on('listening', function () {
    console.log('socket listening event.');
    //var strmsg = "笔记本开始监听...";
    //socket.send(strmsg, 0, strmsg.length, 30000, "115.28.214.237"); //将接收到的消息返回给客户端
})

socket.on('error', function (err) {
    console.log('some error on udp server.')
    socket.close();
}); */

const BOOTSTRAPS = [
    { host: '34.197.35.250', port: 6880 },
    { host: '72.46.58.63', port: 51413 },
    { host: '46.53.251.68', port: 16970 },
    { host: '191.95.16.229', port: 55998 },
    { host: '79.173.94.111', port: 1438 },
    { host: '45.233.86.50', port: 61995 },
    { host: '178.162.174.28', port: 28013 },
    { host: '178.162.174.240', port: 28006 },
    { host: '72.21.17.101', port: 22643 },
    { host: '31.181.42.46', port: 22566 },
    { host: '67.213.106.46', port: 61956 },
    { host: '201.131.172.249', port: 53567 },
    { host: '185.203.152.184', port: 2003 },
    { host: '68.146.23.207', port: 42107 },
    { host: '51.195.222.183', port: 8653 },
    { host: '85.17.170.48', port: 28005 },
    { host: '87.98.162.88', port: 6881 },
    { host: '185.145.245.121', port: 8656 },
    { host: '52.201.45.189', port: 6880 }
];

const dht = new DHT({ bootstrap: BOOTSTRAPS });   // 让 DHT 复用 socket
//const dht = new DHT({ "socket":socket,bootstrap: BOOTSTRAPS });   // 复用socket时启用这段

dht.listen(20000, function () {
    console.log('dht listening 20000')
})

dht.on('peer', function (peer, infoHash, from) {
    console.log('found potential peer ' + infoHash.toString() + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
    var strmsg = "笔记本发现你了。";
    dht._rpc.socket.socket.send(strmsg, peer.port, peer.host, (err) => { // 复用socket时，可以直接用socket代替下面所有的dht._rpc.socket.socket
        if (err) {
            console.log("socket.send error:", err);
        } else {
            console.log('peer event Message sent to', peer);
        }
    });
})

dht.on('node', function (node) {
    console.log('found node: ', node.host, node.port,node.distance);
    //console.log("nodes:", dht.toJSON().nodes);
})

dht.on('warning', function (err) {
    console.log('warning: %O ', err);
})

dht.on('error', function (err) {
    console.log('error: %O ', err);
})

dht.on('ready', function () {
    console.log('ready');
    
    var list = dht._rpc.socket.socket.rawListeners('message');
    console.log("ready list:", list.length, list);
    if (list.length == 1) {
        const dhtHandler = list[0];
        dht._rpc.socket.socket.removeAllListeners('message');
        dht._rpc.socket.socket.on('message', function mymessagelistener(msg, rinfo) {
            // 过滤：DHT 报文首字节一定是 0x64
            //console.log(`dht._rpc.socket.socket received data: ${msg} from ${rinfo.address}:${rinfo.port}`)
            //const isDHT = msg.length && msg[0] === 0x64;
            //buf.slice(0,4).toString()==='d1:a'（更严谨）。
            const isDHT = msg.length >= 4 && ['d1:a', 'd2:i', 'd1:q', 'd1:r', 'd1:e'].some(m => msg.slice(0, 4).toString().startsWith(m));
            if (isDHT) {
                var message = bencode.decode(msg);
                //console.log("由DHT处理: %O",message);
                dhtHandler(msg, rinfo);   // 给 DHT
            } else handleAppMessage(msg, rinfo);   // 给业务
        });
    }
    list = dht._rpc.socket.socket.rawListeners('message');
    console.log("ready end list:", list.length, list);
});

var secretHash = "58c5d8483c4e7d19b86d1351d6cf89b9ae232400";

const INTERVAL_ANNOUNCE = 30 * 1000;
const INTERVAL_LOOKUP = 20 * 1000;

setInterval(() => dht.announce(secretHash, (err) => {
    if (err && err.message.includes('No nodes to query')) {
        // 重新 bootstrap 并延迟重试
        BOOTSTRAPS.forEach((node) => dht.addNode(node));
    } else if (err) {
        console.error('announce error:', err);
    } else {
        console.log('announce ok');
    }
}), INTERVAL_ANNOUNCE);

setInterval(() => dht.lookup(secretHash, (err, peers) => {
    if (err) return console.error(err);
    console.log('发现 peer: %s , %O', typeof peers, peers);
}), INTERVAL_LOOKUP);

function handleAppMessage(msg, rinfo) {
    console.log("messge event:", msg.toString(), rinfo);
    if (!msg.toString().startsWith("笔记本")) {
        var strmsg = "笔记本:" + msg;
        dht._rpc.socket.socket.send(strmsg, rinfo.port, rinfo.address, (err) => {
            if (err) {
                console.log("socket.send error:", err);
            } else {
                console.log('message event Message sent to', rinfo);
            }
        });
    }
}