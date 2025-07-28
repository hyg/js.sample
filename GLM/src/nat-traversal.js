const dgram = require('dgram');
const stun = require('stun');

class NATTraversal {
    constructor() {
        this.publicAddress = null;
        this.publicPort = null;
        this.natType = null;
        this.udpSocket = null;
    }

    async discoverPublicAddress() {
        // Simplified NAT discovery - in a real implementation
        // you would use the STUN protocol properly
        // For now, we'll simulate it
        
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                this.publicAddress = '127.0.0.1';
                this.publicPort = this.config?.port || 6881;
                this.natType = 'No NAT';
                
                resolve({
                    address: this.publicAddress,
                    port: this.publicPort,
                    natType: this.natType
                });
            }, 1000);
        });
    }

    detectNATType(stunResponse) {
        if (stunResponse.attrs && stunResponse.attrs[stun.attrs.MAPPED_ADDRESS]) {
            const mapped = stunResponse.attrs[stun.attrs.MAPPED_ADDRESS];
            
            if (this.publicAddress === mapped.address && this.publicPort === mapped.port) {
                this.natType = 'No NAT';
            } else if (this.publicPort === mapped.port) {
                this.natType = 'Cone NAT';
            } else {
                this.natType = 'Symmetric NAT';
            }
        } else {
            this.natType = 'Unknown';
        }
    }

    async createHolePunchingSession(targetPeer) {
        const session = {
            local: await this.discoverPublicAddress(),
            remote: targetPeer,
            connections: []
        };
        
        if (this.natType === 'Symmetric NAT' || targetPeer.natType === 'Symmetric NAT') {
            return await this.symmetricNATTraversal(session);
        } else {
            return await this.coneNATTraversal(session);
        }
    }

    async coneNATTraversal(session) {
        const socket = dgram.createSocket('udp4');
        
        socket.on('error', (error) => {
            console.error('UDP socket error:', error);
        });
        
        socket.on('message', (msg, rinfo) => {
            console.log(`Received message from ${rinfo.address}:${rinfo.port}`);
        });
        
        socket.bind(0);
        
        const localPort = socket.address().port;
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                socket.close();
                reject(new Error('Hole punching timeout'));
            }, 10000);
            
            // Send punch packets to remote peer
            const punchPacket = Buffer.from('PUNCH');
            const punchInterval = setInterval(() => {
                socket.send(punchPacket, 0, punchPacket.length, session.remote.port, session.remote.address);
            }, 100);
            
            socket.on('message', (msg, rinfo) => {
                if (msg.toString() === 'PUNCH_ACK' && rinfo.address === session.remote.address) {
                    clearTimeout(timeout);
                    clearInterval(punchInterval);
                    
                    resolve({
                        type: 'udp',
                        socket: socket,
                        localPort: localPort,
                        remoteAddress: session.remote.address,
                        remotePort: session.remote.port
                    });
                }
            });
        });
    }

    async symmetricNATTraversal(session) {
        // For symmetric NAT, we need to use a relay or TURN server
        // This is a simplified implementation
        console.log('Symmetric NAT detected - using fallback method');
        
        const socket = dgram.createSocket('udp4');
        socket.bind(0);
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                socket.close();
                reject(new Error('Symmetric NAT traversal failed'));
            }, 15000);
            
            // Try multiple ports for symmetric NAT
            const portsToTry = [
                session.remote.port,
                session.remote.port + 1,
                session.remote.port - 1,
                session.remote.port + 2,
                session.remote.port - 2
            ];
            
            let attempt = 0;
            const tryPort = () => {
                if (attempt >= portsToTry.length) {
                    clearTimeout(timeout);
                    reject(new Error('All ports tried'));
                    return;
                }
                
                const port = portsToTry[attempt];
                const punchPacket = Buffer.from('PUNCH_SYM');
                
                socket.send(punchPacket, 0, punchPacket.length, port, session.remote.address);
                attempt++;
                
                setTimeout(tryPort, 500);
            };
            
            socket.on('message', (msg, rinfo) => {
                if (msg.toString() === 'PUNCH_SYM_ACK') {
                    clearTimeout(timeout);
                    resolve({
                        type: 'udp',
                        socket: socket,
                        localPort: socket.address().port,
                        remoteAddress: rinfo.address,
                        remotePort: rinfo.port
                    });
                }
            });
            
            tryPort();
        });
    }

    getPublicEndpoint() {
        return {
            address: this.publicAddress,
            port: this.publicPort,
            natType: this.natType
        };
    }
}

module.exports = NATTraversal;