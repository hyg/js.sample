// Unit test for Peer Discovery
const { expect } = require('chai');
const PeerDiscovery = require('../src/lib/peer-discovery.js');

describe('Peer Discovery', function() {
  let peerDiscovery;

  beforeEach(function() {
    peerDiscovery = new PeerDiscovery();
  });

  it('should initialize correctly', function() {
    expect(peerDiscovery).to.be.an.instanceOf(PeerDiscovery);
    expect(peerDiscovery.knownPeers).to.be.a('map');
    expect(peerDiscovery.peerStatus).to.be.a('map');
  });

  it('should add peer correctly', function() {
    const result = peerDiscovery.addPeer('peer1', {
      publicAddress: '192.168.1.1',
      port: 8080
    });
    
    expect(result).to.be.true;
    expect(peerDiscovery.knownPeers.size).to.equal(1);
  });

  it('should handle invalid peer data gracefully', function() {
    const result = peerDiscovery.addPeer('', {});
    expect(result).to.be.false;
    
    const result2 = peerDiscovery.addPeer('peer1', null);
    expect(result2).to.be.false;
  });

  it('should get known peers', function() {
    peerDiscovery.addPeer('peer1', {
      publicAddress: '192.168.1.1',
      port: 8080
    });
    
    const peers = peerDiscovery.getKnownPeers();
    expect(peers).to.be.an('array');
    expect(peers.length).to.equal(1);
  });

  it('should get peer by ID', function() {
    peerDiscovery.addPeer('peer1', {
      publicAddress: '192.168.1.1',
      port: 8080
    });
    
    const peer = peerDiscovery.getPeer('peer1');
    expect(peer).to.be.an('object');
    expect(peer.id).to.equal('peer1');
    
    const nonExistent = peerDiscovery.getPeer('nonexistent');
    expect(nonExistent).to.be.null;
  });

  it('should update peer last seen', function() {
    peerDiscovery.addPeer('peer1', {
      publicAddress: '192.168.1.1',
      port: 8080
    });
    
    const result = peerDiscovery.updatePeerLastSeen('peer1');
    expect(result).to.be.true;
    
    const peer = peerDiscovery.getPeer('peer1');
    expect(peer.lastSeen).to.be.a('number');
  });

  it('should remove peer correctly', function() {
    peerDiscovery.addPeer('peer1', {
      publicAddress: '192.168.1.1',
      port: 8080
    });
    
    const result = peerDiscovery.removePeer('peer1');
    expect(result).to.be.true;
    expect(peerDiscovery.knownPeers.size).to.equal(0);
  });
});