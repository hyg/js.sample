# P2P DHT Node Architecture

## Overview

This document describes the architecture of the P2P DHT node system, which enables NAT traversal and direct peer-to-peer communication using WebRTC technology. The system operates entirely in client-side mode with no server dependencies beyond STUN servers for initial address discovery.

## System Components

### 1. Core Node Components

#### Node Registration Service
- Handles node initialization with unique identifiers
- Manages node state information
- Performs STUN-based public address discovery
- Joins nodes to meetings based on invitation codes

#### STUN Address Discovery
- Communicates with STUN servers for temporary IP address resolution
- Obtains public IP addresses for NAT traversal
- Limits STUN usage to discovery phase only

#### DHT Peer Discovery
- Implements distributed hash table for peer discovery
- Uses invitation codes as topics for meeting isolation
- Announces nodes in DHT with public addresses
- Finds other nodes in the same meeting

#### WebRTC Connection Manager
- Manages SimplePeer instances for WebRTC connections
- Handles connection establishment and teardown
- Processes ICE candidates and connection events

#### Data Transfer Module
- Handles data transmission between connected peers
- Provides abstraction layer for sending/receiving data
- Implements reliability mechanisms for data delivery

### 2. Architecture Layers

#### Presentation Layer
- Public API for node interaction
- Event emitters for connection status changes

#### Business Logic Layer
- P2P network protocols and rules
- Connection management logic
- Peer discovery algorithms using DHT

#### Data Access Layer
- STUN server communication for discovery only
- DHT network for peer information storage and retrieval
- Local storage of node information and peer contacts
- Connection state management

#### Infrastructure Layer
- WebRTC library integration (SimplePeer)
- Network communication protocols
- Error handling and logging

### 3. Data Flow

1. **Node Initialization**
   - Generate unique node ID
   - Initialize STUN client for address discovery
   - Join meeting using invitation code
   - Initialize DHT for peer discovery

2. **Peer Discovery**
   - Query STUN servers for public address
   - Announce node in DHT with meeting topic
   - Lookup other nodes in same meeting topic
   - Collect peer public addresses from DHT

3. **Connection Establishment**
   - Initiate connection with target peer using STUN-mediated signaling
   - Exchange signaling messages (offer/answer/candidates)
   - Establish WebRTC connection directly between peers

4. **Data Transfer**
   - Send data directly through WebRTC connection
   - Handle incoming data from peers

5. **Connection Management**
   - Monitor connection status
   - Handle disconnections gracefully
   - Clean up resources

## Technology Stack

### Backend Technologies
- Node.js (runtime environment)
- STUN client for address resolution
- DHT library for peer discovery
- SimplePeer (WebRTC implementation)
- EventEmitter (event handling)

### Frontend Technologies (if applicable)
- Modern JavaScript (ES6+)
- WebRTC API (browser-based connections)

## Security Considerations

### Data Encryption
- All data transmitted via WebRTC is encrypted by default
- Secure connection establishment using WebRTC DTLS/SRTP

### Authentication
- Node IDs should be cryptographically generated
- STUN server authentication is not required (public servers)
- Meeting isolation through invitation code topic separation

### Privacy
- Minimal information stored locally
- No personal data collection
- Network traffic anonymization where possible

## Scalability Considerations

### Horizontal Scaling
- Independent node instances
- No shared state between nodes (stateless design)
- Load distribution through STUN servers for discovery

### Performance Optimization
- Efficient ICE candidate gathering
- Minimal overhead for STUN queries
- Optimized WebRTC connection establishment

## Deployment Architecture

### Single Node Deployment
- Standalone node implementation
- Local development/testing environment

### Multi-Node Network
- Multiple nodes connecting to same STUN servers
- Distributed peer discovery through DHT
- Direct communication between nodes

## Error Handling and Resilience

### Connection Errors
- Automatic reconnection attempts
- Graceful degradation when connections fail
- Detailed error logging for troubleshooting

### Network Issues
- Retry mechanisms for STUN queries
- Connection timeout handling
- Health checks for STUN server availability

## Configuration

### Environment Variables
- `STUN_SERVERS` - List of STUN servers for address discovery (comma-separated)
- `NODE_ID` - Override for node identifier (optional)
- `MEETING_CODE` - Invitation code for meeting participation (required)
- `DEBUG` - Enable detailed logging (boolean)

### Default Settings
- Connection timeout: 30 seconds
- Reconnection attempts: 3 times with 5 second intervals
- STUN query timeout: 10 seconds
- ICE candidate gathering timeout: 10 seconds
- DHT refresh interval: 30 seconds

## Future Enhancements

### Planned Features
1. Enhanced DHT-based peer discovery implementation
2. Encryption key exchange protocols
3. Traffic shaping and bandwidth management
4. Advanced connection quality monitoring
5. Integration with decentralized storage systems

## Dependencies

### Core Dependencies (as specified in package.json)
- socket.io-client: ^4.0.0 (used for STUN client, not signaling server)
- simple-peer: ^9.11.0
- bittorrent-dht: ^0.11.0 (for DHT implementation)

### Development Dependencies
- mocha: Test framework
- chai: Assertion library
- nyc: Code coverage tool

## Development Guidelines

### Coding Standards
- Use ES6+ JavaScript syntax
- Follow consistent naming conventions
- Implement proper error handling
- Write modular, reusable code components

### Testing Strategy
- Unit tests for core modules
- Integration tests for STUN-based discovery
- Integration tests for DHT-based peer discovery
- End-to-end tests for connection establishment
- Performance benchmarks for data transfer

## Maintenance and Monitoring

### Logging Strategy
- Info level for normal operations
- Warning level for recoverable errors
- Error level for critical failures
- Debug level for detailed diagnostics

### Health Checks
- Node initialization status
- STUN server connectivity
- DHT network connectivity
- Active peer connections count
- Data transfer statistics