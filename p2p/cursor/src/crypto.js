import crypto from 'crypto';
import nacl from 'tweetnacl';

function toUint8(buffer) {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export function deriveKeyFromPassphrase(passphrase, topic) {
  const salt = crypto.createHash('sha256').update(`topic:${topic}`).digest();
  // Tune for moderate CPU and low memory to work on most machines
  const key = crypto.scryptSync(passphrase, salt, 32, {
    N: 1 << 14,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024
  });
  return toUint8(Buffer.from(key));
}

export function encryptMessage(keyUint8, plaintextBuffer) {
  const nonce = crypto.randomBytes(24);
  const message = toUint8(plaintextBuffer);
  const box = nacl.secretbox(message, toUint8(nonce), keyUint8);
  const out = Buffer.concat([Buffer.from(nonce), Buffer.from(box)]);
  return out;
}

export function decryptMessage(keyUint8, packetBuffer) {
  if (!packetBuffer || packetBuffer.length < 24 + 16) return null;
  const nonce = packetBuffer.subarray(0, 24);
  const box = packetBuffer.subarray(24);
  const opened = nacl.secretbox.open(toUint8(box), toUint8(nonce), keyUint8);
  if (!opened) return null;
  return Buffer.from(opened);
}

export function pad(dataBuffer, block = 64) {
  const len = dataBuffer.length;
  const padLen = (block - (len % block)) % block;
  if (padLen === 0) return dataBuffer;
  return Buffer.concat([dataBuffer, Buffer.alloc(padLen, 0)]);
}


