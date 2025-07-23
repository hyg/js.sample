'use strict';

const Node = require('./lib/node');
const TCPTransport = require('./lib/tcp-transport');
const UDPTransport = require('./lib/udp-transport');
const DHTDiscovery = require('./lib/dht');
const NATTraversal = require('./lib/nat');
const defaultConfig = require('./config');

/**
 * 创建P2P节点
 * @param {Object} options - 配置选项
 * @returns {Node} - P2P节点实例
 */
function createNode(options = {}) {
  // 合并默认配置和用户配置
  const config = {
    dht: { ...defaultConfig.dht, ...options.dht },
    nat: { ...defaultConfig.nat, ...options.nat },
    transport: { ...defaultConfig.transport, ...options.transport },
    node: { ...defaultConfig.node, ...options.node }
  };
  
  return new Node(config);
}

module.exports = {
  createNode,
  Node,
  TCPTransport,
  UDPTransport,
  DHTDiscovery,
  NATTraversal
};