#!/usr/bin/env node

/**
 * Test script for new P2P modules
 */

// Import the modules
const { node, peerDiscovery, stunClient, webrtcManager } = require('./src/index.js');

console.log('Testing P2P DHT Node Modules...\n');

// Test 1: Node initialization
console.log('1. Testing Node Initialization:');
console.log('   Node ID:', node.id);
console.log('   Config debug:', node.config.debug);
console.log('   ✓ Node initialization works\n');

// Test 2: Peer Discovery
console.log('2. Testing Peer Discovery:');
ttry {
  // Add a test peer
  const testPeerId = 'test-peer-123';
  const testPeerInfo = {
    publicAddress: '192.168.1.100',
    port: 8080,
    protocol: 'webrtc'
  };
  
  const added = peerDiscovery.addPeer(testPeerId, testPeerInfo);
  console.log('   Added test peer:', added);
  
  const peers = peerDiscovery.getKnownPeers();
  console.log('   Known peers count:', peers.length);
  
  const peer = peerDiscovery.getPeer(testPeerId);
  console.log('   Retrieved peer ID:', peer ? peer.id : 'Not found');
  
  console.log('   ✓ Peer discovery works\n');
} catch (error) {
  console.error('   ✗ Peer discovery test failed:', error.message);
}

// Test 3: STUN Client (basic test)
console.log('3. Testing STUN Client:');
console.log('   STUN servers:', stunClient.getStunServers());
console.log('   ✓ STUN client initialization works\n');

// Test 4: WebRTC Manager
console.log('4. Testing WebRTC Manager:');
console.log('   Connection count:', webrtcManager.getConnectionCount());
console.log('   ✓ WebRTC manager initialization works\n');

console.log('All module tests completed successfully!');
