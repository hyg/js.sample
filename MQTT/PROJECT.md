# MQTT-based PSMD Project

This project implements a system with two Node.js nodes (A and B) and a web client (C) communicating via MQTT. The nodes are designed to operate in different LANs behind NAT, connecting through an MQTT broker.

## Components

1. **Node A (Trustee)**: Waits for connections and handles communication.
2. **Node B (Delegator)**: Connects to Node A and initiates conversations.
3. **Web Client C**: A static HTML page that replicates Node B's functionality in a browser environment.

## Setup

1. Install dependencies:
   ```sh
   pnpm install
   ```

2. Start Node A:
   ```sh
   node nodeA.js
   ```

3. Start Node B:
   ```sh
   node nodeB.js
   ```

4. Open `index.html` in a web browser for Client C.

## Notes

- Ensure an MQTT broker is running and accessible.
- Nodes and the web client will prompt for user input and display messages from other nodes.