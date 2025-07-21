import DHT from 'bittorrent-dht'
import dgram from 'dgram';

const socket = dgram.createSocket('udp4');

var bfirst = true ;
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
});

const dht = new DHT({ socket });   // 让 DHT 复用 socket

/* socket.on('newListener', (event,listener) => {
    console.log("new listener: ",event,listener);
    if (event === 'message') {
        // 让库后面再绑定的监听器排在最前
        const list = socket.rawListeners('message');
        console.log("list.length:",list.length);
        if (list.length === 1) {
            const dhtHandler = list[0];
            socket.removeAllListeners('message');
            socket.on('message', function mymessagelistener(msg, rinfo){
                // 过滤：DHT 报文首字节一定是 0x64
                console.log(`udp server received data: ${msg} from ${rinfo.address}:${rinfo.port}`)
                const isDHT = msg.length && msg[0] === 0x64;
                //buf.slice(0,4).toString()==='d1:a'（更严谨）。
                //const isDHT = msg.length >= 4 && ['d1:a', 'd2:i', 'd1:q', 'd1:r', 'd1:e'].some(m => msg.slice(0, 4).toString().startsWith(m));
                if (isDHT) {
                    console.log("由DHT处理");
                    dhtHandler(msg, rinfo);   // 给 DHT
                }else handleAppMessage(msg, rinfo);   // 给业务
            });
        }
    }
});

const dht = new DHT({ socket });   // 让 DHT 复用 socket
socket.once('message', function temp(msg, rinfo){
    // DHT 消息都以固定 4 字节 magic 开头：
    const isDHT = msg.length >= 4 && ['d1:a', 'd2:i', 'd1:q', 'd1:r', 'd1:e'].some(
        m => msg.slice(0, 4).toString().startsWith(m)
    );
    // const isDHT = buf.length > 0 && buf[0] === 0x64; // 'd'
    console.log(`received data: ${msg} from ${rinfo.address}:${rinfo.port}`)

    if (isDHT) {
        // 把消息交给 bittorrent-dht
        //dht.onmessage(msg, rinfo);
        console.log("DHT处理");
        //dht._rpc.onData(msg, rinfo);   // ← 正确的入口
    } else {
        // 你的业务协议
        handleAppMessage(msg, rinfo);
    }
});  */

socket.on('error', function (err) {
    console.log('some error on udp server.')
    udp_server.close();
})

// 监听端口
socket.on('listening', function () {
    console.log('udp server linstening 20000.');
    var strmsg = "笔记本开始监听...";
    //socket.send(strmsg, 0, strmsg.length, 29113, "221.218.141.220"); //将接收到的消息返回给客户端
    //socket.send(strmsg, 0, strmsg.length, 9080, "221.218.141.220"); //将接收到的消息返回给客户端
    socket.send(strmsg, 0, strmsg.length, 20000, "115.28.214.237"); //将接收到的消息返回给客户端
})

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

const INTERVAL_ANNOUNCE = 30 * 1000;
const INTERVAL_LOOKUP = 60 * 1000;

setInterval(() => dht.announce(secretHash), INTERVAL_ANNOUNCE);
setInterval(() => dht.lookup(secretHash, (err, peers) => {
    if (err) return console.error(err);
    console.log('发现 peer: %s , %O', typeof peers, peers);
    //peers.forEach(p => console.log('peer ->', p.host, p.port));
    // peers = [{ host, port }, ...]
}), INTERVAL_LOOKUP);

function handleAppMessage(msg, rinfo) {
    var strmsg = "笔记本收到" + msg;
    socket.send(strmsg, 0, strmsg.length, rinfo.port, rinfo.address); //将接收到的消息返回给客户端
}