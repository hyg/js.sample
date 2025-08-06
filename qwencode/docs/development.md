# P2P DHT Node - Development Documentation

## Overview

This document provides information for developers working on the P2P DHT Node system, focusing on implementation details and contribution guidelines.

## Project Structure

```
p2p-dht-node/
├── src/
│   ├── lib/
│   │   ├── node.js              # Node initialization and configuration
│   │   ├── stun-client.js       # STUN server communication
│   │   ├── dht-discovery.js     # DHT-based peer discovery
│   │   ├── peer-discovery.js    # Peer management
│   │   └── webrtc-manager.js    # WebRTC connection management
│   ├── index.js                 # Main application entry point
│   └── config.json              # Configuration file
├── docs/
│   ├── prd.md                   # Product Requirements Document
│   ├── architecture.md          # System Architecture
│   ├── configuration.md         # Configuration Guide
│   ├── implementation-details.md # Implementation Details
│   └── user-guide.md            # User Guide
├── test/
│   ├── unit/
│   └── integration/
└── package.json
```

## Key Components

### 1. Node Initialization (`src/lib/node.js`)

This module handles the initial setup of each node:
- Generates unique cryptographic identifiers
- Loads configuration from environment variables or file
- Sets up core system components
- Ensures proper initialization before system components are used

### 2. STUN Client (`src/lib/stun-client.js`)

Responsible for NAT address discovery:
- Implements RFC 5389 compliant STUN protocol
- Supports multiple STUN servers for redundancy
- Parses STUN responses to extract public IP addresses
- Provides timeout and error handling for unreliable connections

### 3. DHT Discovery (`src/lib/dht-discovery.js`)

The core component for meeting-based peer discovery:
- Integrates with DHT networks for distributed discovery
- Uses meeting codes as topics for isolation
- Announces nodes with public addresses in DHT
- Searches for other nodes in the same meeting topic
- Handles DHT connection state management

### 4. Peer Discovery Manager (`src/lib/peer-discovery.js`)

Manages discovered peers:
- Stores peer information with public addresses
- Tracks connection status and activity timestamps
- Provides APIs for peer retrieval and management
- Implements automatic cleanup of stale peers

### 5. WebRTC Manager (`src/lib/webrtc-manager.js`)

Handles peer-to-peer connections:
- Uses SimplePeer library for WebRTC implementation
- Manages connection lifecycle (establishment, data transfer, closure)
- Processes ICE candidates for NAT traversal
- Provides data transmission capabilities

## Implementation Guidelines

### Code Standards

1. **Consistent Naming Conventions**
   - Use camelCase for variables and functions
   - Use PascalCase for class names
   - Prefix private methods with underscore

2. **Error Handling**
   - Always implement proper error handling
   - Provide meaningful error messages
   - Log errors appropriately based on severity

3. **Documentation**
   - Add JSDoc comments to all public functions
   - Document parameters and return values
   - Include examples where appropriate

### Testing Strategy

1. **Unit Tests**
   - Test individual modules in isolation
   - Mock external dependencies (STUN servers, DHT)
   - Ensure code coverage for critical paths

2. **Integration Tests**
   - Test modules together as they would be used
   - Validate DHT discovery workflow
   - Verify STUN address discovery

3. **End-to-End Tests**
   - Simulate full node lifecycle
   - Test meeting isolation
   - Validate connection establishment

## Development Workflow

### Setting Up Development Environment

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with configuration:
   ```
   MEETING_CODE=TEST_MEETING_123
   DEBUG=true
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
```

### Code Quality

- Run linters before committing:
  ```bash
  npm run lint
  ```

- Ensure code coverage meets minimum thresholds:
  ```bash
  npm run coverage
  ```

## Contribution Guidelines

### Reporting Issues

When submitting issues:
1. Describe the problem clearly
2. Provide steps to reproduce
3. Include relevant logs or error messages
4. Specify your environment (Node.js version, OS, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Update documentation as needed
6. Submit pull request with clear description

### Code Review Process

1. All pull requests require at least one approval
2. Code must meet quality standards
3. Tests must pass for all changed functionality
4. Documentation must be updated for new features

## Release Process

### Versioning

This project follows semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### Release Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit and tag release
4. Publish to npm (if applicable)
5. Update documentation

## Testing Framework

### Unit Test Structure

Each module should have corresponding unit tests:
```javascript
describe('StunClient', () => {
  it('should parse STUN response correctly', () => {
    // test implementation
  });
});
```

### Integration Test Structure

Integration tests cover module interactions:
```javascript
describe('Node Discovery Flow', () => {
  it('should discover peers in same meeting', () => {
    // test implementation
  });
});
```

## Performance Considerations

1. **Memory Management**
   - Implement automatic cleanup of stale peer entries
   - Limit number of concurrent DHT operations

2. **Network Efficiency**
   - Minimize STUN queries to reduce latency
   - Implement connection pooling where beneficial

3. **Scalability**
   - Design DHT operations to handle large numbers of nodes
   - Consider caching strategies for frequently accessed data