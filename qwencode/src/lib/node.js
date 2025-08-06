/**
 * Node initialization module
 * Handles node startup, unique ID generation, and configuration loading
 */

const fs = require('fs');
const path = require('path');

/**
 * Generates a unique node ID
 * @returns {string} Unique node identifier
 */
function generateNodeId() {
  // Using crypto for better randomness
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Loads configuration settings
 * @returns {Object} Configuration object
 */
function loadConfig() {
  const config = {
    // Default configuration values
    stunServers: process.env.STUN_SERVERS || 'stun:fwa.lifesizecloud.com:3478,stun:stun.isp.net.au:3478,stun:stun.freeswitch.org:3478,stun:stun.voip.blackberry.com:3478',
    debug: process.env.DEBUG === 'true',
    nodeId: process.env.NODE_ID || null,
    meetingCode: process.env.MEETING_CODE || null
  };
  
  // Load from config file if it exists
  try {
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      const configFile = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(configFile);
      Object.assign(config, fileConfig);
    }
  } catch (error) {
    console.warn('Failed to load config file, using defaults:', error.message);
  }
  
  return config;
}

/**
 * Initializes the node
 * @param {Object} options - Initialization options
 * @returns {Object} Initialized node object
 */
function initializeNode(options = {}) {
  try {
    // Load configuration
    const config = loadConfig();
    
    // Generate or use existing node ID
    let nodeId;
    if (config.nodeId) {
      nodeId = config.nodeId;
    } else {
      nodeId = generateNodeId();
      // Optionally save the generated ID for persistence
      try {
        const configPath = path.join(__dirname, '..', 'config.json');
        const existingConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
        existingConfig.nodeId = nodeId;
        fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
      } catch (error) {
        console.warn('Failed to persist node ID:', error.message);
      }
    }
    
    // Initialize core components
    const node = {
      id: nodeId,
      config: config,
      initialized: true,
      timestamp: Date.now()
    };
    
    if (config.debug) {
      console.log('Node initialized with ID:', nodeId);
    }
    
    // Emit readiness event
    process.emit('node-ready', node);
    
    return node;
  } catch (error) {
    console.error('Failed to initialize node:', error.message);
    throw new Error(`Node initialization failed: ${error.message}`);
  }
}

module.exports = {
  generateNodeId,
  loadConfig,
  initializeNode
};