const dgram = require('dgram');
const EventEmitter = require('events');

class UDPTransport extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 0;
    this.socket = null;
    this.isListening = false;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket('udp4');
      
      this.socket.on('message', (msg, rinfo) => {
        this.emit('message', {
          type: 'udp',
          from: `${rinfo.address}:${rinfo.port}`,
          data: msg.toString(),
          rinfo: rinfo
        });
      });

      this.socket.on('error', (err) => {
        console.error('UDP: Socket error:', err);
        this.emit('error', err);
      });

      this.socket.on('listening', () => {
        const address = this.socket.address();
        this.port = address.port;
        this.isListening = true;
        console.log(`UDP server listening on ${address.address}:${address.port}`);
        resolve(address);
      });

      this.socket.bind(this.port);
    });
  }

  async sendMessage(host, port, message) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('UDP socket not initialized'));
      }

      const buffer = Buffer.isBuffer(message) ? message : Buffer.from(message);
      
      this.socket.send(buffer, port, host, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`UDP: Message sent to ${host}:${port}`);
          resolve();
        }
      });
    });
  }

  async broadcastMessage(message, peers) {
    const promises = [];
    
    for (const peer of peers) {
      if (peer.host && peer.port) {
        promises.push(this.sendMessage(peer.host, peer.port, message));
      }
    }
    
    await Promise.allSettled(promises);
  }

  getAddress() {
    if (this.socket && this.isListening) {
      return this.socket.address();
    }
    return null;
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.close(() => {
          this.isListening = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = UDPTransport;