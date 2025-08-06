# P2P DHT Node - Core Configuration

This document outlines the core configuration structure for the P2P DHT Node project.

## Configuration Parameters

### STUN Servers
- **Name**: `STUN_SERVERS`
- **Type**: Comma-separated string
- **Default**: `'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302'`
- **Description**: List of STUN servers used for address discovery
- **Usage**: Nodes query these servers to determine their public IP address

### Node Identifier
- **Name**: `NODE_ID`
- **Type**: String
- **Default**: `null` (auto-generated)
- **Description**: Unique identifier for this node in the system
- **Usage**: Used to distinguish this node from others on the network

### Meeting Code
- **Name**: `MEETING_CODE`
- **Type**: String
- **Default**: `null`
- **Description**: Invitation code that identifies the meeting group
- **Usage**: All nodes in the same meeting must share the same code to discover each other

### Debug Mode
- **Name**: `DEBUG`
- **Type**: Boolean string (`'true'` or `'false'`)
- **Default**: `'false'`
- **Description**: Enable detailed logging for debugging purposes
- **Usage**: When enabled, provides verbose logging of system operations

## Configuration Loading Order

1. Environment variables (highest priority)
2. Configuration file (if exists)
3. Default values (lowest priority)

## Configuration File Format

The configuration can be persisted in `config.json`:

```json
{
  "stunServers": "stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302",
  "debug": false,
  "nodeId": "a1b2c3d4e5f6...",
  "meetingCode": "ABC123XYZ"
}
```

## Runtime Configuration

During runtime, the system automatically:
1. Loads configuration from environment variables
2. Overrides with configuration file values
3. Falls back to default values for missing settings
4. Validates required parameters (especially meeting code)

## Environment Variable Usage

To configure the system, set environment variables:

```bash
export STUN_SERVERS="stun:stun.example.com:3478,stun:stun2.example.com:3478"
export MEETING_CODE="MY_MEETING_123"
export DEBUG="true"
```

## Security Considerations

### Meeting Isolation
The `MEETING_CODE` serves as a security mechanism for isolating participants in different meetings. Nodes with different meeting codes will not discover each other even if they are on the same network.

### Node Identity
The `NODE_ID` is automatically generated cryptographically to ensure uniqueness and prevent impersonation attempts.

## Default Settings Summary

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| STUN_SERVERS | `stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302` | Public STUN servers |
| NODE_ID | Auto-generated | Unique node identifier |
| MEETING_CODE | `null` | Required for meeting participation |
| DEBUG | `false` | Verbose logging mode |