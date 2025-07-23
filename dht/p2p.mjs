import DHT from 'bittorrent-dht'
import dgram from 'dgram';

const socket = dgram.createSocket('udp4');
socket.bind(30000, () => {
    console.log('Socket is listening on port 30000');
  });
// 监听端口
socket.on('listening', function () {
    console.log('socket listening event.');
    //var strmsg = "笔记本开始监听...";
    //socket.send(strmsg, 0, strmsg.length, 29113, "221.218.141.220"); //将接收到的消息返回给客户端
    //socket.send(strmsg, 0, strmsg.length, 9080, "221.218.141.220"); //将接收到的消息返回给客户端
    //socket.send(strmsg, 0, strmsg.length, 30000, "115.28.214.237"); //将接收到的消息返回给客户端
})

socket.on('error', function (err) {
    console.log('some error on udp server.')
    socket.close();
});

socket.on('message', handleAppMessage);
/*var bfirst = true ;
socket.on('newListener', (event,listener) => {
    console.log("new listener: ",event,listener.length,listener);
    if (event === 'message') {
        // 让库后面再绑定的监听器排在最前
        //const list = socket.rawListeners('message');
        //console.log("list.length:",list.length);
        if (bfirst) {
            bfirst = false;
            //console.log("bfirst:",bfirst)
            //const dhtHandler = listener;
            //socket.removeAllListeners('message');
            //socket.removeAllListeners('newListener');
            socket.on('message', function mymessagelistener(msg, rinfo){
                // 过滤：DHT 报文首字节一定是 0x64
                console.log(`udp server received data: ${msg} from ${rinfo.address}:${rinfo.port}`)
                //const isDHT = msg.length && msg[0] === 0x64;
                //buf.slice(0,4).toString()==='d1:a'（更严谨）。
                const isDHT = msg.length >= 4 && ['d1:a', 'd2:i', 'd1:q', 'd1:r', 'd1:e'].some(m => msg.slice(0, 4).toString().startsWith(m));
                if (isDHT) {
                    console.log("由DHT处理");
                    listener(msg, rinfo);   // 给 DHT
                }else handleAppMessage(msg, rinfo);   // 给业务
            });
        }
    }
    var list = socket.rawListeners('message');
    console.log("end list:",list.length,list);
    if(list.length > 1){
        socket.removeListener('message',socket.rawListeners('message')[1]);
    }
}); */

const dht = new DHT();   // 让 DHT 复用 socket
//const dht = new DHT({ socket });   // 让 DHT 复用 socket
//console.log("socket: %O",socket);
//console.log("dht: %O",dht);
console.log("before addnode(), nodes:",dht.toJSON().nodes)
//dht.addNode("router.bittorrent.com",6881);
dht.addNode({host:"router.bittorrent.com",port:6881});
dht.addNode({host:"dht.transmissionbt.com",port:6881});
dht.addNode({host:"router.utorrent.com",port:6881});
dht.addNode({host:"ns-1.x-fins.com",port:6969});
dht.addNode({host:"tracker.vanitycore.co",port:6881});
console.log("after addnode(), nodes:",dht.toJSON().nodes);

dht.listen(20000, function () {
    console.log('dht listening 20000')
})

dht.on('message', handleAppMessage);

dht.on('peer', function (peer, infoHash, from) {
    console.log('found potential peer ' + infoHash + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
    var strmsg = "笔记本发现你了。";
    socket.send(strmsg, 0, strmsg.length, peer.port, peer.host );
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
    console.log("nodes:",dht.toJSON().nodes)
})

var secretHash = "58c5d8483c4e7d19b86d1351d6cf89b9ae232400";

const INTERVAL_ANNOUNCE = 30 * 1000;
const INTERVAL_LOOKUP = 20 * 1000;

setInterval(() => dht.announce(secretHash,(err)=>{
    if (err) return console.error("announce",err);
}), INTERVAL_ANNOUNCE);
/* setInterval(() => dht.lookup(secretHash, (err, peers) => {
    if (err) return console.error(err);
    console.log('发现 peer: %s , %O', typeof peers, peers);
    //peers.forEach(p => console.log('peer ->', p.host, p.port));
    // peers = [{ host, port }, ...]
}), INTERVAL_LOOKUP); */

function handleAppMessage(msg, rinfo) {
    if(!msg.toString().startsWith("笔记本:")){
        var strmsg = "笔记本:" + msg;
        socket.send(strmsg, 0, strmsg.length, rinfo.port, rinfo.address); //将接收到的消息返回给客户端
    }
}