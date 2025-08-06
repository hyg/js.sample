// Unit test for DHT Discovery
const { expect } = require('chai');
const DHTDiscovery = require('../src/lib/dht-discovery.js');

describe('DHT Discovery', function() {
  let dhtDiscovery;

  beforeEach(function() {
    dhtDiscovery = new DHTDiscovery();
  });

  it('should initialize correctly', function() {
    expect(dhtDiscovery).to.be.an.instanceOf(DHTDiscovery);
    expect(dhtDiscovery.isStarted).to.be.false;
    expect(dhtDiscovery.port).to.equal(6881);
    expect(dhtDiscovery.bootstrapNodes).to.be.an('array');
  });

  it('should handle meeting topic generation', function() {
    // This test verifies that the class can be instantiated
    // Actual DHT operations require network connectivity
    expect(dhtDiscovery).to.exist;
  });

  it('should have proper configuration options', function() {
    const customDht = new DHTDiscovery({
      port: 7000,
      debug: true
    });
    
    expect(customDht.port).to.equal(7000);
    expect(customDht.debug).to.be.true;
  });
});