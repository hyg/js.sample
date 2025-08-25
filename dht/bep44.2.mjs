import ed from 'bittorrent-dht-sodium'
import DHT from 'bittorrent-dht'
import crypto from 'node:crypto';
const dht = new DHT({ verify: ed.verify }) // you MUST specify the "verify" param if you want to get mutable content, otherwise null will be returned

// 1. 直接复制控制台带空格、尖括号的整行
var line = 'pk: <Buffer 33 39 4c 0a 19 44 68 e8 ab 2c 9e e8 5f cb 4a 1a ef 9b a9 87 8f 0f 19 ec 02 56 7b 34 40 28 41 9b>';
// 2. 一行代码把 32 字节公钥变成 Uint8Array
/* const key = new Uint8Array(
  line.match(/[0-9a-f]{2}/gi).map(b => parseInt(b, 16))
); */
const key = new Uint8Array(
  [...line.matchAll(/\b[0-9a-f]{2}\b/g)].slice(-32).map(m => parseInt(m[0], 16))
);
console.log("key:",key);

/* line = 'hash= <Buffer ed a6 2a ed 16 b2 d6 82 7e ca bf 1a 71 1e 5a ca 7f 56 d9 fb>';
// 2. 一行代码把 32 字节公钥变成 Uint8Array
var hash2 = new Uint8Array(
  [...line.matchAll(/\b[0-9a-f]{2}\b/g)].slice(-32).map(m => parseInt(m[0], 16))
);
console.log("hash2:",hash2); */

var hash = Buffer.from(crypto.createHash('RSA-SHA1').update(Buffer.from(key)).digest());
// 若要十六进制：Buffer.from(hash).toString('hex');
console.log("hash:",hash);

/* var str = 'ed a6 2a ed 16 b2 d6 82 7e ca bf 1a 71 1e 5a ca 7f 56 d9 fb';
var hex = str.split(" ").join("");
var hash3 = Buffer.from(hex,'hex');
console.log("hash3:",hash3); */

dht.get(hash, function (err, res) {
    console.log("res: ",res);
    console.log("err: ",err);
    //console.log("res.v: ",res.v.toString());
})