// Unit test for STUN client
const { expect } = require('chai');
const StunClient = require('../src/lib/stun-client.js');

describe('STUN Client', function() {
  it('should initialize with default servers', function() {
    const stunClient = new StunClient();
    expect(stunClient).to.be.an.instanceOf(StunClient);
    expect(stunClient.stunServers).to.be.an('array');
    expect(stunClient.stunServers.length).to.be.greaterThan(0);
  });

  it('should accept custom STUN servers', function() {
    const customServers = ['stun:test.com:3478'];
    const stunClient = new StunClient({ stunServers: customServers });
    expect(stunClient.stunServers).to.deep.equal(customServers);
  });

  it('should have proper timeout configuration', function() {
    const stunClient = new StunClient({ timeout: 10000 });
    expect(stunClient.timeout).to.equal(10000);
  });
});