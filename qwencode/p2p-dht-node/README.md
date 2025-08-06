# P2P DHT Node

This is a Node.js application that allows users behind NATs in different LANs to discover and communicate with each other directly, without relying on a central server for the actual data transfer. The connection establishment phase can utilize existing servers within China for signaling.

## Features

*   **NAT Traversal:** Enables direct communication between nodes behind different NATs.
*   **Serverless Communication:** Once a connection is established, communication is direct and encrypted, without any server dependency.
*   **Signaling Support:** Can use existing servers for the initial connection setup (signaling).

## Getting Started

### Prerequisites

*   Node.js installed on your system.

### Installation

1. Clone or download this repository.
2. Navigate to the project directory in your terminal.
3. Run `npm install` to install the required dependencies.

### Usage

1. Modify the `SIGNALING_SERVER_URL` in `index.js` to point to your actual signaling server.
2. Run `npm start` to start the node.

## Implementation Details

This project uses Socket.IO for signaling and `simple-peer` for WebRTC data channel communication.

### Key Components

1.  **Signaling Client (`socket.io-client`)**: Connects to the signaling server to exchange connection information (offers, answers, ICE candidates) with other nodes.
2.  **WebRTC Peer (`simple-peer`)**: Handles the creation and management of the RTCPeerConnection, enabling direct data transfer between nodes once a connection is established via the signaling server.

### How it Works

1.  **Registration**: When a node starts, it connects to the signaling server and registers its unique `nodeId`.
2.  **Connection Initiation**: To connect to another node, a node sends an "offer" message to the target `nodeId` via the signaling server.
3.  **Offer Handling**: The target node receives the offer, creates an "answer", and sends it back to the initiating node via the signaling server.
4.  **Connection Establishment**: Both nodes use the exchanged offer and answer to establish a direct WebRTC data channel.
5.  **Data Transfer**: Once the data channel is open, nodes can send and receive data directly without any server involvement.

### API

*   `connectToNode(targetNodeId)`: Initiates a connection to another node identified by `targetNodeId`.
*   `sendData(data)`: Sends data to the currently connected peer.

### Example

The `index.js` file includes commented-out example code that demonstrates how to initiate a connection and send data after a delay. You can uncomment and modify this code for testing.