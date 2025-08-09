import crypto from 'crypto';
import { createLogger } from './logger.js';

const STUN_MAGIC_COOKIE = 0x2112A442;

function buildBindingRequest() {
  const buffer = Buffer.alloc(20);
  // Message Type: 0x0001 Binding Request
  buffer.writeUInt16BE(0x0001, 0);
  // Message Length: 0 (no attributes)
  buffer.writeUInt16BE(0, 2);
  // Magic Cookie
  buffer.writeUInt32BE(STUN_MAGIC_COOKIE, 4);
  // Transaction ID (12 bytes)
  const txId = crypto.randomBytes(12);
  txId.copy(buffer, 8);
  return { buffer, txId };
}

function parseXorMappedAddress(messageBuffer, txId) {
  // Basic header
  if (messageBuffer.length < 20) return null;
  const messageType = messageBuffer.readUInt16BE(0);
  const messageLength = messageBuffer.readUInt16BE(2);
  const cookie = messageBuffer.readUInt32BE(4);
  if (cookie !== STUN_MAGIC_COOKIE) return null;
  if (messageType !== 0x0101) return null; // Binding Success Response
  const end = 20 + messageLength;
  let offset = 20;
  while (offset + 4 <= end && offset + 4 <= messageBuffer.length) {
    const attrType = messageBuffer.readUInt16BE(offset);
    const attrLen = messageBuffer.readUInt16BE(offset + 2);
    const valueOffset = offset + 4;
    const nextOffset = valueOffset + attrLen + ((4 - (attrLen % 4)) % 4);

    if (attrType === 0x0020 /* XOR-MAPPED-ADDRESS */) {
      if (attrLen < 4) return null;
      const family = messageBuffer.readUInt8(valueOffset + 1);
      if (family === 0x01) {
        // IPv4
        const xPort = messageBuffer.readUInt16BE(valueOffset + 2);
        const port = xPort ^ (STUN_MAGIC_COOKIE >>> 16);

        const addrBuf = messageBuffer.slice(valueOffset + 4, valueOffset + 8);
        const cookieBuf = Buffer.alloc(4);
        cookieBuf.writeUInt32BE(STUN_MAGIC_COOKIE, 0);
        const xored = Buffer.alloc(4);
        for (let i = 0; i < 4; i += 1) {
          xored[i] = addrBuf[i] ^ cookieBuf[i];
        }
        const ip = `${xored[0]}.${xored[1]}.${xored[2]}.${xored[3]}`;
        return { ip, port };
      } else if (family === 0x02) {
        // IPv6 (not required for basic use)
        // Implement if needed later
      }
    } else if (attrType === 0x0001 /* MAPPED-ADDRESS */) {
      const family = messageBuffer.readUInt8(valueOffset + 1);
      if (family === 0x01) {
        const port = messageBuffer.readUInt16BE(valueOffset + 2);
        const b = messageBuffer.slice(valueOffset + 4, valueOffset + 8);
        const ip = `${b[0]}.${b[1]}.${b[2]}.${b[3]}`;
        return { ip, port };
      }
    }

    offset = nextOffset;
  }
  return null;
}

export async function probeMappedAddressOverSocket(udpSocket, stunServer, timeoutMs = 1500, logger = createLogger()) {
  const { buffer, txId } = buildBindingRequest();
  const [host, portStr] = stunServer.replace('stun:', '').split(':');
  const port = Number(portStr || 3478);

  return new Promise((resolve) => {
    let resolved = false;
    const onMessage = (msg, rinfo) => {
      logger.verbose(`[STUN] recv ${msg.length}B from ${rinfo.address}:${rinfo.port} for ${host}:${port}`);
      const res = parseXorMappedAddress(msg, txId);
      if (res && !resolved) {
        resolved = true;
        cleanup();
        logger.verbose(`[STUN] parsed XOR-MAPPED-ADDRESS ${res.ip}:${res.port}`);
        resolve({ server: stunServer, publicIp: res.ip, publicPort: res.port });
      }
    };

    const onTimeout = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(null);
      }
    };

    function cleanup() {
      udpSocket.off('message', onMessage);
      clearTimeout(timer);
    }

    udpSocket.on('message', onMessage);
    logger.verbose(`[STUN] send Binding Request to ${host}:${port}, tx=${txId.toString('hex')}`);
    udpSocket.send(buffer, 0, buffer.length, port, host);
    const timer = setTimeout(onTimeout, timeoutMs);
  });
}

export async function getFirstWorkingMapping(udpSocket, stunServers, perTryTimeoutMs = 1500, logger = createLogger()) {
  for (const { urls } of stunServers) {
    try {
      logger.verbose(`[STUN] probing ${urls}`);
      const res = await probeMappedAddressOverSocket(udpSocket, urls, perTryTimeoutMs, logger);
      if (res) return res;
    } catch {
      // ignore and continue
    }
  }
  return null;
}


