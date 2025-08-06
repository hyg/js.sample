/**
 * Peer discovery module for P2P DHT node
 * Handles discovery and management of known peers in the network
 */

const EventEmitter = require('events');

/**
 * Peer discovery class
 * Manages known peers and facilitates node discovery
 */
class PeerDiscovery extends EventEmitter {
  constructor() {
    super();
    // Store known peers with their information
    this.knownPeers = new Map();
    // Store peer connection status
    this.peerStatus = new Map();
  }

  /**
   * Add a peer to the known peers list
   * @param {string} peerId - Unique identifier for the peer
   * @param {Object} peerInfo - Information about the peer
   * @param {string} peerInfo.publicAddress - Public IP address and port
   * @param {number} peerInfo.port - Port number
   * @param {string} peerInfo.protocol - Communication protocol
   * @param {number} peerInfo.lastSeen - Timestamp when peer was last seen
   * @returns {boolean} True if peer was added successfully
   */
  addPeer(peerId, peerInfo) {
    try {
      if (!peerId || !peerInfo) {
        throw new Error('Peer ID and peer info are required');
      }

      // Validate peer info structure
      if (!peerInfo.publicAddress || !peerInfo.port) {
        throw new Error('Public address and port are required in peer info');
      }

      // Update peer information
      this.knownPeers.set(peerId, {
        id: peerId,
        publicAddress: peerInfo.publicAddress,
        port: peerInfo.port,
        protocol: peerInfo.protocol || 'webrtc',
        lastSeen: Date.now(),
        addedAt: this.knownPeers.has(peerId) ? this.knownPeers.get(peerId).addedAt : Date.now()
      });

      // Set initial status
      this.peerStatus.set(peerId, {
        connected: false,
        lastActive: Date.now(),
        connectionAttempts: 0
      });

      // Emit event for peer addition
      this.emit('peerAdded', { peerId, peerInfo });
      
      return true;
    } catch (error) {
      console.error('Failed to add peer:', error.message);
      return false;
    }
  }

  /**
   * Remove a peer from the known peers list
   * @param {string} peerId - Unique identifier for the peer
   * @returns {boolean} True if peer was removed successfully
   */
  removePeer(peerId) {
    try {
      const removed = this.knownPeers.delete(peerId);
      this.peerStatus.delete(peerId);
      
      if (removed) {
        this.emit('peerRemoved', { peerId });
      }
      
      return removed;
    } catch (error) {
      console.error('Failed to remove peer:', error.message);
      return false;
    }
  }

  /**
   * Get all known peers
   * @returns {Array} Array of peer objects
   */
  getKnownPeers() {
    return Array.from(this.knownPeers.values());
  }

  /**
   * Get a specific peer by ID
   * @param {string} peerId - Unique identifier for the peer
   * @returns {Object|null} Peer object or null if not found
   */
  getPeer(peerId) {
    return this.knownPeers.get(peerId) || null;
  }

  /**
   * Update peer last seen timestamp
   * @param {string} peerId - Unique identifier for the peer
   * @returns {boolean} True if peer was updated successfully
   */
  updatePeerLastSeen(peerId) {
    try {
      const peer = this.knownPeers.get(peerId);
      if (!peer) {
        return false;
      }

      peer.lastSeen = Date.now();
      this.knownPeers.set(peerId, peer);
      
      // Emit peer activity event
      this.emit('peerActivity', { peerId, timestamp: peer.lastSeen });
      
      return true;
    } catch (error) {
      console.error('Failed to update peer last seen:', error.message);
      return false;
    }
  }

  /**
   * Get peers by connection status
   * @param {boolean} connected - Filter by connection status
   * @returns {Array} Array of peer objects matching the status
   */
  getPeersByStatus(connected) {
    const peers = this.getKnownPeers();
    return peers.filter(peer => {
      const status = this.peerStatus.get(peer.id);
      return status ? status.connected === connected : false;
    });
  }

  /**
   * Mark peer as connected
   * @param {string} peerId - Unique identifier for the peer
   * @returns {boolean} True if peer status was updated
   */
  markPeerConnected(peerId) {
    try {
      const status = this.peerStatus.get(peerId);
      if (!status) {
        return false;
      }

      status.connected = true;
      status.lastActive = Date.now();
      this.peerStatus.set(peerId, status);
      
      this.emit('peerConnected', { peerId, timestamp: status.lastActive });
      return true;
    } catch (error) {
      console.error('Failed to mark peer as connected:', error.message);
      return false;
    }
  }

  /**
   * Mark peer as disconnected
   * @param {string} peerId - Unique identifier for the peer
   * @returns {boolean} True if peer status was updated
   */
  markPeerDisconnected(peerId) {
    try {
      const status = this.peerStatus.get(peerId);
      if (!status) {
        return false;
      }

      status.connected = false;
      status.lastActive = Date.now();
      this.peerStatus.set(peerId, status);
      
      this.emit('peerDisconnected', { peerId, timestamp: status.lastActive });
      return true;
    } catch (error) {
      console.error('Failed to mark peer as disconnected:', error.message);
      return false;
    }
  }

  /**
   * Get peer connection status
   * @param {string} peerId - Unique identifier for the peer
   * @returns {Object|null} Peer status object or null if not found
   */
  getPeerStatus(peerId) {
    return this.peerStatus.get(peerId) || null;
  }

  /**
   * Remove inactive peers (older than specified time)
   * @param {number} maxAgeMs - Maximum age in milliseconds
   * @returns {Array} Array of removed peer IDs
   */
  removeInactivePeers(maxAgeMs = 30 * 60 * 1000) { // Default 30 minutes
    const now = Date.now();
    const removedPeers = [];
    
    for (const [peerId, peer] of this.knownPeers.entries()) {
      if (now - peer.lastSeen > maxAgeMs) {
        this.removePeer(peerId);
        removedPeers.push(peerId);
      }
    }
    
    return removedPeers;
  }

  /**
   * Clear all known peers
   * @returns {number} Number of peers cleared
   */
  clearPeers() {
    const count = this.knownPeers.size;
    this.knownPeers.clear();
    this.peerStatus.clear();
    return count;
  }
}

module.exports = PeerDiscovery;