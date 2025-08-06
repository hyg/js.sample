 module.exports = {
  // --- Core Configuration ---
  /**
   * The port on which the node will listen for both DHT traffic and P2P application traffic.
   * Using a single port is crucial for NAT traversal and resource efficiency.
   */
  port: 6881,

  /**
   * A list of initial DHT bootstrap nodes to connect to.
   * These help new nodes join the DHT network.
   * Public BitTorrent DHT nodes are often used for this purpose.
   */
  bootstrapNodes: [
    { host: '34.197.35.250', port: 6880 },
    { host: '72.46.58.63', port: 51413 },
    { host: '46.53.251.68', port: 16970 },
    { host: '191.95.16.229', port: 55998 },
    { host: '79.173.94.111', port: 1438 },
    { host: '45.233.86.50', port: 61995 },
    { host: '178.162.174.28', port: 28013 },
    { host: '178.162.174.240', port: 28006 },
    { host: '72.21.17.101', port: 22643 },
    { host: '31.181.42.46', port: 22566 },
    { host: '67.213.106.46', port: 61956 },
    { host: '201.131.172.249', port: 53567 },
    { host: '185.203.152.184', port: 2003 },
    { host: '68.146.23.207', port: 42107 },
    { host: '51.195.222.183', port: 8653 },
    { host: '85.17.170.48', port: 28005 },
    { host: '87.98.162.88', port: 6881 },
    { host: '185.145.245.121', port: 8656 },
    { host: '52.201.45.189', port: 6880 }
    // Note: Availability and reliability of these public nodes can vary.
    // It's good practice to have a few alternatives.
  ],

  // --- Node Identity ---
  /**
   * The unique identifier for this node in the DHT.
   * If not provided, a new random ID will typically be generated on each startup.
   * For persistent identity across restarts, this should be loaded from/saved to a file.
   */
  nodeId: null, // null means auto-generate

  // --- Security & Encryption ---
  /**
   * Enable or disable end-to-end encryption for P2P communication.
   * It is highly recommended to keep this enabled.
   */
  enableEncryption: true,

  /**
   * Path to a file containing persistent node identity (nodeId and associated keys).
   * If the file doesn't exist, a new identity will be generated and saved here.
   * If null or empty, identity is ephemeral (generated on each start).
   */
  identityFile: './node-identity.json',


  // --- Discovery & Announcements ---
  /**
   * Time interval (in milliseconds) to periodically re-announce this node's presence
   * in the DHT for a given topic. This helps maintain liveness.
   */
  announceInterval: 30 * 60 * 1000, // 30 minutes

  /**
   * Time (in milliseconds) after which a discovered peer is considered stale
   * if no further announcements are received.
   */
  peerTtl: 60 * 60 * 1000, // 1 hour


  // --- NAT Traversal ---
  /**
   * A list of STUN servers to use for determining the node's public IP and port.
   * This is essential for NAT traversal.
   */
  stunServers: [
    { urls: 'stun:fwa.lifesizecloud.com:3478' },
    { urls: 'stun:stun.isp.net.au:3478' },
    { urls: 'stun:stun.freeswitch.org:3478' },
    { urls: 'stun:stun.voip.blackberry.com:3478' }
    // Add more STUN servers as needed or discovered to be reliable in China.
  ],

  /**
   * Timeout (in milliseconds) for STUN requests.
   */
  stunTimeout: 5000, // 5 seconds


  // --- Networking & Performance ---
  /**
   * Maximum number of concurrent connection attempts.
   */
  maxConnectionAttempts: 10,

  /**
   * Timeout (in milliseconds) for establishing a P2P connection.
   */
  connectionTimeout: 10000, // 10 seconds


  // --- Logging ---
  /**
   * Enable or disable verbose logging.
   * Useful for debugging NAT traversal and connection issues.
   */
  debug: false
};