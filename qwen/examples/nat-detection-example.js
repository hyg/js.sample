// NAT Detection Example
// This example demonstrates how to use the NAT detection functionality in your application

const NATManager = require('../src/nat-manager');

async function demonstrateNATDetection() {
  console.log('=== NAT Detection Demonstration ===\n');
  
  // Initialize NAT manager with configuration
  const natManager = new NATManager({
    // Use China-friendly STUN servers first
    stunServers: [
      'stun.qq.com:3478',
      'stun.syncthing.net:3478',
      'stun.cloudflare.com:3478',
      // Fallback to global STUN servers
      'stun.l.google.com:19302',
      'stun1.l.google.com:19302'
    ],
    // TURN servers configuration (if needed)
    turnServers: [
      // Example configuration:
      // {
      //   url: 'turn:your-turn-server.com:3478',
      //   username: 'your-username',
      //   credential: 'your-password'
      // }
    ]
  });
  
  try {
    // Perform NAT detection
    console.log('1. Detecting NAT type...');
    const natInfo = await natManager.determineNATType();
    
    console.log(`\nNAT Detection Results:`);
    console.log(`  Type: ${natInfo.natType}`);
    console.log(`  Mapping Behavior: ${natInfo.natMappingBehavior}`);
    console.log(`  Filtering Behavior: ${natInfo.natFilteringBehavior}`);
    
    // Get detailed behavior information
    console.log('\n2. Detailed NAT behavior:');
    const behavior = natManager.getNATBehavior();
    console.log(`  NAT Type: ${behavior.type}`);
    console.log(`  Mapping: ${behavior.mappingBehavior}`);
    console.log(`  Filtering: ${behavior.filteringBehavior}`);
    
    // Check if TURN relay is needed
    console.log('\n3. TURN relay requirement:');
    const needsTurn = natManager.shouldUseTURN();
    console.log(`  TURN Needed: ${needsTurn ? 'Yes' : 'No'}`);
    
    // Get connection strategy recommendation
    console.log('\n4. Connection strategy recommendation:');
    const strategy = natManager['_recommendConnectionStrategy'](natInfo);
    console.log(`  Recommended Strategy: ${strategy}`);
    
    // Test STUN server connectivity
    console.log('\n5. Testing STUN servers:');
    const stunResults = await natManager.testSTUNServers();
    const successfulServers = stunResults.filter(r => r.success).length;
    console.log(`  Successful connections: ${successfulServers}/${stunResults.length}`);
    
    // Simulate peer NAT compatibility check
    console.log('\n6. Peer compatibility check (simulated):');
    const peerNAT = {
      type: 'restricted',
      mappingBehavior: 'addressDependent',
      filteringBehavior: 'addressDependent'
    };
    
    const compatibility = natManager.generateCompatibilityReport(peerNAT);
    console.log(`  Compatible: ${compatibility.compatible}`);
    console.log(`  Recommended Method: ${compatibility.recommendedMethod}`);
    console.log(`  Success Probability: ${(compatibility.successProbability * 100).toFixed(0)}%`);
    
    // Check for symmetric NAT with timing analysis
    console.log('\n7. Symmetric NAT detection:');
    const isSymmetric = await natManager.detectSymmetricNAT();
    console.log(`  Symmetric NAT Detected: ${isSymmetric ? 'Yes' : 'No'}`);
    
    // Get all TURN servers
    console.log('\n8. TURN server configuration:');
    const turnServers = natManager.getTURNServers();
    if (turnServers.length > 0) {
      console.log('  Configured TURN servers:');
      turnServers.forEach((server, index) => {
        console.log(`    ${index + 1}. ${server.url}`);
      });
    } else {
      console.log('  No TURN servers configured');
    }
    
  } catch (error) {
    console.error('NAT detection failed:', error.message);
  }
  
  console.log('\n=== Demonstration Complete ===');
}

// Run the demonstration
if (require.main === module) {
  demonstrateNATDetection().catch(console.error);
}

module.exports = demonstrateNATDetection;