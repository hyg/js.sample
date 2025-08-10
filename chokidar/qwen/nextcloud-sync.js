const { Client } = require('nextcloud-node-client');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

/**
 * Nextcloud笔记同步类
 * 负责处理本地笔记文件与Nextcloud服务器之间的同步
 */
class NextcloudNoteSync {
    /**
     * 构造函数
     * @param {string} nextcloudUrl - Nextcloud服务器URL
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @param {string} localNoteDir - 本地笔记目录路径
     */
    constructor(nextcloudUrl, username, password, localNoteDir) {
        this.nextcloudUrl = nextcloudUrl;
        this.username = username;
        this.password = password;
        this.localNoteDir = localNoteDir;
        this.noteFiles = [];
        this.watcher = null;
    }

    /**
     * 初始化同步器
     * 1. 创建本地目录（如果不存在）
     * 2. 创建今天的4个笔记文件
     * 3. 在Nextcloud上创建同名文件并设置共享
     * 4. 开始监控文件变化
     */
    async initialize() {
        // 如果本地目录不存在则创建
        try {
            await fs.access(this.localNoteDir);
        } catch (error) {
            await fs.mkdir(this.localNoteDir, { recursive: true });
        }

        // 为今天创建笔记文件
        const today = new Date();
        const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        
        // 确保Notes文件夹存在（在用户空间中）
        try {
            await this.createFolder(`/files/${this.username}/Notes`);
        } catch (error) {
            if (error.message && (error.message.includes('405') || error.message.includes('already exists') || error.message.includes('201'))) {
                // 文件夹已存在或创建成功，忽略错误
                console.log('Notes文件夹已存在');
            } else {
                console.error('创建Notes文件夹时出错:', error.message);
            }
        }
        
        for (let i = 1; i <= 4; i++) {
            const fileName = `d.${dateString}.${String(i).padStart(2, '0')}.md`;
            const filePath = path.join(this.localNoteDir, fileName);
            
            try {
                await fs.access(filePath);
            } catch (error) {
                // 文件不存在，创建空文件
                await fs.writeFile(filePath, '');
            }
            
            this.noteFiles.push({
                localPath: filePath,
                remotePath: `/files/${this.username}/Notes/${fileName}`,
                shareUrl: null
            });
        }

        // 在Nextcloud上创建或更新文件并设置共享
        for (const noteFile of this.noteFiles) {
            // 读取本地文件内容
            let content = await fs.readFile(noteFile.localPath, 'utf8');
            
            // 如果第一行是URL，说明是共享URL，需要移除
            const lines = content.split('\n');
            if (lines[0] && lines[0].startsWith('http')) {
                content = lines.slice(1).join('\n');
            }
            
            // 上传文件到Nextcloud
            try {
                await this.createFile(noteFile.remotePath, content);
                console.log(`创建文件 ${noteFile.remotePath} 成功`);
            } catch (error) {
                if (error.message && error.message.includes('already exists')) {
                    // 文件已存在，更新内容
                    await this.updateFileContent(noteFile.remotePath, content);
                    console.log(`更新文件 ${noteFile.remotePath} 成功`);
                } else {
                    console.error(`创建/更新文件 ${noteFile.remotePath} 失败:`, error.message);
                }
            }
            
            // 创建公开共享
            try {
                const shareUrl = await this.createShare(noteFile.remotePath);
                noteFile.shareUrl = shareUrl;
                
                // 将共享URL写入本地文件第一行
                const newContent = `${noteFile.shareUrl}\n${content}`;
                await fs.writeFile(noteFile.localPath, newContent);
                console.log(`为文件 ${noteFile.remotePath} 创建共享成功`);
            } catch (error) {
                console.error(`创建共享失败 ${noteFile.remotePath}:`, error.message);
            }
        }
        
        // 开始监控文件变化
        this.startWatching();
        
        console.log('Nextcloud笔记同步初始化完成');
    }

    /**
     * 开始监控文件变化
     * 当本地文件被修改时，自动同步到Nextcloud
     */
    startWatching() {
        this.watcher = chokidar.watch(this.noteFiles.map(f => f.localPath), {
            persistent: true
        });

        this.watcher.on('change', async (localPath) => {
            const noteFile = this.noteFiles.find(f => f.localPath === localPath);
            if (noteFile) {
                try {
                    // 读取本地文件内容（跳过第一行的共享URL）
                    const content = await fs.readFile(localPath, 'utf8');
                    const lines = content.split('\n');
                    const fileContent = lines.slice(1).join('\n');
                    
                    // 更新远程文件
                    try {
                        await this.updateFileContent(noteFile.remotePath, fileContent);
                        console.log(`已同步 ${path.basename(localPath)} 到 Nextcloud`);
                    } catch (error) {
                        console.error(`同步 ${path.basename(localPath)} 失败:`, error.message);
                    }
                } catch (error) {
                    console.error(`读取 ${path.basename(localPath)} 时出错:`, error.message);
                }
            }
        });
    }

    /**
     * 关闭同步器
     * 1. 停止文件监控
     * 2. 移除所有共享
     * 3. 合并笔记为每日摘要
     * 4. 上传摘要到Nextcloud并创建共享
     */
    async shutdown() {
        if (this.watcher) {
            await this.watcher.close();
        }

        // 生成每日摘要
        const today = new Date();
        const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const summaryFileName = `d.${dateString}.md`;
        const summaryFilePath = path.join(this.localNoteDir, summaryFileName);
        
        let summaryContent = `# ${dateString} 日摘要\n\n`;
        
        // 收集笔记文件内容并移除共享
        for (const noteFile of this.noteFiles) {
            try {
                // 读取本地文件内容（跳过第一行的共享URL）
                const content = await fs.readFile(noteFile.localPath, 'utf8');
                const lines = content.split('\n');
                const fileContent = lines.slice(1).join('\n');
                
                // 添加到摘要
                summaryContent += `## ${path.basename(noteFile.localPath)}\n\n${fileContent}\n\n`;
                
                // 移除共享
                const shares = await this.getShares(noteFile.remotePath);
                for (const share of shares) {
                    await this.deleteShare(share.id);
                    console.log(`已移除 ${noteFile.remotePath} 的共享`);
                }
            } catch (error) {
                console.error(`处理 ${path.basename(noteFile.localPath)} 时出错:`, error.message);
            }
        }
        
        // 在本地写入摘要文件
        await fs.writeFile(summaryFilePath, summaryContent);
        
        // 上传摘要到Nextcloud
        const remoteSummaryPath = `/files/${this.username}/Notes/${summaryFileName}`;
        try {
            await this.createFile(remoteSummaryPath, summaryContent);
            console.log(`创建摘要文件 ${remoteSummaryPath} 成功`);
        } catch (error) {
            if (error.message && error.message.includes('already exists')) {
                // 文件已存在，更新内容
                await this.updateFileContent(remoteSummaryPath, summaryContent);
                console.log(`更新摘要文件 ${remoteSummaryPath} 成功`);
            } else {
                console.error(`创建/更新摘要文件 ${remoteSummaryPath} 失败:`, error.message);
            }
        }
        
        // 为摘要创建公开共享
        try {
            const summaryShareUrl = await this.createShare(remoteSummaryPath);
            console.log(`每日摘要共享URL: ${summaryShareUrl}`);
        } catch (error) {
            console.error('创建摘要共享失败:', error.message);
        }
    }

    /**
     * 创建文件夹
     * @param {string} folderPath - 文件夹路径
     */
    async createFolder(folderPath) {
        const baseUrl = this.nextcloudUrl.split('/remote.php')[0];
        const url = `${baseUrl}/remote.php/dav${folderPath}`;
        
        try {
            const response = await axios({
                method: 'MKCOL',
                url: url,
                auth: {
                    username: this.username,
                    password: this.password
                }
            });
            return response;
        } catch (error) {
            throw new Error(`创建文件夹失败: ${error.message}`);
        }
    }

    /**
     * 创建文件
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容
     */
    async createFile(filePath, content) {
        const baseUrl = this.nextcloudUrl.split('/remote.php')[0];
        const url = `${baseUrl}/remote.php/dav${filePath}`;
        
        try {
            const response = await axios({
                method: 'PUT',
                url: url,
                auth: {
                    username: this.username,
                    password: this.password
                },
                data: content
            });
            return response;
        } catch (error) {
            throw new Error(`创建文件失败: ${error.message}`);
        }
    }

    /**
     * 更新文件内容
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容
     */
    async updateFileContent(filePath, content) {
        // 更新文件与创建文件使用相同的方法
        await this.createFile(filePath, content);
    }

    /**
     * 创建共享链接
     * @param {string} filePath - 文件路径
     * @returns {string} 共享链接
     */
    async createShare(filePath) {
        // 移除路径前缀，只保留相对路径
        let relativePath = filePath;
        if (relativePath.startsWith('/files/')) {
            // 提取相对路径，例如 /files/username/Notes/file.md -> Notes/file.md
            const parts = relativePath.split('/');
            relativePath = parts.slice(3).join('/');
        }
        
        const baseUrl = this.nextcloudUrl.split('/remote.php')[0];
        const url = `${baseUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares`;
        
        try {
            const response = await axios({
                method: 'POST',
                url: url,
                auth: {
                    username: this.username,
                    password: this.password
                },
                headers: {
                    'OCS-APIRequest': 'true',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `path=${encodeURIComponent(relativePath)}&shareType=3&permissions=1`
            });
            
            if (response.data.ocs.meta.status === 'ok') {
                return response.data.ocs.data.url;
            } else {
                throw new Error(`创建共享失败: ${response.data.ocs.meta.message}`);
            }
        } catch (error) {
            throw new Error(`创建共享失败: ${error.message}`);
        }
    }

    /**
     * 获取共享信息
     * @param {string} filePath - 文件路径
     * @returns {Array} 共享信息列表
     */
    async getShares(filePath) {
        // 移除路径前缀，只保留相对路径
        let relativePath = filePath;
        if (relativePath.startsWith('/files/')) {
            // 提取相对路径，例如 /files/username/Notes/file.md -> Notes/file.md
            const parts = relativePath.split('/');
            relativePath = parts.slice(3).join('/');
        }
        
        const baseUrl = this.nextcloudUrl.split('/remote.php')[0];
        const url = `${baseUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares?path=${encodeURIComponent(relativePath)}`;
        
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                auth: {
                    username: this.username,
                    password: this.password
                },
                headers: {
                    'OCS-APIRequest': 'true',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.ocs.meta.status === 'ok') {
                return response.data.ocs.data;
            } else {
                throw new Error(`获取共享失败: ${response.data.ocs.meta.message}`);
            }
        } catch (error) {
            throw new Error(`获取共享失败: ${error.message}`);
        }
    }

    /**
     * 删除共享
     * @param {number} shareId - 共享ID
     */
    async deleteShare(shareId) {
        const baseUrl = this.nextcloudUrl.split('/remote.php')[0];
        const url = `${baseUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares/${shareId}`;
        
        try {
            const response = await axios({
                method: 'DELETE',
                url: url,
                auth: {
                    username: this.username,
                    password: this.password
                },
                headers: {
                    'OCS-APIRequest': 'true',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.ocs.meta.status !== 'ok') {
                throw new Error(`删除共享失败: ${response.data.ocs.meta.message}`);
            }
        } catch (error) {
            throw new Error(`删除共享失败: ${error.message}`);
        }
    }
}

module.exports = NextcloudNoteSync;