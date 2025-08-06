// lib/stunClient.js

const dgram = require('dgram');

/**
 * A simple STUN client to discover public IP and port.
 * This is a basic implementation for demonstration.
 * For production, consider using a robust library like 'stun-js' or 'node-stun'.
 */
class StunClient {
  /**
   * Creates a new StunClient instance.
   * @param {Object} options - Configuration options.
   * @param {string} options.stunHost - The STUN server hostname.
   * @param {number} options.stunPort - The STUN server port.
   * @param {number} [options.timeout=5000] - Timeout for STUN request in ms.
   */
  constructor(options) {
    this.stunHost = options.stunHost;
    this.stunPort = options.stunPort;
    this.timeout = options.timeout || 5000;
  }

  /**
   * Sends a STUN Binding Request and retrieves the Mapped Address.
   * @returns {Promise<Object>} A promise that resolves with the public IP and port.
   */
  async getMappedAddress() {
    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket('udp4');
      let timer;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        try {
          socket.close();
        } catch (err) {
          // Ignore errors on close
        }
      };

      socket.on('message', (msg, rinfo) => {
        cleanup();
        try {
          // Parse STUN response (simplified)
          // This is a very basic parser and NOT compliant with full RFC 5389.
          // It assumes the MAPPED-ADDRESS is in the standard location.
          // Format:
          // - 2 bytes: Message Type (0x0101 for Binding Success Response)
          // - 2 bytes: Message Length
          // - 4 bytes: Magic Cookie
          // - 12 bytes: Transaction ID
          // - Attributes follow...
          // MAPPED-ADDRESS Attribute:
          // - 2 bytes: Type (0x0001)
          // - 2 bytes: Length (8)
          // - 1 byte: Reserved
          // - 1 byte: Address Family (0x01 for IPv4)
          // - 2 bytes: Port (network byte order)
          // - 4 bytes: IP Address (network byte order)

          if (msg.length < 20) {
            reject(new Error('Invalid STUN response length'));
            return;
          }

          const messageType = msg.readUInt16BE(0);
          if (messageType !== 0x0101) { // Binding Success Response
            reject(new Error(`Unexpected STUN message type: 0x${messageType.toString(16)}`));
            return;
          }

          // Find MAPPED-ADDRESS attribute (type 0x0001)
          let offset = 20; // Start after header
          while (offset < msg.length) {
            if (msg.length < offset + 4) {
              break; // Not enough data for attribute header
            }
            const attrType = msg.readUInt16BE(offset);
            const attrLength = msg.readUInt16BE(offset + 2);
            if (msg.length < offset + 4 + attrLength) {
              break; // Not enough data for attribute value
            }

            if (attrType === 0x0001) { // MAPPED-ADDRESS
              if (attrLength >= 8) {
                const family = msg.readUInt8(offset + 5);
                if (family === 0x01) { // IPv4
                  const port = msg.readUInt16BE(offset + 6);
                  const ipBytes = msg.slice(offset + 8, offset + 12);
                  const ip = `${ipBytes[0]}.${ipBytes[1]}.${ipBytes[2]}.${ipBytes[3]}`;
                  resolve({ ip, port });
                  return;
                }
              }
            }
            // Move to next attribute, padding to a multiple of 4 bytes
            offset += 4 + Math.ceil(attrLength / 4) * 4;
          }
          reject(new Error('MAPPED-ADDRESS not found in STUN response'));
        } catch (err) {
          reject(err);
        }
      });

      socket.on('error', (err) => {
        cleanup();
        reject(err);
      });

      // Create a basic STUN Binding Request
      // Message Type: 0x0001 (Binding Request)
      // Message Length: 0 (no attributes)
      // Magic Cookie: 0x2112A442
      // Transaction ID: 12 random bytes
      const request = Buffer.alloc(20);
      request.writeUInt16BE(0x0001, 0); // Message Type
      request.writeUInt16BE(0x0000, 2); // Message Length
      request.writeUInt32BE(0x2112A442, 4); // Magic Cookie
      // Fill Transaction ID with random bytes
      for (let i = 8; i < 20; i++) {
        request[i] = Math.floor(Math.random() * 256);
      }

      timer = setTimeout(() => {
        cleanup();
        reject(new Error('STUN request timeout'));
      }, this.timeout);

      socket.send(request, this.stunPort, this.stunHost, (err) => {
        if (err) {
          cleanup();
          reject(err);
        }
      });
    });
  }
}

module.exports = StunClient;