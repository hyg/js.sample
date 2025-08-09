import dgram from 'dgram';
import minimist from 'minimist';
import { STUN_SERVERS, DHT_BOOTSTRAP, DEFAULT_MESSAGE } from './config.js';
import { getFirstWorkingMapping } from './stun.js';
import { createDhtNode, announceAndLookupPeers } from './dht.js';
import { deriveKeyFromPassphrase, encryptMessage, decryptMessage, pad } from './crypto.js';
import { createLogger } from './logger.js';

function nowIso() { return new Date().toISOString(); }

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['topic', 'passphrase', 'send', 'text'],
    number: ['port', 'punch-attempts', 'punch-interval', 'punch-jitter', 'keepalive-interval'],
    boolean: ['quiet', 'verbose'],
    alias: { t: 'topic', p: 'passphrase', q: 'quiet', v: 'verbose' },
    default: { port: 0, 'punch-attempts': 12, 'punch-interval': 350, 'punch-jitter': 50, 'keepalive-interval': 20000 }
  });

  const topic = argv.topic || 'sample-topic';
  const passphrase = argv.passphrase || 'sample-pass';
  const sendText = argv.send || '';
  const broadcastText = argv.text || '';

  const udp = dgram.createSocket('udp4');

  // Logging
  const quiet = !!argv.quiet;
  const verbose = !!argv.verbose;
  const logger = createLogger({ quiet, verbose });

  const key = deriveKeyFromPassphrase(passphrase, topic);

  await new Promise((resolve) => udp.bind(argv.port, resolve));
  const local = udp.address();
  logger.log('UDP bound on', `${local.address}:${local.port}`);

  // Discover public mapping via STUN
  const mapping = await getFirstWorkingMapping(udp, STUN_SERVERS, 1500, logger);
  if (mapping) {
    logger.log('STUN mapped public', `${mapping.publicIp}:${mapping.publicPort}`, 'via', mapping.server);
  } else {
    logger.log('STUN failed, proceeding with local port', local.port);
  }

  const announcePort = mapping?.publicPort || local.port;
  logger.log('Announce port =', announcePort, 'source =', mapping ? 'STUN publicPort' : 'local.port');

  // Setup DHT
  const dht = createDhtNode(DHT_BOOTSTRAP.map((b) => `${b.host}:${b.port}`), logger);

  const seenPeersKey = new Set();
  const activePeers = new Map(); // key -> { host, port, lastSeen, heartbeatTimer }

  const stopDht = announceAndLookupPeers(dht, topic, announcePort, (peer, from) => {
    const id = `${peer.host}:${peer.port}`;
    if (seenPeersKey.has(id)) return;
    seenPeersKey.add(id);
    logger.log('DHT peer', `${peer.host}:${peer.port}`, 'via', from?.host || 'unknown');

    // Start NAT hole punching: send small encrypted pings both ways
    sendEncryptedPing(
      udp,
      key,
      peer.host,
      peer.port,
      logger,
      Number(argv['punch-attempts']),
      Number(argv['punch-interval']),
      Number(argv['punch-jitter'])
    );

    if (broadcastText) {
      const payload = Buffer.from(broadcastText, 'utf8');
      logger.log('Broadcast send', `${payload.length}B`, 'to', `${peer.host}:${peer.port}`);
      udp.send(encryptMessage(key, pad(payload)), peer.port, peer.host);
    }
  }, logger);

  process.on('SIGINT', () => {
    stopDht();
    for (const [, info] of activePeers) {
      try { clearInterval(info.heartbeatTimer); } catch (_) {}
    }
    try { udp.close(); } catch (_) {}
    process.exit(0);
  });

  udp.on('message', (msg, rinfo) => {
    const plaintext = decryptMessage(key, msg);
    if (!plaintext) return; // ignore non-matching traffic
    const text = plaintext.toString('utf8');
    logger.verbose('recv', `${text.length}B`, 'from', `${rinfo.address}:${rinfo.port}`);
    // Mark active peer and start heartbeat if first time
    const peerKey = `${rinfo.address}:${rinfo.port}`;
    if (!activePeers.has(peerKey)) {
      logger.log('link established with', peerKey, '- start heartbeat');
      const timer = setInterval(() => {
        const hb = Buffer.from('PING');
        udp.send(encryptMessage(key, pad(hb)), rinfo.port, rinfo.address);
        logger.verbose('heartbeat PING to', peerKey);
      }, Number(argv['keepalive-interval']));
      activePeers.set(peerKey, { host: rinfo.address, port: rinfo.port, lastSeen: Date.now(), heartbeatTimer: timer });
    } else {
      const info = activePeers.get(peerKey);
      info.lastSeen = Date.now();
    }
    if (text.startsWith('PING')) {
      // minimal reply to assist hole punching
      const reply = Buffer.from('PONG');
      logger.verbose('reply PONG to', `${rinfo.address}:${rinfo.port}`);
      udp.send(encryptMessage(key, pad(reply)), rinfo.port, rinfo.address);
    } else {
      // Application message
      if (!quiet) process.stdout.write(text + '\n');
    }
  });

  udp.on('error', (err) => {
    logger.error('UDP socket error:', err);
  });

  // Optional send-once to speed up first contact for manual target
  if (sendText) {
    // Format: host:port
    const [host, portStr] = String(sendText).trim().split(':');
    const port = Number(portStr);
    if (host && Number.isFinite(port)) {
      const payload = Buffer.from(DEFAULT_MESSAGE);
      logger.log('Manual send', `${payload.length}B`, 'to', `${host}:${port}`);
      udp.send(encryptMessage(key, pad(payload)), port, host);
      logger.log('sent initial', `${payload.length}B`, 'to', `${host}:${port}`);
    }
  }
}

function sendEncryptedPing(udp, key, host, port, logger, attempts = 12, intervalMs = 350, jitterPct = 50) {
  const payload = Buffer.from('PING');
  const pkt = encryptMessage(key, pad(payload));
  const jitterFactor = Math.max(0, Math.min(100, Number(jitterPct))) / 100;
  for (let i = 0; i < attempts; i += 1) {
    const base = i * Number(intervalMs);
    const jitter = (Math.random() * 2 - 1) * jitterFactor * intervalMs;
    const delay = Math.max(0, Math.floor(base + jitter));
    setTimeout(() => {
      if (logger) logger.verbose('send PING attempt', i + 1, 'to', `${host}:${port}`);
      udp.send(pkt, port, host);
    }, delay);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


