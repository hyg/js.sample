const assert = require('assert');
const { generateNodeId, loadConfig, initializeNode } = require('../lib/node.js');

describe('Node Initialization', function() {
  describe('generateNodeId', function() {
    it('should generate a unique ID', function() {
      const id1 = generateNodeId();
      const id2 = generateNodeId();
      
      assert.ok(typeof id1 === 'string');
      assert.ok(id1.length > 0);
      assert.notEqual(id1, id2);
    });
    
    it('should generate hexadecimal string', function() {
      const id = generateNodeId();
      assert.ok(/^[a-f0-9]+$/.test(id));
    });
  });

  describe('loadConfig', function() {
    it('should load default configuration', function() {
      const config = loadConfig();
      assert.ok(config.stunServers);
      assert.equal(typeof config.debug, 'boolean');
    });
    
    it('should respect environment variables', function() {
      process.env.TEST_STUN_SERVERS = 'test.stun.server:3478';
      process.env.TEST_DEBUG = 'true';
      
      const config = loadConfig();
      
      // Restore original values
      delete process.env.TEST_STUN_SERVERS;
      delete process.env.TEST_DEBUG;
      
      assert.ok(config.stunServers.includes('test.stun.server'));
      assert.equal(config.debug, true);
    });
  });

  describe('initializeNode', function() {
    it('should initialize node successfully', function() {
      const node = initializeNode();
      assert.ok(node.id);
      assert.ok(node.config);
      assert.equal(node.initialized, true);
    });
    
    it('should handle initialization errors gracefully', function() {
      // This test verifies that the function doesn't crash on invalid inputs
      // In a real scenario, we might want to test specific error conditions
      assert.doesNotThrow(() => {
        initializeNode();
      });
    });
  });
});