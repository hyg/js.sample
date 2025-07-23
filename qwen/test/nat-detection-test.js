const NATManager = require('../src/nat-manager');

// Test the enhanced NAT detection functionality
async function testNATDetection() {
  console.log('=== NAT Detection Test ===\n');
  
  // Create a NAT manager instance with default configuration
  const natManager = new NATManager({
    stunServers: [
      'stun.qq.com:3478',
      'stun.syncthing.net:3478',
      'stun.cloudflare.com:3478',
      'stun.l.google.com:19302'
    ]
  });
  
  try {
    // Test 1: Basic STUN connectivity
    console.log('1. Testing STUN server connectivity...');
    const stunResults = await natManager.testSTUNServers();
    console.log('STUN Test Results:');
    stunResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.server}: ${result.success ? '✓' : '✗'}`);
    });
    
    // Test 2: Comprehensive NAT type detection
    console.log('\n2. Performing comprehensive NAT type detection...');
    const natInfo = await natManager.determineNATType(true); // Force refresh
    
    console.log('\nNAT Detection Results:');
    console.log(`   NAT Type: ${natInfo.natType}`);
    console.log(`   Mapping Behavior: ${natInfo.natMappingBehavior}`);
    console.log(`   Filtering Behavior: ${natInfo.natFilteringBehavior}`);
    
    if (natInfo.details) {
      console.log('   Details:');
      if (natInfo.details.test1) {
        console.log(`     Public IP: ${natInfo.details.test1.mappedIP}:${natInfo.details.test1.mappedPort}`);
        console.log(`     Local IP: ${natInfo.details.test1.sourceIP}:${natInfo.details.test1.sourcePort}`);
      }
    }
    
    // Test 3: Connection strategy recommendation
    console.log('\n3. Connection strategy recommendation...');
    const strategy = natManager['_recommendConnectionStrategy'](natInfo);
    console.log(`   Recommended Strategy: ${strategy}`);
    
    // Test 4: TURN requirement check
    console.log('\n4. TURN relay requirement...');
    const needsTurn = natManager.shouldUseTURN();
    console.log(`   TURN Needed: ${needsTurn ? 'Yes' : 'No'}`);
    
    // Test 5: NAT behavior information
    console.log('\n5. Detailed NAT behavior...');
    const natBehavior = natManager.getNATBehavior();
    console.log(`   Type: ${natBehavior.type}`);
    console.log(`   Mapping: ${natBehavior.mappingBehavior}`);
    console.log(`   Filtering: ${natBehavior.filteringBehavior}`);
    
    // Test 6: Compatibility reporting (simulated peer)
    console.log('\n6. NAT compatibility with peer (simulated)...');
    const peerNATInfo = {
      type: 'fullCone',
      mappingBehavior: 'endpointIndependent',
      filteringBehavior: 'endpointIndependent'
    };
    
    const compatibilityReport = natManager.generateCompatibilityReport(peerNATInfo);
    console.log('   Compatibility Report:');
    console.log(`     Compatible: ${compatibilityReport.compatible}`);
    console.log(`     Recommended Method: ${compatibilityReport.recommendedMethod}`);
    console.log(`     Success Probability: ${compatibilityReport.successProbability}`);
    console.log(`     Notes: ${compatibilityReport.notes}`);
    
    // Test 7: Symmetric NAT detection
    console.log('\n7. Symmetric NAT detection...');
    const isSymmetric = await natManager.detectSymmetricNAT();
    console.log(`   Symmetric NAT Detected: ${isSymmetric ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
if (require.main === module) {
  testNATDetection().catch(console.error);
}

module.exports = testNATDetection;