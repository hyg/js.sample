const DHT = require('bittorrent-dht');
const crypto = require('crypto');

// DHT bootstrap nodes
const BOOTSTRAP_NODES = [
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

console.log('Starting simplified P2P node...');

// Create a unique node ID
const nodeId = crypto.randomBytes(20).toString('hex');
console.log(`Node ID: ${nodeId}`);

// Create DHT node
const dht = new DHT({
  bootstrap: BOOTSTRAP_NODES,
  nodeId: nodeId
});

console.log('DHT instance created');

// Handle DHT events
dht.on('ready', () => {
  console.log('DHT is ready');
  
  // Generate a random info hash
  const infoHash = crypto.randomBytes(20).toString('hex');
  console.log(`Using info hash: ${infoHash}`);
  
  // Announce to the DHT network
  dht.announce(infoHash, { port: 6881 }, (err) => {
    if (err) {
      console.error('Announce error:', err);
      return;
    }
    console.log(`Successfully announced info hash: ${infoHash}`);
    console.log('Waiting for peers...');
  });
});

dht.on('peer', (peer, infoHash, from) => {
  console.log(`Found peer: ${peer.host}:${peer.port} for info hash ${infoHash} from ${from.host}:${from.port}`);
});

dht.on('error', (err) => {
  console.error('DHT error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  dht.destroy();
  process.exit(0);
});