const DHT = require('bittorrent-dht');
const Peer = require('simple-peer');

// STUN servers
const STUN_SERVERS = [
  { urls: 'stun:fwa.lifesizecloud.com:3478' },
  { urls: 'stun:stun.isp.net.au:3478' },
  { urls: 'stun:stun.freeswitch.org:3478' },
  { urls: 'stun:stun.voip.blackberry.com:3478' }
];

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

class P2PNode {
  constructor() {
    console.log('Initializing P2P node...');
    this.nodeId = Math.random().toString(36).substring(2, 15);
    console.log(`Node ID: ${this.nodeId}`);
    
    try {
      this.dht = new DHT({ bootstrap: BOOTSTRAP_NODES });
      console.log('DHT instance created');
    } catch (err) {
      console.error('Failed to create DHT instance:', err);
      process.exit(1);
    }
    
    this.peers = new Map();
    this.infoHash = null;
    
    this.setupDHTEvents();
  }
  
  setupDHTEvents() {
    console.log('Setting up DHT event listeners...');
    
    this.dht.on('ready', () => {
      console.log('DHT is ready');
      // Announce our public address
      this.announce();
    });
    
    this.dht.on('announce', (peer, infoHash) => {
      console.log('Announce event received:', peer, infoHash);
      // Handle peer announcement
      this.handlePeerAnnouncement(peer, infoHash);
    });
    
    this.dht.on('peer', (peer, infoHash) => {
      console.log('Peer discovered:', peer, infoHash);
      // Connect to discovered peer
      this.connectToPeer(peer, infoHash);
    });
    
    this.dht.on('error', (err) => {
      console.error('DHT error:', err);
    });
    
    this.dht.on('listening', () => {
      console.log('DHT is listening');
    });
  }
  
  announce() {
    // Generate a random info hash for our node
    this.infoHash = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
    
    console.log(`Announcing info hash: ${this.infoHash}`);
    
    // Announce to the DHT network
    this.dht.announce(this.infoHash, { port: 6881 }, (err) => {
      if (err) {
        console.error('Announce error:', err);
        return;
      }
      console.log(`Successfully announced info hash: ${this.infoHash}`);
      console.log('Waiting for peers...');
    });
  }
  
  handlePeerAnnouncement(peer, infoHash) {
    // For now, just log the announcement
    console.log(`Peer ${peer.host}:${peer.port} announced for info hash ${infoHash}`);
  }
  
  connectToPeer(peer, infoHash) {
    // Create a unique key for the peer
    const peerKey = `${peer.host}:${peer.port}`;
    
    console.log(`Attempting to connect to peer: ${peerKey}`);
    
    // Check if we're already connected to this peer
    if (this.peers.has(peerKey)) {
      console.log(`Already connected to peer: ${peerKey}`);
      return;
    }
    
    // Don't connect to ourselves
    if (peer.port === 6881) {
      console.log(`Skipping connection to self: ${peerKey}`);
      return;
    }
    
    // Create a new SimplePeer instance
    console.log(`Creating SimplePeer instance for ${peerKey}`);
    const simplePeer = new Peer({
      initiator: Math.random() > 0.5, // Randomly decide who initiates
      config: { 
        iceServers: STUN_SERVERS,
        iceCandidatePoolSize: 10
      },
      trickle: true
    });
    
    // Store the peer
    this.peers.set(peerKey, simplePeer);
    
    // Set up event handlers
    simplePeer.on('signal', (data) => {
      console.log('Signal data for peer:', peerKey, JSON.stringify(data));
      // In a real implementation, we would send this signal data to the peer
      // through the DHT or another signaling mechanism
    });
    
    simplePeer.on('connect', () => {
      console.log('Connected to peer:', peerKey);
      // Send a test message
      simplePeer.send(`Hello from ${this.nodeId}`);
    });
    
    simplePeer.on('data', (data) => {
      console.log('Received data from peer:', peerKey, data.toString());
    });
    
    simplePeer.on('close', () => {
      console.log('Connection closed with peer:', peerKey);
      this.peers.delete(peerKey);
    });
    
    simplePeer.on('error', (err) => {
      console.error('Peer connection error with:', peerKey, err.message);
      this.peers.delete(peerKey);
    });
    
    // Log ICE candidate events
    simplePeer.on('iceCandidate', (candidate) => {
      console.log('ICE candidate for peer:', peerKey, candidate);
    });
    
    simplePeer.on('iceStateChange', (state) => {
      console.log('ICE state change for peer:', peerKey, state);
    });
  }
  
  // Method to send data to a specific peer
  sendDataToPeer(peerKey, data) {
    const peer = this.peers.get(peerKey);
    if (peer && peer.connected) {
      peer.send(data);
      console.log(`Sent data to peer ${peerKey}: ${data}`);
    } else {
      console.error('Peer not connected or not found:', peerKey);
    }
  }
  
  // Method to broadcast data to all connected peers
  broadcastData(data) {
    let sentCount = 0;
    for (const [peerKey, peer] of this.peers.entries()) {
      if (peer.connected) {
        peer.send(data);
        sentCount++;
      }
    }
    console.log(`Broadcast data to ${sentCount} peers`);
  }
}

// Start the P2P node
console.log('Starting P2P node...');
const node = new P2PNode();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (node.dht) {
    node.dht.destroy();
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  process.exit(1);
});