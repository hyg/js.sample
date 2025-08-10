const { spawn } = require('child_process');
const path = require('path');

// Number of nodes to spawn
const NUM_NODES = 3;

console.log(`Spawning ${NUM_NODES} P2P nodes...`);

// Spawn multiple nodes
const nodes = [];
for (let i = 0; i < NUM_NODES; i++) {
  console.log(`Spawning node ${i + 1}...`);
  
  const node = spawn('node', [path.join(__dirname, 'index.js')], {
    stdio: 'inherit'
  });
  
  node.on('close', (code) => {
    console.log(`Node ${i + 1} exited with code ${code}`);
  });
  
  nodes.push(node);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down all nodes...');
  nodes.forEach((node, index) => {
    console.log(`Killing node ${index + 1}...`);
    node.kill('SIGINT');
  });
});