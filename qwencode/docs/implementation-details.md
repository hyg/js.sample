# P2P DHT Node - Implementation Details

## Overview

This document details the implementation of the P2P DHT Node system with focus on the requirements for automatic node discovery using DHT and STUN for address resolution.

## Core Modules

### 1. Node Initialization (`src/lib/node.js`)

Handles the initialization process of a node, including:
- Generating unique node IDs
- Loading configuration parameters
- Setting up core components (STUN, DHT, WebRTC)
- Meeting code validation and setup

### 2. STUN Client (`src/lib/stun-client.js`)

Responsible for:
- Communicating with STUN servers to discover public IP addresses
- Parsing STUN responses to extract public address information
- Implementing timeout and retry mechanisms
- Supporting multiple STUN servers for redundancy

### 3. DHT Peer Discovery (`src/lib/dht-discovery.js`)

Newly implemented module for:
- Connecting to DHT networks
- Announcing nodes in meeting-specific topics
- Looking up other nodes in the same meeting
- Managing DHT connection state and reconnection

### 4. WebRTC Manager (`src/lib/webrtc-manager.js`)

Manages:
- WebRTC connection establishment with discovered peers
- ICE candidate gathering and processing
- Data channel communication
- Connection lifecycle management

### 5. Peer Discovery Manager (`src/lib/peer-discovery.js`)

Extends functionality to:
- Store discovered peers with their public addresses
- Track connection status and activity
- Provide APIs for peer retrieval and management

## Implementation Flow

### Phase 1: Node Initialization
1. Load configuration (including meeting code)
2. Generate or retrieve node ID
3. Setup STUN client for address discovery
4. Setup DHT client for peer discovery
5. Setup WebRTC manager

### Phase 2: Address Discovery
1. Query STUN servers to discover public IP address
2. Store public address in node configuration
3. Announce node in DHT with meeting topic

### Phase 3: Peer Discovery
1. Lookup other nodes in same meeting topic
2. Receive public addresses of discovered peers
3. Store peers in peer discovery manager

### Phase 4: Connection Establishment
1. Initiate WebRTC connections to discovered peers
2. Exchange signaling information via DHT
3. Establish direct peer-to-peer connections

## Key Implementation Details

### DHT Integration
The DHT implementation follows these principles:
- Uses meeting code as topic identifier
- Nodes announce themselves with public addresses
- Nodes search for others in the same topic
- Handles DHT node failures gracefully

### Meeting Isolation
- All nodes must share the same `MEETING_CODE` to discover each other
- DHT topics are created using the meeting code hash
- This ensures complete isolation between different meetings

### NAT Traversal
- STUN is used for public address discovery
- ICE candidates are gathered for connection establishment
- WebRTC handles the actual NAT traversal

## Usage Examples

### Starting a Node in a Meeting
```javascript
// Set environment variables
process.env.MEETING_CODE = "ABC123XYZ";
process.env.DEBUG = "true";

// Initialize node
const node = initializeNode();
```

### Manual Peer Discovery
```javascript
// Discover other peers in the meeting
const peers = peerDiscovery.getKnownPeers();
console.log('Discovered peers:', peers);
```

### Connection Management
```javascript
// Connect to discovered peer
await webrtcManager.createConnection(targetPeerId, peerInfo, true);
```

## Error Handling

### Common Error Conditions
1. **STUN Server Unreachable**: Try alternative servers
2. **DHT Connection Failure**: Attempt reconnection
3. **Peer Discovery Timeout**: Retry with different approach
4. **WebRTC Connection Failure**: Re-attempt with updated ICE candidates

### Logging Strategy
Detailed logging is enabled when `DEBUG=true`:
- STUN query success/failure
- DHT announcement success/failure
- Peer discovery results
- Connection establishment status