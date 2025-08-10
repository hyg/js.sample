const { Client } = require('nextcloud-node-client');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');

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
        this.client = new Client({
            url: nextcloudUrl,
            username: username,
            password: password
        });
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
                remotePath: `/Notes/${fileName}`,
                shareUrl: null
            });
        }

        // 在Nextcloud上创建或更新文件并设置共享
        for (const noteFile of this.noteFiles) {
            // 上传文件到Nextcloud
            const remoteFile = await this.client.putFileContents(
                noteFile.remotePath,
                await fs.readFile(noteFile.localPath, 'utf8')
            );
            
            // 创建公开共享
            const share = await this.client.createShare({
                path: noteFile.remotePath,
                shareType: 3, // 公开链接
                permissions: 1 // 只读
            });
            
            noteFile.shareUrl = share.getUrl();
            
            // 将共享URL写入本地文件第一行
            const content = await fs.readFile(noteFile.localPath, 'utf8');
            const newContent = `${noteFile.shareUrl}\n${content}`;
            await fs.writeFile(noteFile.localPath, newContent);
        }
        
        // 开始监控文件变化
        this.startWatching();
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
                    await this.client.putFileContents(noteFile.remotePath, fileContent);
                    console.log(`已同步 ${path.basename(localPath)} 到 Nextcloud`);
                } catch (error) {
                    console.error(`同步 ${path.basename(localPath)} 时出错:`, error.message);
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
                const shares = await this.client.getShares(noteFile.remotePath);
                for (const share of shares) {
                    if (share.getPath() === noteFile.remotePath) {
                        await this.client.deleteShare(share.getId());
                    }
                }
            } catch (error) {
                console.error(`处理 ${path.basename(noteFile.localPath)} 时出错:`, error.message);
            }
        }
        
        // 在本地写入摘要文件
        await fs.writeFile(summaryFilePath, summaryContent);
        
        // 上传摘要到Nextcloud
        const remoteSummaryPath = `/Notes/${summaryFileName}`;
        await this.client.putFileContents(remoteSummaryPath, summaryContent);
        
        // 为摘要创建公开共享
        const summaryShare = await this.client.createShare({
            path: remoteSummaryPath,
            shareType: 3, // 公开链接
            permissions: 1 // 只读
        });
        
        console.log(`每日摘要共享URL: ${summaryShare.getUrl()}`);
    }
}

module.exports = NextcloudNoteSync;