// Integration test for complete node flow
const { expect } = require('chai');
const { initializeNode } = require('../src/lib/node.js');
const PeerDiscovery = require('../src/lib/peer-discovery.js');
const StunClient = require('../src/lib/stun-client.js');
const WebRtcManager = require('../src/lib/webrtc-manager.js');
const DHTDiscovery = require('../src/lib/dht-discovery.js');

describe('P2P DHT Node - Integration', function() {
  this.timeout(10000);
  
  it('should initialize all components correctly', function() {
    const node = initializeNode();
    const peerDiscovery = new PeerDiscovery();
    const stunClient = new StunClient();
    const webrtcManager = new WebRtcManager();
    const dhtDiscovery = new DHTDiscovery();
    
    expect(node).to.be.an('object');
    expect(peerDiscovery).to.be.an.instanceOf(PeerDiscovery);
    expect(stunClient).to.be.an.instanceOf(StunClient);
    expect(webrtcManager).to.be.an.instanceOf(WebRtcManager);
    expect(dhtDiscovery).to.be.an.instanceOf(DHTDiscovery);
  });
  
  it('should handle configuration properly', function() {
    // Test with environment variable
    process.env.MEETING_CODE = 'INTEGRATION_TEST';
    const node = initializeNode();
    
    expect(node.config.meetingCode).to.equal('INTEGRATION_TEST');
    
    // Clean up
    delete process.env.MEETING_CODE;
  });
});