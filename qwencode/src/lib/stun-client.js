/**
 * STUN client module for P2P DHT node
 * Handles STUN server interactions for address discovery
 */

const dgram = require('dgram');
const { EventEmitter } = require('events');
const crypto = require('crypto');

/**
 * STUN client class
 * Handles communication with STUN servers for address discovery
 */
class StunClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.stunServers = options.stunServers || [
      'stun:fwa.lifesizecloud.com:3478',
      'stun:stun.isp.net.au:3478',
      'stun:stun.freeswitch.org:3478',
      'stun:stun.voip.blackberry.com:3478'
    ];
    this.timeout = options.timeout || 5000;
    this.debug = options.debug || false;
  }

  /**
   * Parse STUN response to extract public IP and port
   * @param {Buffer} response - Raw STUN response
   * @returns {Object|null} Parsed address information or null if parsing failed
   */
  parseStunResponse(response) {
    try {
      // STUN message format:
      // 0                   1                   2                   3
      // 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
      // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
      // |0 0| messageType |         message length        |   magic cookie|
      // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
      // |                         transaction id                        |
      // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
      // |                 attributes (variable length)                  |
      // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

      // Check if response is valid STUN message
      if (response.length < 20) {
        return null;
      }

      // Parse STUN header
      const messageType = response.readUInt16BE(0);
      const messageLength = response.readUInt16BE(2);
      const magicCookie = response.readUInt32BE(4);
      
      // Validate STUN message
      if ((messageType & 0xC000) !== 0x0000) {
        // Not a standard STUN message
        return null;
      }
      
      // Validate message length and size
      if (messageLength + 20 !== response.length) {
        return null;
      }

      // Extract mapped address (attribute 0x0001)
      let offset = 20; // Start after header
      
      while (offset + 4 <= response.length) {
        const attributeType = response.readUInt16BE(offset);
        const attributeLength = response.readUInt16BE(offset + 2);
        
        if (attributeType === 0x0001) {
          // MAPPED_ADDRESS attribute
          if (attributeLength >= 8) {
            const family = response[offset + 4];
            const port = response.readUInt16BE(offset + 6);
            const ipBytes = [];
            
            // IPv4 address (family 1)
            if (family === 1) {
              for (let i = 0; i < 4; i++) {
                ipBytes.push(response[offset + 8 + i]);
              }
              const ipAddress = ipBytes.join('.');
              
              return {
                ipAddress,
                port,
                family: 'IPv4'
              };
            }
            // IPv6 address (family 2) - not currently supported
            else if (family === 2) {
              return null;
            }
          }
        }
        
        // Move to next attribute (align to 4-byte boundary)
        offset += 4 + attributeLength;
        if (offset % 4 !== 0) {
          offset += 4 - (offset % 4);
        }
      }
      
      return null;
    } catch (error) {
      if (this.debug) {
        console.error('Error parsing STUN response:', error.message);
      }
      return null;
    }
  }

  /**
   * Create STUN binding request message
   * @param {Buffer} transactionId - Transaction ID for request
   * @returns {Buffer} STUN binding request message
   */
  createStunBindingRequest(transactionId) {
    // STUN Binding Request format (RFC 5389):
    // 0                   1                   2                   3
    // 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |0 0| messageType |         message length        |   magic cookie|
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                         transaction id                        |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                 attributes (variable length)                  |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

    const message = Buffer.alloc(20);
    
    // Message Type: Binding Request (0x0001)
    message.writeUInt16BE(0x0001, 0);
    
    // Message Length: 0 (no attributes)
    message.writeUInt16BE(0, 2);
    
    // Magic Cookie: 0x2112A442
    message.writeUInt32BE(0x2112A442, 4);
    
    // Transaction ID (copy from parameter)
    if (transactionId && transactionId.length >= 12) {
      transactionId.copy(message, 8, 0, 12);
    } else {
      // Generate random transaction ID if not provided
      crypto.randomFillSync(message.slice(8, 20));
    }
    
    // Update message length (header size 20 bytes, no attributes)
    message.writeUInt16BE(0, 2);
    
    return message;
  }

  /**
   * Get public address using STUN server
   * @param {string} stunServer - STUN server address in format 'host:port'
   * @returns {Promise<Object>} Promise resolving to public address information
   */
  async getPublicAddress(stunServer) {
    return new Promise((resolve, reject) => {
      const [host, portStr] = stunServer.split(':');
      const port = parseInt(portStr, 10);
      
      if (!host || !port) {
        reject(new Error(`Invalid STUN server format: ${stunServer}`));
        return;
      }

      const client = dgram.createSocket('udp4');
      let responded = false;

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!responded) {
          client.close();
          reject(new Error(`STUN request to ${stunServer} timed out`));
        }
      }, this.timeout);

      // Handle incoming response
      client.on('message', (response) => {
        responded = true;
        clearTimeout(timeoutId);
        client.close();
        
        try {
          const addressInfo = this.parseStunResponse(response);
          if (addressInfo) {
            resolve({
              ...addressInfo,
              stunServer: stunServer
            });
          } else {
            reject(new Error('Failed to parse STUN response'));
          }
        } catch (error) {
          reject(new Error(`Error processing STUN response: ${error.message}`));
        }
      });

      // Handle errors
      client.on('error', (error) => {
        if (!responded) {
          clearTimeout(timeoutId);
          client.close();
          reject(new Error(`STUN client error for ${stunServer}: ${error.message}`));
        }
      });

      // Send STUN request
      try {
        const transactionId = crypto.randomBytes(12);
        const request = this.createStunBindingRequest(transactionId);
        client.send(request, 0, request.length, port, host, (err) => {
          if (err) {
            clearTimeout(timeoutId);
            client.close();
            reject(new Error(`Failed to send STUN request to ${stunServer}: ${err.message}`));
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        client.close();
        reject(new Error(`Error creating STUN request: ${error.message}`));
      }
    });
  }

  /**
   * Discover public address using multiple STUN servers
   * @returns {Promise<Object>} Promise resolving to public address information
   */
  async discoverPublicAddress() {
    if (this.debug) {
      console.log('Starting STUN address discovery with servers:', this.stunServers);
    }

    // Try servers in order until one succeeds
    for (const server of this.stunServers) {
      try {
        if (this.debug) {
          console.log(`Attempting STUN discovery with server: ${server}`);
        }
        
        const address = await this.getPublicAddress(server);
        if (this.debug) {
          console.log('STUN discovery successful:', address);
        }
        
        this.emit('addressDiscovered', address);
        return address;
      } catch (error) {
        if (this.debug) {
          console.warn(`STUN discovery failed for ${server}:`, error.message);
        }
        // Continue to next server
        continue;
      }
    }

    // If no servers worked, throw error
    throw new Error('Failed to discover public address with any STUN server');
  }

  /**
   * Get multiple STUN servers for redundancy
   * @returns {Array} Array of STUN server addresses
   */
  getStunServers() {
    return [...this.stunServers]; // Return a copy
  }

  /**
   * Add a STUN server to the list
   * @param {string} server - STUN server address in format 'host:port'
   * @returns {boolean} True if server was added
   */
  addStunServer(server) {
    if (!server.includes(':')) {
      return false;
    }
    
    // Check if server already exists
    if (!this.stunServers.includes(server)) {
      this.stunServers.push(server);
      return true;
    }
    
    return false;
  }
}

module.exports = StunClient;