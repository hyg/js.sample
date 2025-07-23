const natUpnp = require('nat-upnp');
const ip = require('ip');

class NATManager {
  constructor(options = {}) {
    this.client = natUpnp.createClient();
    this.enabled = options.natTraversal !== false;
    this.mappings = new Map();
    this.localIP = ip.address();
  }

  async setupPortMapping(protocol, localPort, externalPort, description = 'P2P Node') {
    if (!this.enabled) {
      console.log('NAT traversal disabled');
      return null;
    }

    try {
      const mapping = await new Promise((resolve, reject) => {
        this.client.portMapping({
          public: externalPort || localPort,
          private: localPort,
          protocol: protocol.toLowerCase(),
          description: `${description} ${protocol}`,
          ttl: 3600 // 1小时TTL
        }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              protocol,
              localPort,
              externalPort: externalPort || localPort,
              description
            });
          }
        });
      });

      const key = `${protocol}:${localPort}`;
      this.mappings.set(key, mapping);
      
      console.log(`✓ ${protocol} port ${localPort} mapped to external port ${mapping.externalPort}`);
      return mapping;
      
    } catch (error) {
      console.warn(`⚠ Failed to map ${protocol} port ${localPort}:`, error.message);
      return null;
    }
  }

  async getExternalIP() {
    try {
      const response = await new Promise((resolve, reject) => {
        this.client.externalIp((err, ip) => {
          if (err) reject(err);
          else resolve(ip);
        });
      });
      
      console.log('✓ External IP:', response);
      return response;
    } catch (error) {
      console.warn('⚠ Failed to get external IP:', error.message);
      return null;
    }
  }

  async setupMappings(ports) {
    const results = {};
    
    for (const [protocol, port] of Object.entries(ports)) {
      if (port) {
        const mapping = await this.setupPortMapping(protocol.toUpperCase(), port);
        if (mapping) {
          results[protocol] = mapping;
        }
      }
    }

    return results;
  }

  async removePortMapping(protocol, port) {
    const key = `${protocol}:${port}`;
    if (this.mappings.has(key)) {
      return new Promise((resolve, reject) => {
        this.client.portUnmapping({
          public: port,
          protocol: protocol.toLowerCase()
        }, (err) => {
          if (err) reject(err);
          else {
            this.mappings.delete(key);
            console.log(`✓ Removed ${protocol} port mapping for ${port}`);
            resolve();
          }
        });
      });
    }
  }

  async cleanup() {
    console.log('Cleaning up NAT mappings...');
    const promises = [];
    
    for (const [key, mapping] of this.mappings) {
      promises.push(this.removePortMapping(mapping.protocol, mapping.externalPort));
    }
    
    await Promise.allSettled(promises);
    this.client.close();
  }

  getMappings() {
    return Array.from(this.mappings.values());
  }
}

module.exports = NATManager;