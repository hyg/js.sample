# P2P DHT Node

This is a Node.js application that allows users in different LANs to discover and communicate with each other directly, without relying on a central server for the actual data transfer. The connection establishment phase can utilize existing servers within China for signaling.

## Features

*   **NAT Traversal:** Enables direct communication between nodes behind different NATs.
*   **Serverless Communication:** Once a connection is established, communication is direct and encrypted, without any server dependency.
*   **Meeting Isolation:** Nodes automatically discover other nodes in the same meeting using invitation codes.
*   **DHT-Based Discovery:** Uses distributed hash tables for efficient peer discovery within meetings.
*   **Automatic Peer Discovery:** Nodes automatically find other participants in the same meeting.

## Getting Started

### Prerequisites

*   Node.js installed on your system.

### Installation

1. Clone or download this repository.
2. Navigate to the project directory in your terminal.
3. Run `npm install` to install the required dependencies.

### Configuration

Before running the node, set the following environment variables:

```bash
# Meeting code that identifies your meeting group
export MEETING_CODE="YOUR_MEETING_CODE_HERE"

# Optional: Enable debugging
export DEBUG="true"
```

### Usage

1. Set your environment variables:
   ```bash
   export MEETING_CODE="ABC123XYZ"
   export DEBUG="true"
   ```

2. Run `npm start` to start the node.

The node will:
1. Generate a unique node ID
2. Discover its public IP address via STUN
3. Join the meeting using the provided meeting code
4. Discover other participants in the same meeting via DHT
5. Establish direct WebRTC connections

## Implementation Details

This project uses:
*   **STUN Clients**: For discovering public IP addresses behind NATs
*   **DHT (Distributed Hash Table)**: For discovering peers within the same meeting
*   **SimplePeer**: For WebRTC data channel communication

### Key Components

1.  **Node Initialization (`src/lib/node.js`)**: Sets up the node with unique ID and loads configuration.
2.  **STUN Client (`src/lib/stun-client.js`)**: Communicates with STUN servers to discover public addresses.
3.  **DHT Discovery (`src/lib/dht-discovery.js`)**: Finds other nodes in the same meeting using DHT.
4.  **Peer Discovery (`src/lib/peer-discovery.js`)**: Manages discovered peers and their information.
5.  **WebRTC Manager (`src/lib/webrtc-manager.js`)**: Handles WebRTC connection establishment and data transfer.

### How It Works

1.  **Registration**: When a node starts, it uses the provided meeting code to join a meeting group.
2.  **Address Discovery**: The node queries STUN servers to discover its public IP address.
3.  **Peer Discovery**: The node announces itself in the DHT with its public address and searches for other nodes in the same meeting.
4.  **Connection Initiation**: To connect to another node, a node uses its discovered address to establish a WebRTC connection.
5.  **Data Transfer**: Once the data channel is open, nodes can send and receive data directly without any server involvement.

## Security

*   **Meeting Isolation**: Nodes with different meeting codes cannot discover each other, ensuring privacy between meetings.
*   **Encrypted Communication**: All data transferred via WebRTC is encrypted.
*   **Unique Identifiers**: Each node gets a cryptographically generated unique ID.

## Configuration

### Environment Variables

*   `MEETING_CODE` - The invitation code that identifies the meeting group (required)
*   `STUN_SERVERS` - List of STUN servers for address discovery (comma-separated, optional)
*   `DEBUG` - Enable detailed logging (boolean, optional)

### Default Configuration

*   `STUN_SERVERS`: `stun:fwa.lifesizecloud.com:3478,stun:stun.isp.net.au:3478,stun:stun.freeswitch.org:3478,stun:stun.voip.blackberry.com:3478`
*   `DEBUG`: `false`

## Testing

Run tests with:
```bash
npm test
```

Run specific test suites:
```bash
npm run test:unit     # Run unit tests
npm run test:integration  # Run integration tests
npm run test:e2e      # Run end-to-end tests
```

## Development

See `docs/development.md` for development guidelines and contribution information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.