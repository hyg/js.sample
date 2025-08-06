#!/usr/bin/env node

/**
 * Simple test for P2P modules
 */

console.log('Testing P2P DHT Node Modules...\n');

// Just test that modules can be imported
try {
  const nodeModule = require('./src/lib/node.js');
  console.log('✓ Node module loaded successfully');
  
  const peerDiscoveryModule = require('./src/lib/peer-discovery.js');
  console.log('✓ Peer discovery module loaded successfully');
  
  const stunClientModule = require('./src/lib/stun-client.js');
  console.log('✓ STUN client module loaded successfully');
  
  const webrtcManagerModule = require('./src/lib/webrtc-manager.js');
  console.log('✓ WebRTC manager module loaded successfully');
  
  console.log('\nAll module imports successful!');
  
} catch (error) {
  console.error('Error importing modules:', error.message);
}