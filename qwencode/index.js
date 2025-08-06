const io = require('socket.io-client');
const SimplePeer = require('simple-peer');

// Replace with the actual signaling server URL
const SIGNALING_SERVER_URL = 'http://localhost:3000'; 

let peer; // Global peer instance
const nodeId = generateNodeId();
const socket = io(SIGNALING_SERVER_URL);

socket.on('connect', () => {
  console.log('Connected to signaling server with nodeId:', nodeId);
  // Register with the signaling server
  socket.emit('register', { nodeId: nodeId });
});

socket.on('disconnect', () => {
  console.log('Disconnected from signaling server');
});

// Handle offers from other nodes
socket.on('offer', async (data) => {
  console.log('Received offer from:', data.from);
  // Create a new SimplePeer instance for the answerer
  peer = new SimplePeer({ initiator: false, trickle: false });

  // Handle the signal event for sending answers and ICE candidates
  peer.on('signal', (signalData) => {
    socket.emit('answer', { to: data.from, nodeId: nodeId, signal: signalData });
  });

  // Handle incoming data
  peer.on('data', (receivedData) => {
    console.log('Received data from peer:', receivedData.toString());
    // Echo the data back for testing
    peer.send(`Echo: ${receivedData.toString()}`);
  });

  // Handle connection establishment
  peer.on('connect', () => {
    console.log('WebRTC connection established with', data.from);
    // Send a welcome message
    peer.send(`Hello from ${nodeId}`);
  });

  // Handle connection closure
  peer.on('close', () => {
    console.log('WebRTC connection closed');
  });

  // Handle errors
  peer.on('error', (err) => {
    console.error('WebRTC error:', err);
  });

  // Signal the peer with the received offer
  peer.signal(data.offer);
});

// Handle answers from other nodes
socket.on('answer', (data) => {
  console.log('Received answer from:', data.nodeId);
  if (peer) {
    // Signal the existing peer with the received answer
    peer.signal(data.signal);
  } else {
    console.error('No peer instance found to handle the answer');
  }
});

// Handle ICE candidates (if trickle ICE is used in the future)
socket.on('candidate', (data) => {
  console.log('Received ICE candidate from:', data.from);
  if (peer) {
    peer.signal(data.candidate);
  }
});

// Function to initiate a connection to another node
function connectToNode(targetNodeId) {
  console.log('Initiating connection to:', targetNodeId);
  // Create a new SimplePeer instance for the initiator
  peer = new SimplePeer({ initiator: true, trickle: false });

  // Handle the signal event for sending offers and ICE candidates
  peer.on('signal', (signalData) => {
    socket.emit('offer', { to: targetNodeId, nodeId: nodeId, signal: signalData });
  });

  // Handle incoming data
  peer.on('data', (receivedData) => {
    console.log('Received data from peer:', receivedData.toString());
  });

  // Handle connection establishment
  peer.on('connect', () => {
    console.log('WebRTC connection established with', targetNodeId);
    // Send a welcome message
    peer.send(`Hello from ${nodeId}`);
  });

  // Handle connection closure
  peer.on('close', () => {
    console.log('WebRTC connection closed');
  });

  // Handle errors
  peer.on('error', (err) => {
    console.error('WebRTC error:', err);
  });
}

// Function to send data to the connected peer
function sendData(data) {
  if (peer && peer.connected) {
    peer.send(data);
  } else {
    console.error('Not connected to any peer or connection is not ready');
  }
}

// Function to generate a unique node ID (simplified)
function generateNodeId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Example usage (uncomment to test):
// setTimeout(() => {
//   connectToNode('target-node-id-here'); // Replace with actual target node ID
// }, 5000);

// setTimeout(() => {
//   sendData('Hello Peer!');
// }, 10000);