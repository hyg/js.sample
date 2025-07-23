const DHT = require('bittorrent-dht');
const crypto = require('crypto');
const ip = require('ip');

class DHTDiscovery {
  constructor(magnetUri, options = {}) {
    this.magnetUri = magnetUri;
    this.nodeId = crypto.randomBytes(20);
    this.port = options.port || 6881;
    this.dht = new DHT();
    this.peers = new Map();
    this.isReady = false;
    
    this.setupDHT();
  }

  setupDHT() {
    this.dht.on('ready', () => {
      console.log('DHT ready, node ID:', this.nodeId.toString('hex'));
      this.isReady = true;
      this.joinSwarm();
    });

    this.dht.on('peer', (peer, infoHash) => {
      const peerKey = `${peer.host}:${peer.port}`;
      if (!this.peers.has(peerKey)) {
        this.peers.set(peerKey, {
          host: peer.host,
          port: peer.port,
          lastSeen: Date.now()
        });
        console.log('Discovered new peer:', peerKey);
      }
    });

    this.dht.on('error', (err) => {
      console.error('DHT error:', err);
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      this.dht.listen(this.port, (err) => {
        if (err) return reject(err);
        console.log(`DHT listening on port ${this.port}`);
        resolve();
      });
    });
  }

  joinSwarm() {
    const infoHash = this.getInfoHashFromMagnet();
    this.dht.lookup(infoHash);
    console.log('Joining swarm with infoHash:', infoHash.toString('hex'));
  }

  getInfoHashFromMagnet() {
    const match = this.magnetUri.match(/xt=urn:btih:([a-fA-F0-9]{40})/);
    if (!match) {
      return crypto.createHash('sha1').update(this.magnetUri).digest();
    }
    return Buffer.from(match[1], 'hex');
  }

  getPublicAddress() {
    return {
      address: ip.address(),
      port: this.port
    };
  }

  getDiscoveredPeers() {
    return Array.from(this.peers.values());
  }

  stop() {
    return new Promise((resolve) => {
      this.dht.destroy(resolve);
    });
  }
}

module.exports = DHTDiscovery;