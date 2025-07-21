import DHT from 'bittorrent-dht'
import magnet from 'magnet-uri'
import net from "net";

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

// 创建 TCP 服务器
const server = net.createServer((socket) => {
    console.log('客户端已连接');

    // 接收客户端数据
    socket.on('data', (data) => {
        console.log(`收到数据: ${data}`);
        socket.write(`服务器收到: ${data}`); // 向客户端发送数据
    });

    // 客户端断开连接
    socket.on('end', () => {
        console.log('客户端已断开连接');
    });
});

try {
    // 监听 3000 端口
    server.listen(20000, () => {
        console.log('服务器正在监听 20000 端口');
    });


    // 创建客户端并连接到服务器
    const client = net.createConnection(19113, "221.218.141.220", () => {
        console.log('已连接到服务器');
        client.write('这里是笔记本节点'); // 向服务器发送数据
    });

    // 接收服务器数据
    client.on('data', (data) => {
        console.log(`收到服务器数据: ${data}`);
        client.end(); // 断开连接
    });

    client.on('end', () => {
        console.log('已断开与服务器的连接');
    });
} catch (err) {
    console.log("server error:", err);
}

var secretHash = "58c5d8483c4e7d19b86d1351d6cf89b9ae232400";

const INTERVAL_ANNOUNCE = 60 * 1000;
const INTERVAL_LOOKUP = 60 * 1000;

setInterval(() => dht.announce(secretHash), INTERVAL_ANNOUNCE);
setInterval(() => dht.lookup(secretHash, (err, peers) => {
    if (err) return console.error(err);
    console.log('发现 peer: %s , %O', typeof peers, peers);
    //peers.forEach(p => console.log('peer ->', p.host, p.port));
    // peers = [{ host, port }, ...]
}), INTERVAL_LOOKUP);

