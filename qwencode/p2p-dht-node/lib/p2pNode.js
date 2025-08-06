// lib/p2pNode.js

const DHT = require('bittorrent-dht');
const dgram = require('dgram');
const crypto = require('crypto');
const sodium = require('sodium-native');
const EventEmitter = require('events');
const fs = require('fs').promises;

/**
 * A P2P Node that uses a DHT for discovery and establishes encrypted direct connections.
 * Operates on a single UDP port for both DHT and application traffic.
 */
class P2PNode extends EventEmitter {
  /**
   * Creates a new P2PNode instance.
   * @param {Object} options - Configuration options.
   * @param {number} options.port - The UDP port to listen on.
   * @param {Array} options.bootstrapNodes - List of DHT bootstrap nodes.
   * @param {string|null} [options.nodeId=null] - Optional fixed node ID.
   * @param {boolean} [options.enableEncryption=true] - Enable end-to-end encryption.
   * @param {string} [options.identityFile=null] - Path to file for persistent identity.
   * @param {Array} [options.stunServers=[]] - List of STUN servers.
   */
  constructor(options = {}) {
    super();
    this.port = options.port || 6881;
    this.bootstrapNodes = options.bootstrapNodes || [];
    this.enableEncryption = options.enableEncryption !== false; // Default true
    this.identityFile = options.identityFile || null;
    this.stunServers = options.stunServers || [];

    // Generate or load Node ID
    this.nodeId = options.nodeId ? Buffer.from(options.nodeId, 'hex') : null;
    if (!this.nodeId) {
      this.nodeId = crypto.randomBytes(20); // Standard DHT node ID length
    }

    this.dht = null;
    this.udpSocket = null;
    this.peers = new Map(); // Map of connected peers
    this.pendingConnections = new Map(); // Map of ongoing connection attempts
    this.isRunning = false;

    // Encryption keys (simplified for example)
    this.keyPair = null;
  }

  /**
   * Starts the P2P node: initializes DHT, binds UDP socket, loads identity.
   */
  async start() {
    if (this.isRunning) {
      throw new Error('Node is already running');
    }

    await this._loadIdentity();
    this.keyPair = sodium.crypto_kx_keypair(); // Generate keypair for encryption

    // 1. Create and bind the single UDP socket
    this.udpSocket = dgram.createSocket('udp4');
    this.udpSocket.on('message', this._handleUdpMessage.bind(this));
    this.udpSocket.on('error', (err) => {
      console.error('UDP Socket Error:', err);
      this.emit('error', err);
    });

    await new Promise((resolve, reject) => {
      this.udpSocket.bind(this.port, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`UDP socket bound to port ${this.port}`);

    // 2. Initialize the DHT instance using the same socket
    this.dht = new DHT({
      nodeId: this.nodeId,
      socket: this.udpSocket, // Crucial: Reuse the same socket
      bootstrap: this.bootstrapNodes
    });

    this.dht.on('ready', () => {
      console.log('DHT is ready');
      this.emit('dhtReady');
    });

    this.dht.on('peer', this._onDhtPeer.bind(this));
    this.dht.on('error', (err) => {
      console.error('DHT Error:', err);
      this.emit('error', err);
    });

    // Start the DHT
    // Note: The 'ready' event will be emitted once bootstrapping is complete.
    this.dht.listen(); // This is typically called implicitly by DHT constructor if socket is provided

    this.isRunning = true;
    console.log(`P2P Node started with ID: ${this.nodeId.toString('hex')}`);
  }

  /**
   * Stops the P2P node: closes DHT, UDP socket, cleans up.
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    await this._saveIdentity();

    if (this.dht) {
      this.dht.destroy();
    }
    if (this.udpSocket) {
      this.udpSocket.close();
    }
    this.isRunning = false;
    console.log('P2P Node stopped');
  }

  /**
   * Announces this node's presence for a specific topic in the DHT.
   * @param {string|Buffer} topic - The topic to announce under.
   */
  announce(topic) {
    if (!this.dht || !this.isRunning) {
      throw new Error('Node must be started before announcing');
    }
    const topicBuffer = Buffer.isBuffer(topic) ? topic : Buffer.from(topic);
    this.dht.announce(topicBuffer, this.port, (err) => {
      if (err) {
        console.error(`Failed to announce for topic ${topicBuffer.toString('hex')}:`, err);
      } else {
        console.log(`Announced for topic ${topicBuffer.toString('hex')}`);
      }
    });
  }

  /**
   * Looks up peers for a specific topic in the DHT.
   * @param {string|Buffer} topic - The topic to lookup.
   * @param {Function} [callback] - Optional callback (err, peers).
   */
  lookup(topic, callback) {
    if (!this.dht || !this.isRunning) {
      const err = new Error('Node must be started before looking up');
      if (callback) callback(err);
      else throw err;
    }
    const topicBuffer = Buffer.isBuffer(topic) ? topic : Buffer.from(topic);
    this.dht.lookup(topicBuffer, callback);
  }

  /**
   * Internal method to load or generate node identity.
   * @private
   */
  async _loadIdentity() {
    if (!this.identityFile) return;

    try {
      const data = await fs.readFile(this.identityFile, 'utf8');
      const identity = JSON.parse(data);
      if (identity.nodeId) {
        this.nodeId = Buffer.from(identity.nodeId, 'hex');
      }
      // Load encryption keys if stored
      console.log('Loaded identity from file');
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('Identity file not found, will generate a new one');
      } else {
        console.error('Error loading identity file:', err);
      }
    }
  }

  /**
   * Internal method to save node identity.
   * @private
   */
  async _saveIdentity() {
    if (!this.identityFile) return;

    const identity = {
      nodeId: this.nodeId.toString('hex'),
      // Save encryption keys if needed
    };

    try {
      await fs.writeFile(this.identityFile, JSON.stringify(identity, null, 2));
      console.log('Saved identity to file');
    } catch (err) {
      console.error('Error saving identity file:', err);
    }
  }

  /**
   * Handles incoming UDP messages. Determines if they are for DHT or application.
   * @param {Buffer} msg - The received message buffer.
   * @param {Object} rinfo - Remote address info.
   * @private
   */
  _handleUdpMessage(msg, rinfo) {
    // This is a simplified check. In practice, you'd inspect the packet
    // structure or use a multiplexer.
    // For bittorrent-dht, it usually handles messages internally.
    // We'll assume all messages not handled by DHT are for the app layer.

    // A simple way to distinguish (example only):
    // If message starts with a specific prefix, it's for our app.
    if (msg[0] === 0x01 && msg[1] === 0x02) { // Example app prefix
        this._handleAppMessage(msg.slice(2), rinfo); // Remove prefix
    }
    // Otherwise, it's likely a DHT message and will be handled by the DHT instance
    // which is listening on the same socket.
  }

  /**
   * Handles application-layer messages received via UDP.
   * @param {Buffer} msg - The application message buffer.
   * @param {Object} rinfo - Remote address info.
   * @private
   */
  _handleAppMessage(msg, rinfo) {
    console.log(`App message received from ${rinfo.address}:${rinfo.port}`);
    // Here you would implement your application protocol
    // Parse the message, potentially decrypt it, and emit events.
    this.emit('appMessage', msg, rinfo);
  }

  /**
   * Handles peer discovery events from the DHT.
   * @param {Buffer} peerInfo - Info about the discovered peer.
   * @param {Buffer} infoHash - The info hash (topic) the peer was found for.
   * @param {string} via - How the peer was found.
   * @private
   */
  _onDhtPeer(peerInfo, infoHash, via) {
    console.log(`DHT Peer found: ${peerInfo.host}:${peerInfo.port} for infoHash ${infoHash.toString('hex')}`);
    // Emit a generic 'peer' event with the topic
    this.emit('peer', peerInfo, infoHash.toString('hex'));
  }

  /**
   * Connects to a discovered peer.
   * This is a simplified placeholder. Real implementation would involve
   * NAT traversal logic (e.g., STUN, hole punching) and setting up
   * an encrypted stream.
   * @param {Object} peerInfo - Object containing host and port of the peer.
   * @returns {Promise<Object>} A promise that resolves with a connection object.
   */
  async connectToPeer(peerInfo) {
     // This is a non-trivial part. A full implementation would:
     // 1. Determine if peer is behind NAT (using STUN or DHT observations).
     // 2. If both are behind NAT, attempt hole punching.
     // 3. Once a direct UDP "connection" is established, perform a handshake.
     // 4. Set up an encrypted duplex stream over the UDP socket for this peer.
     // For this example, we'll just simulate a connection object.

     console.log(`Attempting to connect to peer ${peerInfo.host}:${peerInfo.port}...`);
     // Simulate a connection process
     return new Promise((resolve, reject) => {
         // Simulate success/failure
         setTimeout(() => {
             if (Math.random() > 0.2) { // 80% chance of "success"
                 const mockConnection = {
                     remoteAddress: peerInfo.host,
                     remotePort: peerInfo.port,
                     // In a real implementation, this would be a Duplex stream
                     // wrapping the UDP socket for this specific peer,
                     // with encryption applied.
                     write: (data) => {
                         console.log(`Sending data to ${peerInfo.host}:${peerInfo.port}:`, data.toString());
                         // In a real implementation, encrypt 'data' and send via this.udpSocket
                         // to peerInfo.host:peerInfo.port
                     }
                 };
                 this.peers.set(`${peerInfo.host}:${peerInfo.port}`, mockConnection);
                 this.emit('connection', mockConnection); // Emit when connected
                 resolve(mockConnection);
             } else {
                 reject(new Error('Connection attempt failed'));
             }
         }, 1000); // Simulate network delay
     });
  }

  /**
   * Sends an encrypted message to a connected peer.
   * @param {Object} connection - The connection object obtained from connectToPeer.
   * @param {string|Buffer} message - The message to send.
   */
  async sendMessage(connection, message) {
    if (!this.peers.has(`${connection.remoteAddress}:${connection.remotePort}`)) {
        throw new Error('Not connected to this peer');
    }
    // In a real implementation, 'message' would be encrypted before
    // being sent via the connection's underlying mechanism.
    connection.write(message);
  }
}

module.exports = P2PNode;