const fs = require('fs-extra');
const path = require('path');

class ConfigManager {
  constructor(configPath = './config.json') {
    this.configPath = configPath;
    this.defaultConfig = {
      network: {
        magnetUri: 'magnet:?xt=urn:btih:1234567890123456789012345678901234567890',
        tcpPort: 0,
        udpPort: 0,
        dhtPort: 6881,
        natTraversal: true,
        maxConnections: 50,
        connectionTimeout: 30000
      },
      security: {
        encryption: true,
        authRequired: false,
        trustedNodes: [],
        sharedSecret: 'default-shared-secret'
      },
      fileTransfer: {
        enabled: true,
        sharedDir: './shared',
        tempDir: './temp',
        maxConcurrentTransfers: 5,
        chunkSize: 65536,
        maxFileSize: 104857600 // 100MB
      },
      monitoring: {
        enabled: true,
        logLevel: 'info',
        statsInterval: 5000,
        historyRetention: 86400000 // 24 hours
      },
      discovery: {
        broadcastInterval: 30000,
        nodeTimeout: 300000,
        maxDiscoveryNodes: 100
      }
    };
    
    this.config = { ...this.defaultConfig };
    this.loadConfig();
  }

  async loadConfig() {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJson(this.configPath);
        this.config = this.mergeDeep(this.defaultConfig, configData);
      } else {
        await this.saveConfig();
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults:', error.message);
      this.config = { ...this.defaultConfig };
    }
  }

  async saveConfig() {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  get(path) {
    return this.getNestedValue(this.config, path);
  }

  set(path, value) {
    this.setNestedValue(this.config, path, value);
    this.saveConfig();
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  async updateConfig(updates) {
    this.config = this.mergeDeep(this.config, updates);
    await this.saveConfig();
    return this.config;
  }

  mergeDeep(target, source) {
    const output = Object.assign({}, target);
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  validateConfig() {
    const errors = [];

    // 验证网络配置
    if (this.config.network.tcpPort < 0 || this.config.network.tcpPort > 65535) {
      errors.push('TCP port must be between 0 and 65535');
    }

    if (this.config.network.udpPort < 0 || this.config.network.udpPort > 65535) {
      errors.push('UDP port must be between 0 and 65535');
    }

    if (this.config.network.dhtPort < 0 || this.config.network.dhtPort > 65535) {
      errors.push('DHT port must be between 0 and 65535');
    }

    // 验证文件传输配置
    if (this.config.fileTransfer.chunkSize < 1024 || this.config.fileTransfer.chunkSize > 1048576) {
      errors.push('Chunk size must be between 1KB and 1MB');
    }

    if (this.config.fileTransfer.maxConcurrentTransfers < 1 || this.config.fileTransfer.maxConcurrentTransfers > 20) {
      errors.push('Max concurrent transfers must be between 1 and 20');
    }

    return errors;
  }

  async resetToDefaults() {
    this.config = { ...this.defaultConfig };
    await this.saveConfig();
  }

  getConfigSummary() {
    return {
      network: {
        ports: {
          tcp: this.config.network.tcpPort,
          udp: this.config.network.udpPort,
          dht: this.config.network.dhtPort
        },
        natTraversal: this.config.network.natTraversal,
        maxConnections: this.config.network.maxConnections
      },
      features: {
        encryption: this.config.security.encryption,
        fileTransfer: this.config.fileTransfer.enabled,
        monitoring: this.config.monitoring.enabled,
        authRequired: this.config.security.authRequired
      }
    };
  }

  createCLIConfig() {
    return {
      showHelp: false,
      commands: {
        'config get <path>': 'Get configuration value',
        'config set <path> <value>': 'Set configuration value',
        'config reset': 'Reset to default configuration',
        'config validate': 'Validate current configuration',
        'config show': 'Show current configuration'
      }
    };
  }
}

module.exports = ConfigManager;