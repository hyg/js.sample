// lib/connectionManager.js

const EventEmitter = require('events');
const crypto = require('crypto');
const sodium = require('sodium-native');

/**
 * Manages direct P2P connections, including NAT traversal and encryption setup.
 * This class handles the application-level logic for connections initiated
 * or accepted after DHT discovery.
 */
class ConnectionManager extends EventEmitter {
  /**
   * Creates a new ConnectionManager instance.
   * @param {P2PNode} p2pNode - The parent P2PNode instance.
   */
  constructor(p2pNode) {
    super();
    this.p2pNode = p2pNode;
    this.connections = new Map(); // Map of active connections by peer identifier
    this.pendingHandshakes = new Map(); // Map of pending handshakes
  }

  /**
   * Initiates a connection to a peer, including NAT traversal and handshake.
   * @param {Object} peerInfo - Object containing host and port of the peer.
   * @returns {Promise<Object>} A promise that resolves with a Connection object.
   */
  async connectToPeer(peerInfo) {
    const peerId = `${peerInfo.host}:${peerInfo.port}`;
    if (this.connections.has(peerId)) {
      return this.connections.get(peerId);
    }

    // 1. Determine our public IP/port (if behind NAT)
    // This should ideally be done once and cached.
    let publicAddress = null;
    try {
        // Simplified: assume we get it from STUN or DHT observation
        // A real implementation would integrate with StunClient or similar.
        // publicAddress = await this.p2pNode.getPublicAddress();
    } catch (err) {
        console.warn('Could not determine public address, using local address for hole punching:', err.message);
    }

    // 2. Send a connection request via the shared UDP socket
    // This request might need to be sent multiple times to increase
    // the chance of successful hole punching.
    const connectionRequestId = crypto.randomBytes(16).toString('hex');
    const requestPayload = Buffer.concat([
      Buffer.from([0x02, 0x01]), // App-specific prefix for connection request
      Buffer.from(connectionRequestId, 'hex'),
      Buffer.from(this.p2pNode.nodeId) // Our Node ID
    ]);

    // Send the request
    this.p2pNode.udpSocket.send(requestPayload, peerInfo.port, peerInfo.host, (err) => {
      if (err) {
        console.error(`Failed to send connection request to ${peerInfo.host}:${peerInfo.port}`, err);
        // This might not be fatal, as hole punching can still succeed
      } else {
        console.log(`Sent connection request (${connectionRequestId}) to ${peerInfo.host}:${peerInfo.port}`);
      }
    });

    // 3. Set up a timeout for the connection attempt
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingHandshakes.delete(connectionRequestId);
        reject(new Error(`Connection attempt to ${peerInfo.host}:${peerInfo.port} timed out`));
      }, this.p2pNode.options.connectionTimeout || 10000);

      // Store the pending handshake info
      this.pendingHandshakes.set(connectionRequestId, {
        peerInfo,
        resolve,
        reject,
        timeout,
        isInitiator: true // This node initiated the connection
      });
    });
  }

  /**
   * Handles an incoming connection request from a peer.
   * @param {Buffer} requestId - The connection request ID.
   * @param {Buffer} requesterNodeId - The Node ID of the requesting peer.
   * @param {Object} rinfo - Remote address info.
   */
  _onConnectionRequest(requestId, requesterNodeId, rinfo) {
    const requestIdHex = requestId.toString('hex');
    const peerId = `${rinfo.address}:${rinfo.port}`;

    console.log(`Received connection request (${requestIdHex}) from ${peerId}`);

    // Check if we are already connected or have a pending connection
    if (this.connections.has(peerId) || this.pendingHandshakes.has(requestIdHex)) {
        console.log(`Duplicate or existing connection request from ${peerId}, ignoring.`);
        return;
    }

    // For simplicity, auto-accept all requests.
    // In a real application, you might have logic to accept/reject.

    // 1. Send a connection response/acknowledgement
    const responsePayload = Buffer.concat([
      Buffer.from([0x02, 0x02]), // App-specific prefix for connection response
      requestId,
      Buffer.from(this.p2pNode.nodeId) // Our Node ID
      // Could include our public address observed from DHT if available
    ]);

    this.p2pNode.udpSocket.send(responsePayload, rinfo.port, rinfo.address, (err) => {
      if (err) {
        console.error(`Failed to send connection response to ${peerId}`, err);
        // Depending on requirements, you might want to abort the connection attempt here.
      } else {
        console.log(`Sent connection response for request (${requestIdHex}) to ${peerId}`);
      }
    });

    // 2. Initiate the handshake process
    this._startHandshake(requestIdHex, rinfo, false); // We are not the initiator
  }

  /**
   * Handles an incoming connection response/acknowledgement.
   * @param {Buffer} requestId - The connection request ID.
   * @param {Buffer} responderNodeId - The Node ID of the responding peer.
   * @param {Object} rinfo - Remote address info.
   */
  _onConnectionResponse(requestId, responderNodeId, rinfo) {
    const requestIdHex = requestId.toString('hex');
    const pendingInfo = this.pendingHandshakes.get(requestIdHex);

    if (!pendingInfo) {
      console.log(`Received unexpected connection response for request ${requestIdHex} from ${rinfo.address}:${rinfo.port}`);
      return; // Not a response we were waiting for
    }

    console.log(`Received connection response for request (${requestIdHex}) from ${rinfo.address}:${rinfo.port}`);

    // Clear the timeout as we received a response
    clearTimeout(pendingInfo.timeout);

    // Start the handshake process
    this._startHandshake(requestIdHex, rinfo, true); // We are the initiator
  }


  /**
   * Starts the cryptographic handshake process with a peer.
   * @param {string} requestIdHex - The connection request ID (hex).
   * @param {Object} rinfo - Remote address info.
   * @param {boolean} isInitiator - Whether this node initiated the connection.
   * @private
   */
  _startHandshake(requestIdHex, rinfo, isInitiator) {
    const peerId = `${rinfo.address}:${rinfo.port}`;
    console.log(`Starting handshake with ${peerId} (initiator: ${isInitiator})`);

    // This is where the Noise protocol or similar would be used.
    // For simplicity, we'll simulate a basic handshake and key exchange.

    // 1. Generate ephemeral keypair for this session
    const ephemeralKeyPair = sodium.crypto_kx_keypair();

    // 2. Create a Connection object (wrapper around the UDP socket for this peer)
    const connection = new Connection(this.p2pNode.udpSocket, rinfo, this.p2pNode.keyPair, ephemeralKeyPair);

    // 3. Send or receive the first handshake message
    // This is highly simplified. A real handshake involves multiple round trips.
    if (isInitiator) {
        // Send ephemeral public key
        const handshakeMsg1 = Buffer.concat([
            Buffer.from([0x03, 0x01]), // App prefix for handshake msg 1
            Buffer.from(requestIdHex, 'hex'),
            ephemeralKeyPair.publicKey
        ]);
        this.p2pNode.udpSocket.send(handshakeMsg1, rinfo.port, rinfo.address, (err) => {
            if(err) console.error(`Failed to send handshake msg 1 to ${peerId}:`, err);
        });
        // Store connection state for when msg 2 arrives
        this.pendingHandshakes.set(`${requestIdHex}_hs`, { connection, isInitiator });
    } else {
        // We expect to receive msg 1 first, then send msg 2.
        // This logic would be triggered by _onHandshakeMessage1
    }

    // For this example, we'll assume handshake completes quickly.
    // In reality, you'd wait for the final handshake message.
    setTimeout(() => {
        const pendingInfo = this.pendingHandshakes.get(requestIdHex);
        if (pendingInfo) {
            this.connections.set(peerId, connection);
            this.pendingHandshakes.delete(requestIdHex);
            console.log(`Handshake completed with ${peerId}`);
            this.emit('connection', connection);
            if (pendingInfo.resolve) pendingInfo.resolve(connection);
        }
    }, 100); // Simulate instant handshake completion for demo
  }

  /**
   * Handles incoming application-layer messages related to connection management.
   * @param {Buffer} msg - The received message buffer.
   * @param {Object} rinfo - Remote address info.
   */
  handleMessage(msg, rinfo) {
    const msgType = msg.readUInt16BE(0);
    switch (msgType) {
      case 0x0201: // Connection Request
        if (msg.length >= 18) { // 2 prefix + 16 request ID + min 1 byte node ID
          const requestId = msg.slice(2, 18);
          const requesterNodeId = msg.slice(18);
          this._onConnectionRequest(requestId, requesterNodeId, rinfo);
        }
        break;
      case 0x0202: // Connection Response
        if (msg.length >= 18) {
          const requestId = msg.slice(2, 18);
          const responderNodeId = msg.slice(18);
          this._onConnectionResponse(requestId, responderNodeId, rinfo);
        }
        break;
       case 0x0301: // Handshake Message 1
        if (msg.length >= 18) {
            const requestId = msg.slice(2, 18).toString('hex');
            const ephemeralPublicKey = msg.slice(18, 18 + 32); // Assuming 32-byte key
            // Logic to handle msg 1 and send msg 2 would go here
            console.log(`Received handshake msg 1 from ${rinfo.address}:${rinfo.port}`);
        }
        break;
      // Add cases for other handshake messages (0x0302, etc.) and encrypted data (0x04xx)
      default:
        // Not a connection management message, might be encrypted app data
        // Pass it to the Connection object for that peer, if it exists.
        const peerId = `${rinfo.address}:${rinfo.port}`;
        const connection = this.connections.get(peerId);
        if (connection) {
            connection._handleIncomingData(msg);
        } else {
            console.warn(`Received app data from unknown peer ${peerId}`);
        }
        break;
    }
  }
}

/**
 * Represents a direct P2P connection to a peer.
 * Wraps the shared UDP socket to provide a stream-like interface
 * for a specific peer, including encryption/decryption.
 */
class Connection extends EventEmitter {
  /**
   * Creates a new Connection instance.
   * @param {dgram.Socket} udpSocket - The shared UDP socket.
   * @param {Object} remoteInfo - Remote address and port.
   * @param {Object} ourKeyPair - Our long-term keypair.
   * @param {Object} ourEphemeralKeyPair - Our ephemeral keypair for this session.
   */
  constructor(udpSocket, remoteInfo, ourKeyPair, ourEphemeralKeyPair) {
    super();
    this.udpSocket = udpSocket;
    this.remoteAddress = remoteInfo.address;
    this.remotePort = remoteInfo.port;
    this.ourKeyPair = ourKeyPair;
    this.ourEphemeralKeyPair = ourEphemeralKeyPair;
    this.remoteEphemeralPublicKey = null; // To be set during handshake
    this.tx = null; // Transmission keypair (for encrypting outbound)
    this.rx = null; // Reception keypair (for decrypting inbound)
    this.isConnected = false;
  }

  /**
   * Simulates sending encrypted data.
   * @param {string|Buffer} data - The data to send.
   */
  write(data) {
    if (!this.isConnected) {
        console.warn('Cannot send data, connection not fully established');
        return;
    }
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    // In a real implementation, you would use the 'tx' key to encrypt 'dataBuffer'
    // and then send the encrypted data via this.udpSocket.
    // For example, using libsodium's crypto_secretbox_easy or Noise protocol.

    // Placeholder: Send data with a prefix indicating it's encrypted app data
    const encryptedData = Buffer.concat([
        Buffer.from([0x04, 0x01]), // App prefix for encrypted data
        dataBuffer // In reality, this would be the encrypted payload
    ]);

    this.udpSocket.send(encryptedData, this.remotePort, this.remoteAddress, (err) => {
      if (err) {
        console.error(`Failed to send data to ${this.remoteAddress}:${this.remotePort}`, err);
        this.emit('error', err);
      }
    });
  }

  /**
   * Handles incoming data for this specific connection.
   * This would typically involve decrypting the data.
   * @param {Buffer} data - The raw data received.
   * @private
   */
  _handleIncomingData(data) {
    // Check if it's encrypted app data
    if (data.length >= 2 && data[0] === 0x04 && data[1] === 0x01) {
        const encryptedPayload = data.slice(2);
        // In a real implementation, use the 'rx' key to decrypt 'encryptedPayload'
        // const decryptedData = sodium.crypto_secretbox_open_easy(...)
        // For demo, just emit the payload as-is
        const decryptedData = encryptedPayload; // Placeholder
        this.emit('data', decryptedData);
    } else {
        console.warn(`Received unexpected data format on connection to ${this.remoteAddress}:${this.remotePort}`);
    }
  }

  /**
   * Closes the connection.
   */
  close() {
    this.isConnected = false;
    this.emit('close');
  }
}

module.exports = ConnectionManager;