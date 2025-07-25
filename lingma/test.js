const P2PNode = require('./main');

// Simple test to verify the node class can be instantiated
console.log('Testing P2PNode creation...');

const node = new P2PNode({
  roomId: 'test-room'
});

console.log('Node created with ID:', node.nodeId);
console.log('Room ID:', node.roomId);
console.log('P2PNode class working correctly!');