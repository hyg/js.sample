# P2P DHT Node - User Guide

## Getting Started

This guide explains how to use the P2P DHT Node system for creating and joining meetings with automatic peer discovery.

## Prerequisites

- Node.js 14 or higher installed
- Internet connection for STUN server access
- Basic understanding of P2P networking concepts

## Installation

1. Clone or download the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Before running the node, configure the following environment variables:

### Required Configuration

```bash
# Meeting code that identifies your meeting group
export MEETING_CODE="YOUR_MEETING_CODE_HERE"

# Enable debugging (optional)
export DEBUG="true"
```

### Optional Configuration

```bash
# Custom STUN servers (default are Google's public servers)
export STUN_SERVERS="stun:stun.example.com:3478,stun:stun2.example.com:3478"

# Custom node ID (auto-generated if not specified)
export NODE_ID="custom_node_id"
```

## Running the Node

Start a node in a meeting:

```bash
# Set environment variables
export MEETING_CODE="ABC123XYZ"
export DEBUG="true"

# Start the node
npm start
```

## How It Works

### Step-by-Step Process

1. **Initialization**
   - Node generates a unique ID
   - Loads configuration from environment variables
   - Sets up STUN client for address discovery

2. **Address Discovery**
   - Node queries STUN servers to discover its public IP address
   - Stores this address for later use

3. **Meeting Participation**
   - Node joins the meeting using the provided meeting code
   - Announces itself in the DHT network with the meeting topic

4. **Peer Discovery**
   - Node looks up other nodes in the same meeting topic
   - Receives public addresses of other participants

5. **Connection Establishment**
   - Node attempts to establish WebRTC connections with discovered peers
   - Uses STUN/ICE for NAT traversal

### Meeting Isolation

All nodes that share the same `MEETING_CODE` will be able to discover each other. Nodes with different meeting codes will be completely isolated and cannot see each other, ensuring privacy between different meetings.

## API Reference

### Core Functions

#### `initializeNode()`
Initializes the node with configuration and sets up core components.

#### `discoverPeers()`
Initiates peer discovery process in the current meeting.

#### `connectToPeer(peerId, peerInfo)`
Establishes a WebRTC connection to a discovered peer.

### Events

#### `peerDiscovered`
Emitted when a new peer is discovered in the meeting.

#### `connectionEstablished`
Emitted when a successful WebRTC connection is established.

#### `connectionClosed`
Emitted when a connection is closed.

## Troubleshooting

### Common Issues

1. **Nodes not discovering each other**
   - Verify that all nodes use the same meeting code
   - Check internet connectivity to STUN servers
   - Ensure debugging logs show DHT activity

2. **STUN server timeouts**
   - Try different STUN servers
   - Check firewall settings
   - Ensure outbound UDP connections are allowed

3. **Connection failures**
   - Verify NAT traversal settings
   - Check ICE candidate gathering
   - Ensure STUN servers are reachable

### Debugging

Enable debug mode for detailed logging:
```bash
export DEBUG="true"
npm start
```

## Security Considerations

### Meeting Isolation
The system ensures that participants in different meetings cannot discover each other by using the meeting code as a DHT topic identifier.

### Data Encryption
All communication between peers uses WebRTC's built-in encryption (DTLS/SRTP).

### Identity Protection
Node IDs are randomly generated cryptographic identifiers that do not reveal personal information.

## Performance Tips

1. **Optimize STUN Servers**
   Use STUN servers geographically closer to your users for better performance

2. **Manage Meetings**
   Keep meetings small (under 100 participants) for optimal performance

3. **Network Conditions**
   Ensure stable network connections for reliable peer discovery

## Limitations

1. **Browser Support**
   Some older browsers may not support WebRTC

2. **Network Restrictions**
   Very restrictive firewalls may prevent NAT traversal

3. **Scalability**
   Performance may degrade with very large numbers of participants in a single meeting

## Contributing

Feel free to submit issues and pull requests to improve this system. Contributions are welcome!