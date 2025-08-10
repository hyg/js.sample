# P2P Node Software

This project implements a P2P node software in Node.js that can operate behind NATs using STUN servers and discover/connect to other nodes using a DHT protocol.

## Requirements

1.  Each node runs within a different LAN, behind a NAT.
2.  Nodes use the DHT protocol to publish their public address, discover other nodes, and communicate directly.
3.  Only node software is developed; no central server code.
4.  Nodes can use existing third-party servers (STUN, DHT bootstraps) for initial setup, but subsequent communication is direct (peer-to-peer).
5.  Communication must minimize exposure of data, timing, content, length, and endpoints to any server.
6.  STUN Servers (for NAT traversal):
    *   `stun:fwa.lifesizecloud.com:3478`
    *   `stun:stun.isp.net.au:3478`
    *   `stun:stun.freeswitch.org:3478`
    *   `stun:stun.voip.blackberry.com:3478`
7.  DHT Bootstrap Nodes:
    *   `{ host: '34.197.35.250', port: 6880 }`
    *   `{ host: '72.46.58.63', port: 51413 }`
    *   ... (full list provided in requirements)
