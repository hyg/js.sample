const dgram = require('dgram');
const crypto = require('crypto');
const SecurityManager = require('./security');

class DHTDiscovery {
    constructor(nodeId, port) {
        this.nodeId = nodeId;
        this.port = port || 6881;
        this.security = new SecurityManager();
        this.peers = new Map();
        this.announcements = new Map();
        this.socket = dgram.createSocket('udp4');
        
        this.socket.bind(this.port, '0.0.0.0');
        console.log(`DHT node listening on port ${this.port}`);
        
        this.setupSocketHandlers();
    }
    
    setupSocketHandlers() {
        this.socket.on('message', (msg, rinfo) => {
            this.handleMessage(msg, rinfo);
        });
        
        this.socket.on('error', (err) => {
            console.error('DHT socket error:', err);
        });
    }
    
    handleMessage(msg, rinfo) {
        try {
            const data = JSON.parse(msg.toString());
            
            switch (data.type) {
                case 'announce':
                    this.handleAnnounce(data, rinfo);
                    break;
                case 'lookup':
                    this.handleLookup(data, rinfo);
                    break;
                case 'peers':
                    this.handlePeers(data, rinfo);
                    break;
            }
        } catch (error) {
            console.error('Error handling DHT message:', error);
        }
    }
    
    handleAnnounce(data, rinfo) {
        const peer = {
            id: data.nodeId,
            address: rinfo.address,
            port: data.port,
            timestamp: Date.now()
        };
        
        this.peers.set(data.nodeId, peer);
        console.log(`Peer announced: ${data.nodeId}`);
    }
    
    handleLookup(data, rinfo) {
        const matchingPeers = Array.from(this.peers.values())
            .filter(peer => peer.id !== data.nodeId);
        
        const response = {
            type: 'peers',
            peers: matchingPeers
        };
        
        this.socket.send(JSON.stringify(response), rinfo.port, rinfo.address);
    }
    
    handlePeers(data, rinfo) {
        // Handle peers response from other nodes
        console.log(`Received ${data.peers.length} peers from ${rinfo.address}:${rinfo.port}`);
    }

    async announce(topic, port) {
        const announcement = {
            type: 'announce',
            nodeId: this.security.generateNodeId(),
            publicKey: this.security.getPublicKey(),
            port: port,
            timestamp: Date.now()
        };
        
        const signature = this.security.sign(JSON.stringify(announcement));
        announcement.signature = signature;
        
        // Broadcast to known bootstrap nodes
        const bootstrapNodes = [
            { address: '127.0.0.1', port: 6882 },
            { address: '127.0.0.1', port: 6884 }
        ];
        
        for (const node of bootstrapNodes) {
            this.socket.send(JSON.stringify(announcement), node.port, node.address);
        }
        
        this.announcements.set(topic, announcement);
        console.log(`Announced on DHT for topic: ${topic}`);
    }

    async lookup(topic) {
        const lookupRequest = {
            type: 'lookup',
            nodeId: this.nodeId,
            topic: topic,
            timestamp: Date.now()
        };
        
        // Send lookup to bootstrap nodes
        const bootstrapNodes = [
            { address: '127.0.0.1', port: 6882 },
            { address: '127.0.0.1', port: 6884 }
        ];
        
        for (const node of bootstrapNodes) {
            this.socket.send(JSON.stringify(lookupRequest), node.port, node.address);
        }
        
        // Return currently known peers
        return Array.from(this.peers.values());
    }

    async validatePeer(peer, topic) {
        try {
            const handshake = this.security.createHandshakeMessage();
            
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve(false);
                }, 5000);
                
                // In a real implementation, you would establish a connection
                // and exchange handshake messages here
                // For now, we'll just validate the basic structure
                if (peer.host && peer.port) {
                    clearTimeout(timeout);
                    resolve(true);
                } else {
                    clearTimeout(timeout);
                    resolve(false);
                }
            });
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    addPeer(peerId, peerInfo) {
        this.peers.set(peerId, {
            ...peerInfo,
            lastSeen: Date.now()
        });
    }

    getPeers() {
        return Array.from(this.peers.values());
    }

    removePeer(peerId) {
        this.peers.delete(peerId);
    }

    cleanup() {
        const now = Date.now();
        for (const [peerId, peer] of this.peers) {
            if (now - peer.lastSeen > 300000) { // 5 minutes
                this.removePeer(peerId);
            }
        }
    }

    getNodeId() {
        return this.security.generateNodeId();
    }

    destroy() {
        this.socket.close();
        this.peers.clear();
        this.announcements.clear();
    }
}

module.exports = DHTDiscovery;