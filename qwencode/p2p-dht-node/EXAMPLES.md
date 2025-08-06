# P2P DHT Node Examples

This document provides examples of how to use the `p2p-dht-node` library.

## Basic Node Startup

To start a basic node that joins the DHT network:

```javascript
// example1_basic_node.js
const P2PNode = require('./lib/p2pNode'); // Adjust path as necessary

const node = new P2PNode({
  // Configuration options
  port: 6881, // Port to listen on
  bootstrapNodes: [
    // List of known DHT bootstrap nodes
    { host: 'router.bittorrent.com', port: 6881 },
    { host: 'router.utorrent.com', port: 6881 }
    // Add more if needed
  ]
});

node.start()
  .then(() => {
    console.log(`Node started and listening on port ${node.port}`);
    console.log(`Node ID: ${node.nodeId.toString('hex')}`);
  })
  .catch(err => {
    console.error('Failed to start node:', err);
  });

// Gracefully shut down on Ctrl+C
process.on('SIGINT', async () => {
  console.log('Shutting down node...');
  await node.stop();
  console.log('Node stopped.');
  process.exit(0);
});
```

Run this example with:
```bash
node example1_basic_node.js
```

## Discovering and Connecting to Peers

This example demonstrates how to discover peers for a specific topic and initiate a connection.

```javascript
// example2_discover_and_connect.js
const P2PNode = require('./lib/p2pNode');

const TOPIC = 'my_shared_topic'; // Shared identifier for discovery

const node = new P2PNode({
  port: 6882,
  bootstrapNodes: [
    { host: 'router.bittorrent.com', port: 6881 },
    { host: 'router.utorrent.com', port: 6881 }
  ]
});

async function run() {
  try {
    await node.start();
    console.log(`Node started on port ${node.port}`);

    // Announce this node for the topic
    node.announce(TOPIC);
    console.log(`Announced presence for topic: ${TOPIC}`);

    // Listen for new peers discovered for the topic
    node.on('peer', (peerInfo, discoveredTopic) => {
        if (discoveredTopic === TOPIC) {
            console.log(`Discovered peer for topic '${TOPIC}': ${peerInfo.host}:${peerInfo.port}`);
            // Attempt to connect to the discovered peer
            node.connectToPeer(peerInfo)
                .then(() => {
                    console.log(`Connected to peer ${peerInfo.host}:${peerInfo.port}`);
                    // You can now send messages using node.sendMessage
                })
                .catch(err => {
                    console.error(`Failed to connect to peer ${peerInfo.host}:${peerInfo.port}:`, err.message);
                });
        }
    });

    // Listen for incoming connections
    node.on('connection', (connection) => {
        console.log(`New connection established from ${connection.remoteAddress}:${connection.remotePort}`);
        // Handle incoming data
        connection.on('data', (data) => {
            console.log(`Received message: ${data.toString()}`);
            // Echo the message back
            connection.write(`Echo: ${data}`);
        });

        connection.on('close', () => {
            console.log('Connection closed');
        });
    });

    console.log(`Searching for peers for topic: ${TOPIC}...`);
    // The 'peer' event listener above will handle discoveries

  } catch (err) {
    console.error('Error running node:', err);
  }
}

run();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down node...');
  await node.stop();
  console.log('Node stopped.');
  process.exit(0);
});
```

Run this example with:
```bash
node example2_discover_and_connect.js
```

## Sending Encrypted Messages

Once a connection is established, you can send encrypted messages.

```javascript
// example3_send_message.js
const P2PNode = require('./lib/p2pNode');

const TOPIC = 'my_secure_topic';
const MESSAGE_TO_SEND = 'Hello, secure P2P world!';

const node = new P2PNode({
  port: 6883,
  bootstrapNodes: [
    { host: 'router.bittorrent.com', port: 6881 }
  ]
});

let connectedPeerConnection = null;

async function run() {
  try {
    await node.start();
    console.log(`Node started on port ${node.port}`);
    node.announce(TOPIC);

    node.on('peer', async (peerInfo, topic) => {
      if (topic === TOPIC && !connectedPeerConnection) {
        console.log(`Discovered peer for topic '${TOPIC}': ${peerInfo.host}:${peerInfo.port}`);
        try {
          connectedPeerConnection = await node.connectToPeer(peerInfo);
          console.log(`Connected to peer ${peerInfo.host}:${peerInfo.port}`);

          // Send a message after a short delay to ensure handshake is complete
          setTimeout(() => {
            node.sendMessage(connectedPeerConnection, MESSAGE_TO_SEND)
              .then(() => console.log(`Sent message: ${MESSAGE_TO_SEND}`))
              .catch(err => console.error('Failed to send message:', err));
          }, 1000); // 1 second delay

        } catch (err) {
          console.error(`Failed to connect to peer ${peerInfo.host}:${peerInfo.port}:`, err.message);
        }
      }
    });

    node.on('connection', (connection) => {
      console.log(`New connection from ${connection.remoteAddress}:${connection.remotePort}`);
      connection.on('data', (data) => {
        console.log(`Received (decrypted) message: ${data.toString()}`);
      });
    });

    console.log(`Searching for peers for topic: ${TOPIC}...`);

  } catch (err) {
    console.error('Error running node:', err);
  }
}

run();

process.on('SIGINT', async () => {
  console.log('Shutting down node...');
  await node.stop();
  console.log('Node stopped.');
  process.exit(0);
});
```

Run this example with:
```bash
node example3_send_message.js
```

## Putting It All Together

These examples provide a foundation. A complete application would involve:

1.  Defining a clear message protocol (e.g., JSON-RPC over the encrypted channel).
2.  Implementing robust error handling and reconnection logic.
3.  Managing peer lists and connection states.
4.  Potentially integrating with a more sophisticated DHT or using additional discovery mechanisms.