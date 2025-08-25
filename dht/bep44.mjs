import ed from 'bittorrent-dht-sodium'
const keypair = ed.keygen()

console.log("keypair:",keypair);

const value = Buffer.alloc(200).fill('whatever') // the payload you want to send
const opts = {
  k: keypair.pk,
  seq: 0,
  v: value,
  sign: function (buf) {
    return ed.sign(buf, keypair.sk)
  }
}

import DHT from 'bittorrent-dht'
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

const dht = new DHT({ bootstrap: BOOTSTRAPS });  

dht.put(opts, function (err, hash) {
  console.error('error=', err)
  console.log('hash=', hash)
})