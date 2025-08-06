#!/usr/bin/env node

/**
 * Main entry point for the P2P DHT Node
 */

const { initializeNode } = require('./lib/node.js');
const PeerDiscovery = require('./lib/peer-discovery.js');
const StunClient = require('./lib/stun-client.js');
const WebRtcManager = require('./lib/webrtc-manager.js');
const DHTDiscovery = require('./lib/dht-discovery.js');

// Initialize the node
const node = initializeNode();

// Create system components
const peerDiscovery = new PeerDiscovery();
const stunClient = new StunClient({ debug: node.config.debug });
const webrtcManager = new WebRtcManager({ debug: node.config.debug });
const dhtDiscovery = new DHTDiscovery({ 
  port: 6881, 
  bootstrapNodes: [
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
  ],
  debug: node.config.debug 
});

console.log('P2P DHT Node initialized successfully!');
console.log('Node ID:', node.id);
console.log('Configuration:', node.config);

// Start DHT discovery
if (node.config.meetingCode) {
  dhtDiscovery.start(node.config.meetingCode).then(() => {
    console.log('DHT discovery started successfully for meeting:', node.config.meetingCode);
  }).catch((error) => {
    console.error('Failed to start DHT discovery:', error.message);
  });
} else {
  console.warn('No meeting code provided, DHT discovery disabled');
}

// Listen for node ready event
process.on('node-ready', (readyNode) => {
  console.log('Node is ready:', readyNode.id);
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('Shutting down node gracefully...');
  try {
    // Cleanup connections
    await webrtcManager.cleanup();
    // Stop DHT discovery
    dhtDiscovery.stop();
    console.log('Connections closed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
  process.exit(0);
});

// Export components for use in other modules
module.exports = {
  node,
  peerDiscovery,
  stunClient,
  webrtcManager,
  dhtDiscovery
};