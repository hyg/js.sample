const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class FileTransfer extends EventEmitter {
  constructor(nodeManager, options = {}) {
    super();
    this.nodeManager = nodeManager;
    this.chunkSize = options.chunkSize || 64 * 1024; // 64KB chunks
    this.maxConcurrentTransfers = options.maxConcurrentTransfers || 5;
    this.tempDir = options.tempDir || './temp';
    this.sharedDir = options.sharedDir || './shared';
    
    this.activeTransfers = new Map();
    this.pendingFiles = new Map();
    this.sharedFiles = new Map();
    
    this.setupDirectories();
    this.setupEventHandlers();
  }

  async setupDirectories() {
    await fs.ensureDir(this.tempDir);
    await fs.ensureDir(this.sharedDir);
  }

  setupEventHandlers() {
    this.nodeManager.on('message', (message) => {
      this.handleFileMessage(message);
    });
  }

  // 添加共享文件
  async addSharedFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      const fileName = path.basename(filePath);
      const fileHash = await this.calculateFileHash(filePath);
      const fileSize = stats.size;

      const fileInfo = {
        name: fileName,
        hash: fileHash,
        size: fileSize,
        path: filePath,
        chunks: Math.ceil(fileSize / this.chunkSize),
        timestamp: Date.now()
      };

      this.sharedFiles.set(fileHash, fileInfo);
      
      // 广播文件可用性
      await this.broadcastFileAvailability(fileInfo);
      
      console.log(`✓ Added shared file: ${fileName} (${this.formatBytes(fileSize)})`);
      return fileInfo;
      
    } catch (error) {
      console.error('Failed to add shared file:', error);
      throw error;
    }
  }

  // 计算文件哈希
  async calculateFileHash(filePath) {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  // 广播文件可用性
  async broadcastFileAvailability(fileInfo) {
    const message = {
      type: 'file-available',
      file: {
        name: fileInfo.name,
        hash: fileInfo.hash,
        size: fileInfo.size,
        chunks: fileInfo.chunks
      },
      timestamp: Date.now()
    };

    await this.nodeManager.broadcastMessage(JSON.stringify(message));
  }

  // 请求文件列表
  async requestFileList(targetNodeId) {
    const message = {
      type: 'file-list-request',
      timestamp: Date.now()
    };

    const node = this.nodeManager.discoveredNodes.get(targetNodeId);
    if (node) {
      await this.sendToNode(node, JSON.stringify(message));
    }
  }

  // 发送文件给节点
  async sendFile(targetNodeId, fileHash, startChunk = 0, endChunk = null) {
    const fileInfo = this.sharedFiles.get(fileHash);
    if (!fileInfo) {
      throw new Error('File not found in shared files');
    }

    const transferId = this.generateTransferId();
    const chunksToSend = endChunk || fileInfo.chunks;

    const transferInfo = {
      id: transferId,
      file: fileInfo,
      startChunk,
      endChunk: chunksToSend,
      targetNodeId,
      progress: 0,
      status: 'active'
    };

    this.activeTransfers.set(transferId, transferInfo);

    try {
      for (let chunkIndex = startChunk; chunkIndex < chunksToSend; chunkIndex++) {
        const chunkData = await this.readChunk(fileInfo.path, chunkIndex);
        
        const chunkMessage = {
          type: 'file-chunk',
          transferId,
          fileHash,
          chunkIndex,
          totalChunks: fileInfo.chunks,
          data: chunkData.toString('base64'),
          timestamp: Date.now()
        };

        await this.sendToNode(this.nodeManager.discoveredNodes.get(targetNodeId), 
                            JSON.stringify(chunkMessage));
        
        transferInfo.progress = ((chunkIndex - startChunk + 1) / (chunksToSend - startChunk)) * 100;
        this.emit('upload-progress', transferInfo);
      }

      // 发送完成消息
      const completionMessage = {
        type: 'file-complete',
        transferId,
        fileHash,
        timestamp: Date.now()
      };

      await this.sendToNode(this.nodeManager.discoveredNodes.get(targetNodeId), 
                          JSON.stringify(completionMessage));

      transferInfo.status = 'completed';
      this.emit('upload-complete', transferInfo);

    } catch (error) {
      transferInfo.status = 'failed';
      transferInfo.error = error.message;
      this.emit('upload-error', transferInfo);
      throw error;
    } finally {
      setTimeout(() => this.activeTransfers.delete(transferId), 30000);
    }
  }

  // 请求文件下载
  async downloadFile(fileHash, sourceNodeId, savePath = null) {
    const fileInfo = this.pendingFiles.get(fileHash);
    if (!fileInfo) {
      throw new Error('File info not found');
    }

    const transferId = this.generateTransferId();
    const downloadPath = savePath || path.join(this.sharedDir, fileInfo.name);
    const tempPath = path.join(this.tempDir, `${fileHash}.tmp`);

    const transferInfo = {
      id: transferId,
      file: fileInfo,
      sourceNodeId,
      savePath: downloadPath,
      tempPath,
      receivedChunks: new Set(),
      progress: 0,
      status: 'downloading'
    };

    this.activeTransfers.set(transferId, transferInfo);

    try {
      // 请求文件
      const requestMessage = {
        type: 'file-request',
        fileHash,
        transferId,
        timestamp: Date.now()
      };

      await this.sendToNode(this.nodeManager.discoveredNodes.get(sourceNodeId), 
                          JSON.stringify(requestMessage));

      console.log(`✓ Started downloading: ${fileInfo.name}`);
      return transferInfo;

    } catch (error) {
      transferInfo.status = 'failed';
      transferInfo.error = error.message;
      this.emit('download-error', transferInfo);
      throw error;
    }
  }

  // 处理文件相关消息
  async handleFileMessage(message) {
    try {
      const data = JSON.parse(message.data);
      
      switch (data.type) {
        case 'file-available':
          this.handleFileAvailable(data, message.from);
          break;
        case 'file-list-request':
          await this.handleFileListRequest(message.from);
          break;
        case 'file-request':
          await this.handleFileRequest(data, message.from);
          break;
        case 'file-chunk':
          await this.handleFileChunk(data);
          break;
        case 'file-complete':
          await this.handleFileComplete(data);
          break;
      }
    } catch (error) {
      console.error('Error handling file message:', error);
    }
  }

  handleFileAvailable(data, fromNodeId) {
    const fileInfo = { ...data.file, sourceNodeId: fromNodeId };
    this.pendingFiles.set(data.file.hash, fileInfo);
    this.emit('file-discovered', fileInfo);
  }

  async handleFileListRequest(fromNodeId) {
    const fileList = Array.from(this.sharedFiles.values()).map(f => ({
      name: f.name,
      hash: f.hash,
      size: f.size,
      chunks: f.chunks
    }));

    const response = {
      type: 'file-list',
      files: fileList,
      timestamp: Date.now()
    };

    await this.sendToNode(this.nodeManager.discoveredNodes.get(fromNodeId), 
                        JSON.stringify(response));
  }

  async handleFileRequest(data, fromNodeId) {
    const fileInfo = this.sharedFiles.get(data.fileHash);
    if (!fileInfo) {
      const errorMessage = {
        type: 'file-error',
        transferId: data.transferId,
        error: 'File not available',
        timestamp: Date.now()
      };
      
      await this.sendToNode(this.nodeManager.discoveredNodes.get(fromNodeId), 
                          JSON.stringify(errorMessage));
      return;
    }

    await this.sendFile(fromNodeId, data.fileHash, 0, fileInfo.chunks);
  }

  async handleFileChunk(data) {
    const transferInfo = this.activeTransfers.get(data.transferId);
    if (!transferInfo) return;

    try {
      const chunkData = Buffer.from(data.data, 'base64');
      
      // 写入临时文件
      await this.writeChunk(transferInfo.tempPath, data.chunkIndex, chunkData);
      transferInfo.receivedChunks.add(data.chunkIndex);

      // 计算进度
      const progress = (transferInfo.receivedChunks.size / data.totalChunks) * 100;
      transferInfo.progress = progress;
      
      this.emit('download-progress', transferInfo);

      // 检查是否完成
      if (transferInfo.receivedChunks.size === data.totalChunks) {
        await this.finalizeDownload(transferInfo);
      }
    } catch (error) {
      console.error('Error handling file chunk:', error);
    }
  }

  async handleFileComplete(data) {
    const transferInfo = this.activeTransfers.get(data.transferId);
    if (transferInfo && transferInfo.status === 'downloading') {
      await this.finalizeDownload(transferInfo);
    }
  }

  // 读取文件块
  async readChunk(filePath, chunkIndex) {
    const start = chunkIndex * this.chunkSize;
    const stream = fs.createReadStream(filePath, { start, end: start + this.chunkSize - 1 });
    
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  // 写入文件块
  async writeChunk(tempPath, chunkIndex, data) {
    const start = chunkIndex * this.chunkSize;
    
    const fd = await fs.open(tempPath, 'a+');
    try {
      await fd.write(data, 0, data.length, start);
    } finally {
      await fd.close();
    }
  }

  // 完成下载
  async finalizeDownload(transferInfo) {
    try {
      // 验证文件完整性
      const downloadedHash = await this.calculateFileHash(transferInfo.tempPath);
      
      if (downloadedHash === transferInfo.file.hash) {
        await fs.move(transferInfo.tempPath, transferInfo.savePath);
        transferInfo.status = 'completed';
        
        // 添加到共享文件
        await this.addSharedFile(transferInfo.savePath);
        
        this.emit('download-complete', transferInfo);
        console.log(`✓ Download completed: ${transferInfo.file.name}`);
      } else {
        throw new Error('File integrity check failed');
      }
    } catch (error) {
      transferInfo.status = 'failed';
      transferInfo.error = error.message;
      this.emit('download-error', transferInfo);
      await fs.remove(transferInfo.tempPath);
    }
  }

  // 发送消息到特定节点
  async sendToNode(node, message) {
    if (node.addresses.tcp) {
      await this.nodeManager.tcpTransport.sendMessage(
        node.addresses.tcp.address,
        node.addresses.tcp.port,
        message
      );
    } else if (node.addresses.udp) {
      await this.nodeManager.udpTransport.sendMessage(
        node.addresses.udp.address,
        node.addresses.udp.port,
        message
      );
    }
  }

  // 生成传输ID
  generateTransferId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // 格式化文件大小
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 获取文件列表
  getSharedFiles() {
    return Array.from(this.sharedFiles.values());
  }

  getPendingFiles() {
    return Array.from(this.pendingFiles.values());
  }

  getActiveTransfers() {
    return Array.from(this.activeTransfers.values());
  }

  // 取消传输
  async cancelTransfer(transferId) {
    const transfer = this.activeTransfers.get(transferId);
    if (transfer) {
      transfer.status = 'cancelled';
      this.activeTransfers.delete(transferId);
      
      if (transfer.tempPath) {
        await fs.remove(transfer.tempPath);
      }
      
      this.emit('transfer-cancelled', transfer);
    }
  }
}

module.exports = FileTransfer;