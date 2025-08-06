// 测试入口文件
const { expect } = require('chai');
const { initializeNode } = require('../src/lib/node.js');
const PeerDiscovery = require('../src/lib/peer-discovery.js');
const StunClient = require('../src/lib/stun-client.js');
const WebRtcManager = require('../src/lib/webrtc-manager.js');
const DHTDiscovery = require('../src/lib/dht-discovery.js');

describe('P2P DHT Node System', function() {
  this.timeout(10000);
  
  it('should initialize node correctly', function() {
    const node = initializeNode();
    expect(node).to.be.an('object');
    expect(node.id).to.be.a('string');
    expect(node.initialized).to.be.true;
  });
  
  it('should create peer discovery instance', function() {
    const peerDiscovery = new PeerDiscovery();
    expect(peerDiscovery).to.be.an.instanceOf(PeerDiscovery);
  });
  
  it('should create STUN client instance', function() {
    const stunClient = new StunClient();
    expect(stunClient).to.be.an.instanceOf(StunClient);
  });
  
  it('should create WebRTC manager instance', function() {
    const webrtcManager = new WebRtcManager();
    expect(webrtcManager).to.be.an.instanceOf(WebRtcManager);
  });
  
  it('should create DHT discovery instance', function() {
    const dhtDiscovery = new DHTDiscovery();
    expect(dhtDiscovery).to.be.an.instanceOf(DHTDiscovery);
  });
  
  it('should handle meeting code configuration', function() {
    // 测试会议代码配置加载
    process.env.MEETING_CODE = 'TEST_MEETING_123';
    const node = initializeNode();
    expect(node.config.meetingCode).to.equal('TEST_MEETING_123');
    delete process.env.MEETING_CODE;
  });
});