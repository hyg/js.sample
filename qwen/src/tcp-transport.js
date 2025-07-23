const net = require('net');
const EventEmitter = require('events');

class TCPTransport extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 0;
    this.server = null;
    this.connections = new Map();
    this.isListening = false;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log('TCP: New connection from', remoteAddress);
        
        this.connections.set(remoteAddress, socket);
        
        socket.on('data', (data) => {
          this.emit('message', {
            type: 'tcp',
            from: remoteAddress,
            data: data.toString()
          });
        });

        socket.on('close', () => {
          console.log('TCP: Connection closed from', remoteAddress);
          this.connections.delete(remoteAddress);
        });

        socket.on('error', (err) => {
          console.error('TCP: Socket error:', err);
          this.connections.delete(remoteAddress);
        });
      });

      this.server.listen(this.port, () => {
        const address = this.server.address();
        this.port = address.port;
        this.isListening = true;
        console.log(`TCP server listening on port ${this.port}`);
        resolve(address);
      });

      this.server.on('error', reject);
    });
  }

  async sendMessage(host, port, message) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const address = `${host}:${port}`;
      
      socket.connect(port, host, () => {
        console.log('TCP: Connected to', address);
        socket.write(message);
        socket.end();
        resolve();
      });

      socket.on('error', reject);
      
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error('TCP connection timeout'));
      });
    });
  }

  async broadcastMessage(message, exclude = []) {
    const promises = [];
    
    for (const [address, socket] of this.connections) {
      if (exclude.includes(address)) continue;
      
      if (socket.writable) {
        promises.push(new Promise((resolve) => {
          socket.write(message, () => resolve());
        }));
      }
    }
    
    await Promise.allSettled(promises);
  }

  getConnections() {
    return Array.from(this.connections.keys());
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isListening = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = TCPTransport;