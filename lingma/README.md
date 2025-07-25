# P2P Node Application

This is a peer-to-peer node application that allows nodes behind NAT to discover and communicate with each other.

## Features

1. NAT traversal using STUN servers
2. Automatic peer discovery within the same room
3. Direct peer-to-peer communication using WebRTC
4. Minimal reliance on third-party servers (only for initial signaling)

## Installation

1. Install Node.js (if not already installed)
2. Run `npm install` to install dependencies

## Running the Application

1. Run `npm start` to start a node
2. To specify a custom signaling server, run `node index.js [signaling-server-url]`

## Testing

Run `npm test` to run basic tests

## How It Works

1. Nodes connect to a common signaling server
2. Nodes in the same room automatically discover each other
3. Nodes establish direct WebRTC connections
4. Messages are exchanged directly between nodes (not through the signaling server)

## Privacy

- Only connection metadata goes through the signaling server
- Actual data transfer happens directly between peers
- All communication is encrypted by WebRTC