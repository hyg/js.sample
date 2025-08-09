import DHT from 'bittorrent-dht';
import crypto from 'crypto';
import { createLogger } from './logger.js';

function topicToInfoHash(topic) {
  // Derive a deterministic 20-byte infoHash from topic
  const hash = crypto.createHash('sha1').update(`app:p2p-node:${topic}`).digest();
  return hash;
}

export function createDhtNode(bootstrap, logger = createLogger()) {
  logger.verbose('[DHT] creating node with bootstrap:', bootstrap);
  const dht = new DHT({ bootstrap, verify: false, maxTables: 1 });
  return dht;
}

export function announceAndLookupPeers(dht, topic, port, onPeer, logger = createLogger()) {
  const infoHash = topicToInfoHash(topic);

  dht.on('listening', () => {
    const addr = dht.address();
    logger.verbose('[DHT] listening on', `${addr.address}:${addr.port}`);
  });

  dht.on('ready', () => {
    logger.verbose('[DHT] ready; announcing port', port);
    const addr = dht.address();
    logger.log('DHT listen port =', addr.port, 'announce service port =', port);
    // Announce as a torrent-like service on given port
    dht.announce(infoHash, port, (err) => {
      if (err) {
        logger.error('[DHT] announce error:', err.message || err);
      }
    });

    // Start lookup
    logger.verbose('[DHT] lookup start');
    dht.lookup(infoHash);
  });

  dht.on('peer', (peer, _infoHash, from) => {
    // peer: {host, port}
    if (peer && peer.host && peer.port) {
      logger.verbose('[DHT] found peer', `${peer.host}:${peer.port}`, 'from', from);
      onPeer(peer, from);
    }
  });

  return () => {
    logger.verbose('[DHT] destroy');
    try { dht.destroy(); } catch (_) { /* noop */ }
  };
}


