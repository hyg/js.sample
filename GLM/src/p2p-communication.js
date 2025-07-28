const EventEmitter = require('events');
const crypto = require('crypto');
const SecurityManager = require('./security');

class P2PCommunication extends EventEmitter {
    constructor(nodeId) {
        super();
        this.nodeId = nodeId;
        this.security = new SecurityManager();
        this.connections = new Map();
        this.messageQueue = new Map();
        this.maxRetries = 3;
        this.messageTimeout = 30000;
    }

    async connect(peerId, peerInfo) {
        try {
            const connection = await this.establishConnection(peerId, peerInfo);
            this.connections.set(peerId, connection);
            this.emit('peerConnected', peerId, connection);
            return connection;
        } catch (error) {
            console.error(`Failed to connect to peer ${peerId}:`, error);
            throw error;
        }
    }

    async establishConnection(peerId, peerInfo) {
        const handshake = this.security.createHandshakeMessage();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);
            
            // Simulate connection establishment
            const connection = {
                peerId: peerId,
                peerInfo: peerInfo,
                state: 'connecting',
                lastActivity: Date.now(),
                sendMessage: async (message) => {
                    return await this.sendMessage(peerId, message);
                }
            };
            
            // In a real implementation, you would perform the actual
            // handshake and connection establishment here
            setTimeout(() => {
                clearTimeout(timeout);
                connection.state = 'connected';
                resolve(connection);
            }, 1000);
        });
    }

    async sendMessage(peerId, message) {
        const connection = this.connections.get(peerId);
        if (!connection) {
            throw new Error(`No connection to peer ${peerId}`);
        }
        
        const encryptedMessage = this.encryptMessage(message);
        const messageId = this.generateMessageId();
        
        const messagePacket = {
            id: messageId,
            from: this.nodeId,
            to: peerId,
            type: 'message',
            payload: encryptedMessage,
            timestamp: Date.now()
        };
        
        const signature = this.security.sign(JSON.stringify(messagePacket));
        messagePacket.signature = signature;
        
        return await this.sendWithRetry(peerId, messagePacket);
    }

    encryptMessage(message) {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        
        if (messageStr.length < 128) {
            // For small messages, use asymmetric encryption
            return this.security.encrypt(messageStr, this.security.getPublicKey());
        } else {
            // For larger messages, use symmetric encryption with key exchange
            const sessionKey = this.security.generateSessionKey(this.nodeId);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-cbc', sessionKey);
            
            let encrypted = cipher.update(messageStr, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            return {
                type: 'symmetric',
                iv: iv.toString('hex'),
                encrypted: encrypted,
                keyExchange: this.security.encrypt(sessionKey.toString('hex'), this.security.getPublicKey())
            };
        }
    }

    decryptMessage(encryptedMessage, fromPeerId) {
        if (typeof encryptedMessage === 'string') {
            return this.security.decrypt(encryptedMessage);
        } else if (encryptedMessage.type === 'symmetric') {
            const sessionKeyHex = this.security.decrypt(encryptedMessage.keyExchange);
            const sessionKey = Buffer.from(sessionKeyHex, 'hex');
            
            const decipher = crypto.createDecipher('aes-256-cbc', sessionKey);
            const iv = Buffer.from(encryptedMessage.iv, 'hex');
            
            let decrypted = decipher.update(encryptedMessage.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        }
        
        throw new Error('Unknown message encryption type');
    }

    async sendWithRetry(peerId, messagePacket) {
        let attempts = 0;
        
        while (attempts < this.maxRetries) {
            try {
                await this.sendPacket(peerId, messagePacket);
                return { success: true, messageId: messagePacket.id };
            } catch (error) {
                attempts++;
                if (attempts >= this.maxRetries) {
                    throw error;
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
            }
        }
    }

    async sendPacket(peerId, messagePacket) {
        const connection = this.connections.get(peerId);
        if (!connection) {
            throw new Error(`No connection to peer ${peerId}`);
        }
        
        // In a real implementation, this would send the packet over the network
        // For now, we'll simulate it
        connection.lastActivity = Date.now();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Packet send timeout'));
            }, 5000);
            
            // Simulate packet sending
            setTimeout(() => {
                clearTimeout(timeout);
                resolve();
            }, 100);
        });
    }

    handleMessage(messagePacket) {
        try {
            const isValid = this.verifyMessage(messagePacket);
            if (!isValid) {
                throw new Error('Invalid message signature');
            }
            
            const decrypted = this.decryptMessage(messagePacket.payload, messagePacket.from);
            const message = JSON.parse(decrypted);
            
            this.emit('message', {
                from: messagePacket.from,
                to: messagePacket.to,
                messageId: messagePacket.id,
                timestamp: messagePacket.timestamp,
                payload: message
            });
            
            // Send acknowledgment
            this.sendAck(messagePacket.from, messagePacket.id);
            
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    verifyMessage(messagePacket) {
        if (!messagePacket.signature) {
            return false;
        }
        
        const messageCopy = { ...messagePacket };
        delete messageCopy.signature;
        
        return this.security.verify(
            JSON.stringify(messageCopy),
            messagePacket.signature,
            this.security.getPublicKey()
        );
    }

    async sendAck(peerId, messageId) {
        const ackPacket = {
            id: this.generateMessageId(),
            from: this.nodeId,
            to: peerId,
            type: 'ack',
            originalMessageId: messageId,
            timestamp: Date.now()
        };
        
        try {
            await this.sendPacket(peerId, ackPacket);
        } catch (error) {
            console.error('Failed to send ack:', error);
        }
    }

    generateMessageId() {
        return crypto.randomBytes(16).toString('hex');
    }

    disconnect(peerId) {
        const connection = this.connections.get(peerId);
        if (connection) {
            this.connections.delete(peerId);
            this.emit('peerDisconnected', peerId);
        }
    }

    getConnectedPeers() {
        return Array.from(this.connections.keys());
    }

    getConnection(peerId) {
        return this.connections.get(peerId);
    }

    cleanup() {
        const now = Date.now();
        for (const [peerId, connection] of this.connections) {
            if (now - connection.lastActivity > 300000) { // 5 minutes
                this.disconnect(peerId);
            }
        }
    }
}

module.exports = P2PCommunication;