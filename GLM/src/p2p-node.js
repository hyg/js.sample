const EventEmitter = require('events');
const crypto = require('crypto');
const DHTDiscovery = require('./dht-discovery');
const NATTraversal = require('./nat-traversal');
const P2PCommunication = require('./p2p-communication');
const SecurityManager = require('./security');

class P2PNode extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 6881,
            dhtPort: config.dhtPort || 6882,
            bootstrapNodes: config.bootstrapNodes || [],
            topic: config.topic || 'p2p-network',
            ...config
        };
        
        this.nodeId = this.generateNodeId();
        this.security = new SecurityManager();
        this.dht = new DHTDiscovery(this.nodeId, this.config.dhtPort);
        this.natTraversal = new NATTraversal();
        this.communication = new P2PCommunication(this.nodeId);
        
        this.peers = new Map();
        this.routes = new Map();
        this.isRunning = false;
        
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.communication.on('peerConnected', this.handlePeerConnected.bind(this));
        this.communication.on('peerDisconnected', this.handlePeerDisconnected.bind(this));
        this.communication.on('message', this.handleMessage.bind(this));
    }

    async start() {
        try {
            console.log(`Starting P2P node ${this.nodeId}`);
            
            // Discover public address
            const publicEndpoint = await this.natTraversal.discoverPublicAddress();
            console.log('Public endpoint:', publicEndpoint);
            
            // Start DHT discovery
            await this.dht.announce(this.config.topic, this.config.port);
            console.log(`Announced on DHT topic: ${this.config.topic}`);
            
            // Start peer discovery
            this.startPeerDiscovery();
            
            // Start periodic cleanup
            this.startCleanupTasks();
            
            this.isRunning = true;
            this.emit('started', {
                nodeId: this.nodeId,
                publicEndpoint: publicEndpoint
            });
            
            console.log('P2P node started successfully');
            
        } catch (error) {
            console.error('Failed to start P2P node:', error);
            throw error;
        }
    }

    async stop() {
        try {
            console.log('Stopping P2P node...');
            
            this.isRunning = false;
            
            // Disconnect from all peers
            for (const peerId of this.communication.getConnectedPeers()) {
                await this.communication.disconnect(peerId);
            }
            
            // Clean up DHT
            this.dht.destroy();
            
            this.emit('stopped');
            console.log('P2P node stopped');
            
        } catch (error) {
            console.error('Error stopping P2P node:', error);
        }
    }

    async startPeerDiscovery() {
        const discoverPeers = async () => {
            if (!this.isRunning) return;
            
            try {
                const peers = await this.dht.lookup(this.config.topic);
                
                for (const peer of peers) {
                    if (peer.id !== this.nodeId) {
                        await this.handleDiscoveredPeer(peer);
                    }
                }
            } catch (error) {
                console.error('Peer discovery error:', error);
            }
            
            // Continue discovery
            setTimeout(discoverPeers, 30000); // 30 seconds
        };
        
        discoverPeers();
    }

    async handleDiscoveredPeer(peer) {
        if (this.peers.has(peer.id)) {
            // Update existing peer
            const existingPeer = this.peers.get(peer.id);
            existingPeer.lastSeen = Date.now();
            return;
        }
        
        try {
            console.log(`Discovered peer: ${peer.id}`);
            
            // Perform NAT traversal if needed
            const connection = await this.natTraversal.createHolePunchingSession(peer);
            
            // Establish P2P communication
            await this.communication.connect(peer.id, peer);
            
            this.peers.set(peer.id, {
                id: peer.id,
                address: peer.address,
                port: peer.port,
                lastSeen: Date.now(),
                connection: connection
            });
            
            this.emit('peerDiscovered', peer);
            
        } catch (error) {
            console.error(`Failed to connect to peer ${peer.id}:`, error);
        }
    }

    handlePeerConnected(peerId, connection) {
        console.log(`Connected to peer: ${peerId}`);
        this.emit('peerConnected', peerId, connection);
    }

    handlePeerDisconnected(peerId) {
        console.log(`Disconnected from peer: ${peerId}`);
        this.peers.delete(peerId);
        this.emit('peerDisconnected', peerId);
    }

    handleMessage(message) {
        // Route messages if needed
        if (message.to !== this.nodeId) {
            this.routeMessage(message);
        } else {
            // Message is for this node
            this.emit('message', message);
        }
    }

    async routeMessage(message) {
        const nextHop = this.findNextHop(message.to);
        if (nextHop) {
            try {
                await this.communication.sendMessage(nextHop, message);
            } catch (error) {
                console.error(`Failed to route message to ${message.to}:`, error);
                this.routes.delete(message.to);
            }
        } else {
            console.log(`No route to ${message.to}`);
        }
    }

    findNextHop(destinationId) {
        // Simple routing: direct connection or known route
        if (this.communication.getConnection(destinationId)) {
            return destinationId;
        }
        
        // Find the closest peer (simplified Kademlia routing)
        let closestPeer = null;
        let minDistance = Infinity;
        
        for (const peerId of this.communication.getConnectedPeers()) {
            const distance = this.calculateDistance(peerId, destinationId);
            if (distance < minDistance) {
                minDistance = distance;
                closestPeer = peerId;
            }
        }
        
        return closestPeer;
    }

    calculateDistance(id1, id2) {
        // XOR distance for Kademlia-style routing
        const buf1 = Buffer.from(id1, 'hex');
        const buf2 = Buffer.from(id2, 'hex');
        
        let distance = 0;
        for (let i = 0; i < buf1.length && i < buf2.length; i++) {
            distance |= buf1[i] ^ buf2[i];
        }
        
        return distance;
    }

    async sendMessage(destinationId, message) {
        try {
            await this.communication.sendMessage(destinationId, message);
            this.emit('messageSent', {
                to: destinationId,
                message: message,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error(`Failed to send message to ${destinationId}:`, error);
            throw error;
        }
    }

    async broadcast(message, exclude = []) {
        const promises = [];
        
        for (const peerId of this.communication.getConnectedPeers()) {
            if (!exclude.includes(peerId)) {
                promises.push(this.sendMessage(peerId, {
                    type: 'broadcast',
                    from: this.nodeId,
                    payload: message,
                    timestamp: Date.now()
                }));
            }
        }
        
        await Promise.allSettled(promises);
    }

    getPeers() {
        return Array.from(this.peers.values());
    }

    getConnectedPeers() {
        return this.communication.getConnectedPeers();
    }

    getStats() {
        return {
            nodeId: this.nodeId,
            peers: this.peers.size,
            connectedPeers: this.communication.getConnectedPeers().length,
            routes: this.routes.size,
            uptime: process.uptime(),
            isRunning: this.isRunning
        };
    }

    startCleanupTasks() {
        const cleanup = () => {
            if (!this.isRunning) return;
            
            // Cleanup inactive peers
            const now = Date.now();
            for (const [peerId, peer] of this.peers) {
                if (now - peer.lastSeen > 300000) { // 5 minutes
                    this.communication.disconnect(peerId);
                }
            }
            
            // Cleanup communication
            this.communication.cleanup();
            
            // Schedule next cleanup
            setTimeout(cleanup, 60000); // 1 minute
        };
        
        setTimeout(cleanup, 60000);
    }

    generateNodeId() {
        return crypto.randomBytes(32).toString('hex');
    }
}

module.exports = P2PNode;