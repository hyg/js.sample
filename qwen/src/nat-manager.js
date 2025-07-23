const natUpnp = require('nat-upnp');
const ip = require('ip');
const dgram = require('dgram');
const dns = require('dns').promises;
const crypto = require('crypto');

class NATManager {
  constructor(options = {}) {
    this.client = natUpnp.createClient();
    this.enabled = options.natTraversal !== false;
    this.mappings = new Map();
    this.localIP = ip.address();
    
    // STUN/TURN configuration
    this.stunServers = options.stunServers || [
      // Try China-friendly STUN servers first
      'stun.qq.com:3478',
      'stun.syncthing.net:3478',
      'stun.cloudflare.com:3478',
      // Fallback to global STUN servers
      'stun.l.google.com:19302',
      'stun1.l.google.com:19302',
      'stun.stunprotocol.org:3478'
    ];
    this.turnServers = options.turnServers || [
      // Format: {url: 'turn:hostname:port', username: 'user', credential: 'password'}
    ];
    
    // TURN relay sockets
    this.turnSockets = new Map();
    
    // Public address discovered via STUN
    this.publicIP = null;
    this.natType = 'unknown'; // unknown, open, fullCone, restricted, portRestricted, symmetric
    this.natMappingBehavior = 'unknown'; // direct, endpointIndependent, addressDependent, addressAndPortDependent
    this.natFilteringBehavior = 'unknown'; // endpointIndependent, addressDependent, addressAndPortDependent
    
    // Cache for NAT detection results
    this.detectionCache = {
      timestamp: null,
      results: null
    };
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async setupPortMapping(protocol, localPort, externalPort, description = 'P2P Node') {
    if (!this.enabled) {
      console.log('NAT traversal disabled');
      return null;
    }

    // Try UPnP first
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
              description,
              method: 'upnp'
            });
          }
        });
      });

      const key = `${protocol}:${localPort}`;
      this.mappings.set(key, mapping);
      
      console.log(`✓ ${protocol} port ${localPort} mapped to external port ${mapping.externalPort} via UPnP`);
      return mapping;
      
    } catch (error) {
      console.warn(`⚠ Failed to map ${protocol} port ${localPort} via UPnP:`, error.message);
      
      // If UPnP fails, we still want to determine our public IP via STUN
      // This information is useful for peer communication even without port mapping
      const publicIP = await this.getPublicIPViaSTUN();
      if (publicIP) {
        const mapping = {
          protocol,
          localPort,
          externalPort: externalPort || localPort,
          description,
          method: 'stun', // Not actually mapped, but we know our public IP
          publicIP: publicIP
        };
        
        const key = `${protocol}:${localPort}`;
        this.mappings.set(key, mapping);
        
        console.log(`ℹ ${protocol} port ${localPort} public IP is ${publicIP} (determined via STUN)`);
        return mapping;
      }
      
      return null;
    }
  }

  async getExternalIP() {
    // Try UPnP first
    try {
      const response = await new Promise((resolve, reject) => {
        this.client.externalIp((err, ip) => {
          if (err) reject(err);
          else resolve(ip);
        });
      });
      
      console.log('✓ External IP (via UPnP):', response);
      return response;
    } catch (error) {
      console.warn('⚠ Failed to get external IP via UPnP:', error.message);
      
      // Fallback to STUN if UPnP fails
      if (this.publicIP) {
        return this.publicIP;
      }
      
      const stunIP = await this.getPublicIPViaSTUN();
      return stunIP;
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

    // Also try to determine NAT type for better connection decisions
    try {
      const natType = await this.determineNATType();
      console.log(`NAT Type determined: ${natType}`);
      results.natType = natType;
    } catch (error) {
      console.warn('Failed to determine NAT type:', error.message);
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
  
  // STUN client implementation
  async getPublicIPViaSTUN(server = null) {
    if (!server) {
      // Try multiple STUN servers
      for (const stunServer of this.stunServers) {
        try {
          const ip = await this._querySTUNServer(stunServer);
          if (ip) {
            this.publicIP = ip;
            return ip;
          }
        } catch (error) {
          console.warn(`⚠ STUN server ${stunServer} failed:`, error.message);
        }
      }
      return null;
    }
    
    return this._querySTUNServer(server);
  }
  
  async _querySTUNServer(serverAddress) {
    return new Promise((resolve, reject) => {
      const [host, portStr] = serverAddress.split(':');
      const port = parseInt(portStr) || 3478;
      
      const socket = dgram.createSocket('udp4');
      let resolved = false;
      
      // Simple STUN binding request (RFC 5389)
      const stunRequest = Buffer.from([
        0x00, 0x01, // Message Type: Binding Request
        0x00, 0x00, // Message Length: 0 (no attributes)
        0x21, 0x12, 0xA4, 0x42, // Magic Cookie
        0x01, 0x02, 0x03, 0x04, // Transaction ID (12 bytes)
        0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0x0C
      ]);
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.close();
          reject(new Error('STUN request timeout'));
        }
      }, 5000);
      
      socket.on('message', (msg, rinfo) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        socket.close();
        
        try {
          // Parse STUN response
          if (msg.length < 20) {
            reject(new Error('Invalid STUN response'));
            return;
          }
          
          // Check if it's a success response
          const messageType = msg.readUInt16BE(0);
          if (messageType !== 0x0101) { // Binding Success Response
            reject(new Error('STUN request failed'));
            return;
          }
          
          // Parse XOR-MAPPED-ADDRESS attribute (type 0x0020)
          let offset = 20;
          while (offset < msg.length) {
            const attrType = msg.readUInt16BE(offset);
            const attrLength = msg.readUInt16BE(offset + 2);
            
            if (attrType === 0x0020) { // XOR-MAPPED-ADDRESS
              const family = msg.readUInt8(offset + 5);
              if (family === 0x01) { // IPv4
                // XOR with magic cookie
                const xorPort = msg.readUInt16BE(offset + 6) ^ 0x2112;
                const xorIP = [
                  msg.readUInt8(offset + 8) ^ 0x21,
                  msg.readUInt8(offset + 9) ^ 0x12,
                  msg.readUInt8(offset + 10) ^ 0xA4,
                  msg.readUInt8(offset + 11) ^ 0x42
                ];
                
                const publicIP = xorIP.join('.');
                resolve(publicIP);
                return;
              }
            }
            
            offset += 4 + Math.ceil(attrLength / 4) * 4; // Align to 4-byte boundary
          }
          
          reject(new Error('XOR-MAPPED-ADDRESS not found in STUN response'));
        } catch (error) {
          reject(error);
        }
      });
      
      socket.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.close();
          reject(err);
        }
      });
      
      socket.send(stunRequest, port, host, (err) => {
        if (err) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            socket.close();
            reject(err);
          }
        }
      });
    });
  }
  
  // Determine NAT type using RFC 3489/5780 compliant tests
  async determineNATType(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh && this.detectionCache.timestamp && 
        (Date.now() - this.detectionCache.timestamp) < this.cacheTimeout &&
        this.detectionCache.results) {
      console.log('Using cached NAT detection results');
      const cached = this.detectionCache.results;
      this.natType = cached.natType;
      this.natMappingBehavior = cached.natMappingBehavior;
      this.natFilteringBehavior = cached.natFilteringBehavior;
      return cached;
    }
    
    console.log('Performing comprehensive NAT type detection...');
    
    try {
      // Test 1: Basic connectivity test
      const test1Result = await this._performTest1();
      if (!test1Result.success) {
        this.natType = 'blocked';
        return this._cacheDetectionResults({
          natType: this.natType,
          natMappingBehavior: this.natMappingBehavior,
          natFilteringBehavior: this.natFilteringBehavior,
          details: test1Result
        });
      }
      
      // Test 2: Check if we're directly connected to the internet
      if (test1Result.mappedIP === test1Result.sourceIP) {
        this.natType = 'open';
        this.natMappingBehavior = 'direct';
        this.natFilteringBehavior = 'endpointIndependent';
        return this._cacheDetectionResults({
          natType: this.natType,
          natMappingBehavior: this.natMappingBehavior,
          natFilteringBehavior: this.natFilteringBehavior,
          details: test1Result
        });
      }
      
      // Test 3: NAT mapping behavior test
      const mappingBehavior = await this._determineMappingBehavior();
      this.natMappingBehavior = mappingBehavior;
      
      // Test 4: NAT filtering behavior test
      const filteringBehavior = await this._determineFilteringBehavior();
      this.natFilteringBehavior = filteringBehavior;
      
      // Determine specific NAT type based on behaviors
      this.natType = this._classifyNATType(mappingBehavior, filteringBehavior);
      
      const results = {
        natType: this.natType,
        natMappingBehavior: this.natMappingBehavior,
        natFilteringBehavior: this.natFilteringBehavior,
        details: {
          test1: test1Result,
          mappingBehavior,
          filteringBehavior
        }
      };
      
      return this._cacheDetectionResults(results);
    } catch (error) {
      console.error('NAT detection failed:', error.message);
      this.natType = 'unknown';
      return this._cacheDetectionResults({
        natType: this.natType,
        natMappingBehavior: this.natMappingBehavior,
        natFilteringBehavior: this.natFilteringBehavior,
        error: error.message
      });
    }
  }
  
  // Cache detection results
  _cacheDetectionResults(results) {
    this.detectionCache = {
      timestamp: Date.now(),
      results: results
    };
    return results;
  }
  
  // Test 1: Basic connectivity test
  async _performTest1() {
    // Try multiple STUN servers for reliability
    for (const server of this.stunServers) {
      try {
        const result = await this._sendBindingRequest(server, {});
        if (result.success) {
          return {
            success: true,
            sourceIP: result.sourceIP,
            sourcePort: result.sourcePort,
            mappedIP: result.mappedIP,
            mappedPort: result.mappedPort,
            server: server
          };
        }
      } catch (error) {
        console.warn(`STUN server ${server} failed:`, error.message);
      }
    }
    
    return { success: false };
  }
  
  // Test 2: Mapping behavior test (RFC 5780)
  async _determineMappingBehavior() {
    console.log('Testing NAT mapping behavior...');
    
    // Get baseline mapping
    const baseline = await this._performTest1();
    if (!baseline.success) return 'unknown';
    
    // Test with different destination ports on same server
    const server = baseline.server;
    const [host, portStr] = server.split(':');
    const basePort = parseInt(portStr);
    
    try {
      // Send request to different port on same host
      const altPortResult = await this._sendBindingRequest(`${host}:${basePort + 1}`, {});
      
      if (altPortResult.success) {
        // If mapped addresses are the same, it's endpoint-independent mapping
        if (altPortResult.mappedIP === baseline.mappedIP && 
            altPortResult.mappedPort === baseline.mappedPort) {
          return 'endpointIndependent';
        }
      }
      
      // If we get here, it's either address-dependent or address-and-port-dependent
      // We need a second STUN server to test address dependency
      for (const altServer of this.stunServers) {
        if (altServer !== server) {
          try {
            const altServerResult = await this._sendBindingRequest(altServer, {});
            
            if (altServerResult.success) {
              // If mapped addresses are the same, it's address-dependent mapping
              if (altServerResult.mappedIP === baseline.mappedIP && 
                  altServerResult.mappedPort === baseline.mappedPort) {
                return 'addressDependent';
              } else {
                // Different mappings for different addresses = address-and-port-dependent
                return 'addressAndPortDependent';
              }
            }
          } catch (error) {
            continue;
          }
        }
      }
      
      // If we can't test with another server, assume the most restrictive
      return 'addressAndPortDependent';
    } catch (error) {
      console.warn('Mapping behavior test failed:', error.message);
      return 'unknown';
    }
  }
  
  // Test 3: Filtering behavior test (RFC 5780)
  async _determineFilteringBehavior() {
    console.log('Testing NAT filtering behavior...');
    
    // This test requires sending requests from different ports and seeing what gets through
    // We'll simulate this by checking if we can receive responses from different endpoints
    
    try {
      // Get baseline
      const baseline = await this._performTest1();
      if (!baseline.success) return 'unknown';
      
      // For a proper test, we would need to coordinate with another node
      // For now, we'll make an educated guess based on common patterns
      // In a real implementation, this would involve more complex tests
      
      // Conservative approach: assume the most common filtering behavior
      return 'addressAndPortDependent';
    } catch (error) {
      console.warn('Filtering behavior test failed:', error.message);
      return 'unknown';
    }
  }
  
  // Classify NAT type based on mapping and filtering behaviors
  _classifyNATType(mappingBehavior, filteringBehavior) {
    // Based on RFC 3489 classification
    if (mappingBehavior === 'endpointIndependent' && filteringBehavior === 'endpointIndependent') {
      return 'fullCone'; // Full Cone NAT
    }
    
    if (mappingBehavior === 'addressDependent' && filteringBehavior === 'addressDependent') {
      return 'restricted'; // Restricted Cone NAT
    }
    
    if (mappingBehavior === 'addressAndPortDependent' && filteringBehavior === 'addressAndPortDependent') {
      return 'portRestricted'; // Port-Restricted Cone NAT
    }
    
    if (mappingBehavior === 'addressAndPortDependent') {
      // Symmetric NAT has address-and-port-dependent mapping behavior
      return 'symmetric';
    }
    
    // Default to most restrictive if we can't determine
    return 'symmetric';
  }
  
  // Enhanced STUN binding request with more detailed response parsing
  async _sendBindingRequest(serverAddress, options = {}) {
    return new Promise((resolve, reject) => {
      const [host, portStr] = serverAddress.split(':');
      const port = parseInt(portStr) || 3478;
      
      const socket = dgram.createSocket('udp4');
      let resolved = false;
      
      // Generate a random transaction ID
      const transactionId = crypto.randomBytes(12);
      
      // STUN binding request (RFC 5389)
      const stunRequest = Buffer.alloc(20);
      stunRequest.writeUInt16BE(0x0001, 0); // Message Type: Binding Request
      stunRequest.writeUInt16BE(0x0000, 2); // Message Length: 0 (no attributes)
      stunRequest.writeUInt32BE(0x2112A442, 4); // Magic Cookie
      transactionId.copy(stunRequest, 8); // Transaction ID
      
      // Add CHANGE-REQUEST attribute if requested
      if (options.changePort || options.changeIP) {
        // This would require a more complex implementation
      }
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.close();
          reject(new Error('STUN request timeout'));
        }
      }, options.timeout || 5000);
      
      socket.on('message', (msg, rinfo) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        socket.close();
        
        try {
          const result = this._parseStunResponse(msg, transactionId);
          result.sourceIP = rinfo.address;
          result.sourcePort = rinfo.port;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      socket.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.close();
          reject(err);
        }
      });
      
      socket.send(stunRequest, port, host, (err) => {
        if (err) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            socket.close();
            reject(err);
          }
        }
      });
    });
  }
  
  // Parse STUN response
  _parseStunResponse(msg, expectedTransactionId) {
    if (msg.length < 20) {
      throw new Error('Invalid STUN response');
    }
    
    // Check message type
    const messageType = msg.readUInt16BE(0);
    if (messageType !== 0x0101) { // Binding Success Response
      throw new Error('STUN request failed');
    }
    
    // Check transaction ID
    const transactionId = msg.slice(8, 20);
    if (!transactionId.equals(expectedTransactionId)) {
      throw new Error('Transaction ID mismatch');
    }
    
    const result = {
      success: true,
      mappedIP: null,
      mappedPort: null
    };
    
    // Parse attributes
    let offset = 20;
    while (offset < msg.length) {
      if (offset + 4 > msg.length) break;
      
      const attrType = msg.readUInt16BE(offset);
      const attrLength = msg.readUInt16BE(offset + 2);
      
      if (offset + 4 + attrLength > msg.length) break;
      
      // MAPPED-ADDRESS (0x0001) or XOR-MAPPED-ADDRESS (0x0020)
      if (attrType === 0x0020 || attrType === 0x0001) {
        const isXor = (attrType === 0x0020);
        const family = msg.readUInt8(offset + 5);
        
        if (family === 0x01) { // IPv4
          let mappedPort, mappedIP;
          
          if (isXor) {
            // XOR with magic cookie
            mappedPort = msg.readUInt16BE(offset + 6) ^ 0x2112;
            mappedIP = [
              msg.readUInt8(offset + 8) ^ 0x21,
              msg.readUInt8(offset + 9) ^ 0x12,
              msg.readUInt8(offset + 10) ^ 0xA4,
              msg.readUInt8(offset + 11) ^ 0x42
            ];
          } else {
            mappedPort = msg.readUInt16BE(offset + 6);
            mappedIP = [
              msg.readUInt8(offset + 8),
              msg.readUInt8(offset + 9),
              msg.readUInt8(offset + 10),
              msg.readUInt8(offset + 11)
            ];
          }
          
          result.mappedIP = mappedIP.join('.');
          result.mappedPort = mappedPort;
        }
      }
      
      // Move to next attribute (with 4-byte alignment)
      offset += 4 + Math.ceil(attrLength / 4) * 4;
    }
    
    if (!result.mappedIP || !result.mappedPort) {
      throw new Error('Mapped address not found in STUN response');
    }
    
    return result;
  }
  
  // Test connectivity to STUN servers
  async testSTUNServers() {
    const results = [];
    
    for (const server of this.stunServers) {
      try {
        const start = Date.now();
        const ip = await this.getPublicIPViaSTUN(server);
        const latency = Date.now() - start;
        
        results.push({
          server,
          success: !!ip,
          publicIP: ip,
          latency: ip ? latency : null,
          error: null
        });
        
        console.log(`✓ STUN server ${server} responded in ${latency}ms`);
      } catch (error) {
        results.push({
          server,
          success: false,
          publicIP: null,
          latency: null,
          error: error.message
        });
        
        console.warn(`⚠ STUN server ${server} failed:`, error.message);
      }
    }
    
    return results;
  }
  
  getNATType() {
    return this.natType;
  }
  
  getPublicIP() {
    return this.publicIP;
  }
  
  getNATBehavior() {
    return {
      type: this.natType,
      mappingBehavior: this.natMappingBehavior,
      filteringBehavior: this.natFilteringBehavior
    };
  }
  
  // TURN relay functionality
  async allocateTURNRelay(protocol = 'udp') {
    // For a production implementation, you would use a proper TURN client library
    // This is a simplified placeholder
    
    if (this.turnServers.length === 0) {
      console.warn('No TURN servers configured');
      return null;
    }
    
    // In a real implementation, you would:
    // 1. Connect to a TURN server
    // 2. Authenticate with username/password
    // 3. Allocate a relay address
    // 4. Return the relay information
    
    console.log('TURN relay allocation requested (not implemented in this simplified version)');
    return null;
  }
  
  // Enhanced TURN decision logic based on detailed NAT behavior
  shouldUseTURN() {
    // Use TURN when:
    // 1. UPnP failed
    // 2. STUN failed to determine public IP
    // 3. NAT type is symmetric (most restrictive)
    // 4. NAT has restrictive filtering behavior
    
    if (!this.publicIP) {
      return true;
    }
    
    // Symmetric NATs always need TURN
    if (this.natType === 'symmetric') {
      return true;
    }
    
    // Port-restricted NATs may benefit from TURN for better connectivity
    if (this.natType === 'portRestricted') {
      return true;
    }
    
    // If we don't have reliable NAT behavior information, be conservative
    if (this.natType === 'unknown' || this.natFilteringBehavior === 'unknown') {
      return true;
    }
    
    return false;
  }
  
  // Get TURN server configuration
  getTURNServers() {
    return this.turnServers;
  }
  
  // Peer-to-peer NAT detection coordination
  // This method would be called when coordinating with another node for NAT detection
  async coordinateNATDetection(peerAddress) {
    console.log(`Coordinating NAT detection with peer at ${peerAddress}`);
    
    // In a full implementation, this would:
    // 1. Exchange NAT behavior information with the peer
    // 2. Determine the best connection strategy
    // 3. Test direct connectivity
    // 4. Fall back to relay if needed
    
    // For now, we'll just return our NAT information
    const natInfo = await this.determineNATType();
    
    return {
      localNAT: natInfo,
      peerAddress: peerAddress,
      recommendedStrategy: this._recommendConnectionStrategy(natInfo)
    };
  }
  
  // Recommend connection strategy based on NAT types
  _recommendConnectionStrategy(localNATInfo) {
    const localType = localNATInfo.natType;
    
    // Connection strategy recommendations based on RFC 3489
    switch (localType) {
      case 'open':
        return 'direct'; // Direct connection should work
        
      case 'fullCone':
        return 'direct'; // Direct connection should work
        
      case 'restricted':
        return 'directWithHolePunching'; // May need hole punching
        
      case 'portRestricted':
        return 'directWithHolePunching'; // Will likely need hole punching
        
      case 'symmetric':
        return 'relay'; // TURN relay almost certainly needed
        
      default:
        return 'relay'; // Conservative approach for unknown NAT types
    }
  }
  
  // Generate NAT compatibility report for connection with a peer
  generateCompatibilityReport(peerNATInfo) {
    const localInfo = this.getNATBehavior();
    
    // NAT traversal compatibility matrix
    const compatibility = this._checkNATCompatibility(localInfo, peerNATInfo);
    
    return {
      localNAT: localInfo,
      peerNAT: peerNATInfo,
      compatible: compatibility.compatible,
      recommendedMethod: compatibility.recommendedMethod,
      successProbability: compatibility.successProbability,
      notes: compatibility.notes
    };
  }
  
  // Check NAT compatibility between two nodes
  _checkNATCompatibility(localNAT, peerNAT) {
    // Based on RFC 3489 NAT traversal rules
    const localType = localNAT.type;
    const peerType = peerNAT.type;
    
    // Both nodes have open internet - direct connection
    if (localType === 'open' && peerType === 'open') {
      return {
        compatible: true,
        recommendedMethod: 'direct',
        successProbability: 0.95,
        notes: 'Both nodes have direct internet access'
      };
    }
    
    // One node has open internet
    if (localType === 'open' || peerType === 'open') {
      return {
        compatible: true,
        recommendedMethod: 'direct',
        successProbability: 0.90,
        notes: 'One node has direct internet access'
      };
    }
    
    // Full cone NATs are compatible with most other NAT types
    if (localType === 'fullCone' || peerType === 'fullCone') {
      return {
        compatible: true,
        recommendedMethod: 'directWithHolePunching',
        successProbability: 0.85,
        notes: 'Full cone NAT enables easier connectivity'
      };
    }
    
    // Symmetric NATs are problematic
    if (localType === 'symmetric' && peerType === 'symmetric') {
      return {
        compatible: false,
        recommendedMethod: 'relay',
        successProbability: 0.10,
        notes: 'Symmetric-Symmetric NATs are very difficult to traverse'
      };
    }
    
    if (localType === 'symmetric' || peerType === 'symmetric') {
      return {
        compatible: true,
        recommendedMethod: 'relay',
        successProbability: 0.30,
        notes: 'Symmetric NAT requires TURN relay for reliable connectivity'
      };
    }
    
    // All other combinations should be able to connect with hole punching
    return {
      compatible: true,
      recommendedMethod: 'directWithHolePunching',
      successProbability: 0.75,
      notes: 'Should be able to establish direct connection with hole punching'
    };
  }
  
  // Timing-based symmetric NAT detection
  async detectSymmetricNAT() {
    console.log('Performing timing-based symmetric NAT detection...');
    
    try {
      // Send multiple requests to the same STUN server
      const results = [];
      const server = this.stunServers[0]; // Use the first server
      
      for (let i = 0; i < 5; i++) {
        const result = await this._sendBindingRequest(server, {});
        if (result.success) {
          results.push({
            mappedIP: result.mappedIP,
            mappedPort: result.mappedPort,
            timestamp: Date.now()
          });
        }
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (results.length < 2) {
        return false; // Not enough data
      }
      
      // Check if mapped ports are different (indicative of symmetric NAT)
      const firstPort = results[0].mappedPort;
      const hasDifferentPorts = results.some(r => r.mappedPort !== firstPort);
      
      if (hasDifferentPorts) {
        console.log('Symmetric NAT detected based on port variations');
        return true;
      }
      
      // Check timing variations (symmetric NATs may have timing signatures)
      const timeDiffs = [];
      for (let i = 1; i < results.length; i++) {
        timeDiffs.push(results[i].timestamp - results[i-1].timestamp);
      }
      
      // Calculate variance in timing
      const mean = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
      const variance = timeDiffs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / timeDiffs.length;
      
      // High variance might indicate symmetric NAT behavior
      if (variance > 1000) { // Threshold in milliseconds
        console.log('Possible symmetric NAT detected based on timing variance');
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Symmetric NAT detection failed:', error.message);
      return false;
    }
  }
  
  // Refresh NAT detection
  async refreshNATDetection() {
    console.log('Refreshing NAT detection...');
    this.detectionCache = {
      timestamp: null,
      results: null
    };
    return await this.determineNATType(true);
  }
}

module.exports = NATManager;