// file.js
class File {
    constructor(bits, name, options = {}) {
      this._bits = Array.isArray(bits) ? bits : [bits];
      this.name = name;
      this.type = options.type || '';
      this.size = this._bits.reduce((acc, val) => acc + val.byteLength, 0);
    }
  
    async text() {
      const decoder = new TextDecoder('utf-8');
      return this._bits.map(bit => decoder.decode(bit)).join('');
    }
  
    async arrayBuffer() {
      const totalLength = this._bits.reduce((acc, bit) => acc + bit.byteLength, 0);
      const buffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const bit of this._bits) {
        buffer.set(new Uint8Array(bit), offset);
        offset += bit.byteLength;
      }
      return buffer.buffer;
    }
  
    stream() {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      (async () => {
        try {
          for (const bit of this._bits) {
            await writer.write(bit);
          }
        } finally {
          writer.close();
        }
      })();
      return readable;
    }
  }
  
  module.exports = { File };