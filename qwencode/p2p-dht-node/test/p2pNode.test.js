// test/p2pNode.test.js

const P2PNode = require('../lib/p2pNode');

// Mocking network interactions for unit tests is complex.
// This is a very basic example to check if the class instantiates correctly.
// Integration tests would be more suitable for network-dependent features.

describe('P2PNode', () => {
  let node;
  const defaultConfig = {
    port: 6880, // Use a different port for testing
    bootstrapNodes: [], // No bootstrap for isolated test
    stunServers: [] // No STUN for isolated test
  };

  beforeEach(() => {
    node = new P2PNode(defaultConfig);
  });

  afterEach(() => {
    // Ensure node is stopped if it was started
    if (node.isRunning) {
      return node.stop();
    }
  });

  test('should create a new instance with default config', () => {
    expect(node).toBeInstanceOf(P2PNode);
    expect(node.port).toBe(defaultConfig.port);
    expect(node.isRunning).toBe(false);
    expect(node.nodeId).toBeDefined();
    expect(node.nodeId.length).toBe(20); // Standard DHT node ID length
  });

  test('should start and stop the node', async () => {
    await expect(node.start()).resolves.not.toThrow();
    expect(node.isRunning).toBe(true);

    await expect(node.stop()).resolves.not.toThrow();
    expect(node.isRunning).toBe(false);
  });

  // Add more tests for announce, lookup, connectToPeer, sendMessage
  // These will require more sophisticated mocking or integration testing setup.
});