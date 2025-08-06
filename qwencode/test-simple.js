#!/usr/bin/env node

/**
 * Simple test script for node initialization
 */

const { generateNodeId, loadConfig, initializeNode } = require('./src/lib/node.js');

console.log('Testing Node Initialization...\n');

// Test 1: Node ID Generation
console.log('1. Testing Node ID Generation:');
try {
  const id1 = generateNodeId();
  const id2 = generateNodeId();
  console.log(`   Generated ID 1: ${id1}`);
  console.log(`   Generated ID 2: ${id2}`);
  console.log(`   IDs are different: ${id1 !== id2}`);
  console.log(`   ID length: ${id1.length}`);
  console.log('   ✓ Node ID generation works\n');
} catch (error) {
  console.error('   ✗ Node ID generation failed:', error.message);
}

// Test 2: Configuration Loading
console.log('2. Testing Configuration Loading:');
try {
  const config = loadConfig();
  console.log(`   STUN Servers: ${config.stunServers}`);
  console.log(`   Debug mode: ${config.debug}`);
  console.log('   ✓ Configuration loading works\n');
} catch (error) {
  console.error('   ✗ Configuration loading failed:', error.message);
}

// Test 3: Node Initialization
console.log('3. Testing Node Initialization:');
try {
  const node = initializeNode();
  console.log(`   Node ID: ${node.id}`);
  console.log(`   Initialized: ${node.initialized}`);
  console.log(`   Timestamp: ${node.timestamp}`);
  console.log('   ✓ Node initialization works\n');
} catch (error) {
  console.error('   ✗ Node initialization failed:', error.message);
}

console.log('All tests completed.');