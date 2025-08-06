/**
 * WebRTC manager module for P2P DHT node
 * Handles WebRTC connection establishment and management
 */

const EventEmitter = require('events');
const SimplePeer = require('simple-peer');

/**
 * WebRTC manager class
 * Manages WebRTC connections between peers
 */
class WebRtcManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.peers = new Map(); // Store active peer connections
    this.connectionTimeout = options.connectionTimeout || 30000; // 30 seconds
    this.debug = options.debug || false;
  }

  /**
   * Create a new WebRTC connection to a peer
   * @param {string} peerId - Unique identifier for the peer
   * @param {Object} peerInfo - Information about the peer
   * @param {string} peerInfo.publicAddress - Public IP address and port
   * @param {number} peerInfo.port - Port number
   * @param {boolean} initiator - Whether this node initiates the connection
   * @returns {Promise<Object>} Promise resolving to connection object
   */
  async createConnection(peerId, peerInfo, initiator = false) {
    return new Promise((resolve, reject) => {
      if (this.debug) {
        console.log(`Creating WebRTC connection to peer: ${peerId}`);
      }

      // Check if connection already exists
      if (this.peers.has(peerId)) {
        const existingPeer = this.peers.get(peerId);
        if (existingPeer.connected) {
          resolve(existingPeer);
          return;
        }
      }

      try {
        // Create SimplePeer instance
        const peer = new SimplePeer({
          initiator: initiator,
          trickle: false, // Disable trickle ICE for simplicity
          iceTimeout: this.connectionTimeout,
          // Add any other SimplePeer options here
        });

        // Store reference to peer
        this.peers.set(peerId, {
          peer: peer,
          id: peerId,
          connected: false,
          createdAt: Date.now(),
          lastActive: Date.now()
        });

        // Handle peer events
        peer.on('signal', (signalData) => {
          if (this.debug) {
            console.log(`Signal data for peer ${peerId}:`, signalData.type);
          }
          
          // Emit signal event for external handling
          this.emit('signal', {
            peerId: peerId,
            signal: signalData
          });
        });

        peer.on('connect', () => {
          if (this.debug) {
            console.log(`WebRTC connection established with peer: ${peerId}`);
          }
          
          // Update connection status
          const peerInfo = this.peers.get(peerId);
          if (peerInfo) {
            peerInfo.connected = true;
            peerInfo.lastActive = Date.now();
            this.peers.set(peerId, peerInfo);
          }
          
          // Emit connection event
          this.emit('connected', {
            peerId: peerId,
            timestamp: Date.now()
          });
          
          resolve(peer);
        });

        peer.on('data', (data) => {
          if (this.debug) {
            console.log(`Data received from peer ${peerId}:`, data.length, 'bytes');
          }
          
          // Update last active time
          const peerInfo = this.peers.get(peerId);
          if (peerInfo) {
            peerInfo.lastActive = Date.now();
            this.peers.set(peerId, peerInfo);
          }
          
          // Emit data received event
          this.emit('data', {
            peerId: peerId,
            data: data,
            timestamp: Date.now()
          });
        });

        peer.on('close', () => {
          if (this.debug) {
            console.log(`WebRTC connection closed with peer: ${peerId}`);
          }
          
          // Clean up peer reference
          this.peers.delete(peerId);
          
          // Emit close event
          this.emit('closed', {
            peerId: peerId,
            timestamp: Date.now()
          });
        });

        peer.on('error', (error) => {
          console.error(`WebRTC error with peer ${peerId}:`, error.message);
          
          // Clean up on error
          this.peers.delete(peerId);
          
          // Emit error event
          this.emit('error', {
            peerId: peerId,
            error: error.message,
            timestamp: Date.now()
          });
          
          reject(error);
        });

        // If we're not the initiator, we expect to receive an offer
        // This would typically be handled externally when receiving signaling data
        
        if (this.debug) {
          console.log(`WebRTC peer created for ${peerId} (initiator: ${initiator})`);
        }
        
        // If we're the initiator, we can send an initial signal
        if (initiator) {
          // Wait a bit for SimplePeer to be ready before sending signal
          setTimeout(() => {
            if (!peer.destroyed && !peer.connected) {
              // This will trigger the 'signal' event
              // The caller is responsible for sending the signal to the remote peer
            }
          }, 100);
        }

        resolve(peer);
      } catch (error) {
        reject(new Error(`Failed to create WebRTC connection: ${error.message}`));
      }
    });
  }

  /**
   * Handle incoming signal data from a peer
   * @param {string} peerId - Unique identifier for the peer
   * @param {Object} signalData - Signal data received from peer
   * @returns {Promise<void>}
   */
  async handleSignal(peerId, signalData) {
    return new Promise((resolve, reject) => {
      try {
        if (this.debug) {
          console.log(`Handling signal for peer ${peerId}:`, signalData.type);
        }

        const peerInfo = this.peers.get(peerId);
        if (!peerInfo || !peerInfo.peer) {
          // Create new peer if it doesn't exist
          if (this.debug) {
            console.log(`Creating new peer for ${peerId} due to signal`);
          }
          
          // Note: We can't use the signal to create a peer without knowing
          // if we're the initiator. This is a simplification - in practice,
          // this method would be called with an existing peer or the caller
          // would need to know the connection state.
          reject(new Error(`Peer ${peerId} not found and cannot be created from signal alone`));
          return;
        }

        // Pass signal data to SimplePeer
        const peer = peerInfo.peer;
        if (!peer.destroyed) {
          peer.signal(signalData);
          resolve();
        } else {
          reject(new Error(`Peer ${peerId} is destroyed`));
        }
      } catch (error) {
        reject(new Error(`Failed to handle signal for peer ${peerId}: ${error.message}`));
      }
    });
  }

  /**
   * Send data to a connected peer
   * @param {string} peerId - Unique identifier for the peer
   * @param {Buffer|string} data - Data to send
   * @returns {Promise<boolean>} Promise resolving to true if successful
   */
  async sendData(peerId, data) {
    return new Promise((resolve, reject) => {
      try {
        const peerInfo = this.peers.get(peerId);
        if (!peerInfo) {
          reject(new Error(`Peer ${peerId} not found`));
          return;
        }

        const peer = peerInfo.peer;
        if (!peer || peer.destroyed) {
          reject(new Error(`Peer ${peerId} connection is not active`));
          return;
        }

        if (!peer.connected) {
          reject(new Error(`Peer ${peerId} is not connected`));
          return;
        }

        // Send data through WebRTC
        peer.send(data);

        // Update last active time
        peerInfo.lastActive = Date.now();
        this.peers.set(peerId, peerInfo);

        if (this.debug) {
          console.log(`Sent ${data.length || data.byteLength || 0} bytes to peer ${peerId}`);
        }

        resolve(true);
      } catch (error) {
        reject(new Error(`Failed to send data to peer ${peerId}: ${error.message}`));
      }
    });
  }

  /**
   * Close connection to a peer
   * @param {string} peerId - Unique identifier for the peer
   * @returns {Promise<void>}
   */
  async closeConnection(peerId) {
    return new Promise((resolve, reject) => {
      try {
        const peerInfo = this.peers.get(peerId);
        if (!peerInfo) {
          resolve(); // Already closed
          return;
        }

        const peer = peerInfo.peer;
        if (peer && !peer.destroyed) {
          peer.destroy();
        }

        // Clean up peer reference
        this.peers.delete(peerId);

        if (this.debug) {
          console.log(`Closed connection to peer: ${peerId}`);
        }

        resolve();
      } catch (error) {
        reject(new Error(`Failed to close connection to peer ${peerId}: ${error.message}`));
      }
    });
  }

  /**
   * Get connection status for a peer
   * @param {string} peerId - Unique identifier for the peer
   * @returns {Object|null} Connection status or null if peer not found
   */
  getConnectionStatus(peerId) {
    const peerInfo = this.peers.get(peerId);
    if (!peerInfo) {
      return null;
    }

    return {
      id: peerId,
      connected: peerInfo.connected,
      createdAt: peerInfo.createdAt,
      lastActive: peerInfo.lastActive
    };
  }

  /**
   * Get all active connections
   * @returns {Array} Array of connection status objects
   */
  getAllConnections() {
    return Array.from(this.peers.values()).map(peerInfo => ({
      id: peerInfo.id,
      connected: peerInfo.connected,
      createdAt: peerInfo.createdAt,
      lastActive: peerInfo.lastActive
    }));
  }

  /**
   * Get number of active connections
   * @returns {number} Number of active connections
   */
  getConnectionCount() {
    let count = 0;
    for (const peerInfo of this.peers.values()) {
      if (peerInfo.connected) {
        count++;
      }
    }
    return count;
  }

  /**
   * Clean up all connections
   * @returns {Promise<void>}
   */
  async cleanup() {
    const promises = [];
    for (const [peerId] of this.peers.entries()) {
      promises.push(this.closeConnection(peerId));
    }
    await Promise.allSettled(promises);
    this.peers.clear();
  }
}

module.exports = WebRtcManager;