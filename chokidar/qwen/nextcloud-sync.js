const { Client } = require('nextcloud-node-client');
const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');

class NextcloudNoteSync {
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

    async initialize() {
        // Create local directory if it doesn't exist
        try {
            await fs.access(this.localNoteDir);
        } catch (error) {
            await fs.mkdir(this.localNoteDir, { recursive: true });
        }

        // Create note files for today
        const today = new Date();
        const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        
        for (let i = 1; i <= 4; i++) {
            const fileName = `d.${dateString}.${String(i).padStart(2, '0')}.md`;
            const filePath = path.join(this.localNoteDir, fileName);
            
            try {
                await fs.access(filePath);
            } catch (error) {
                // File doesn't exist, create it
                await fs.writeFile(filePath, '');
            }
            
            this.noteFiles.push({
                localPath: filePath,
                remotePath: `/Notes/${fileName}`,
                shareUrl: null
            });
        }

        // Create or update files on Nextcloud and set up sharing
        for (const noteFile of this.noteFiles) {
            // Upload file to Nextcloud
            const remoteFile = await this.client.putFileContents(
                noteFile.remotePath,
                await fs.readFile(noteFile.localPath, 'utf8')
            );
            
            // Create public share
            const share = await this.client.createShare({
                path: noteFile.remotePath,
                shareType: 3, // Public link
                permissions: 1 // Read only
            });
            
            noteFile.shareUrl = share.getUrl();
            
            // Write share URL to local file
            const content = await fs.readFile(noteFile.localPath, 'utf8');
            const newContent = `${noteFile.shareUrl}\n${content}`;
            await fs.writeFile(noteFile.localPath, newContent);
        }
        
        // Start watching for file changes
        this.startWatching();
    }

    startWatching() {
        this.watcher = chokidar.watch(this.noteFiles.map(f => f.localPath), {
            persistent: true
        });

        this.watcher.on('change', async (localPath) => {
            const noteFile = this.noteFiles.find(f => f.localPath === localPath);
            if (noteFile) {
                try {
                    // Read the local file content (skip the first line which is the share URL)
                    const content = await fs.readFile(localPath, 'utf8');
                    const lines = content.split('\n');
                    const fileContent = lines.slice(1).join('\n');
                    
                    // Update the remote file
                    await this.client.putFileContents(noteFile.remotePath, fileContent);
                    console.log(`Synced ${path.basename(localPath)} to Nextcloud`);
                } catch (error) {
                    console.error(`Error syncing ${path.basename(localPath)}:`, error.message);
                }
            }
        });
    }

    async shutdown() {
        if (this.watcher) {
            await this.watcher.close();
        }

        // Generate daily summary
        const today = new Date();
        const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const summaryFileName = `d.${dateString}.md`;
        const summaryFilePath = path.join(this.localNoteDir, summaryFileName);
        
        let summaryContent = `# Daily Summary for ${dateString}\n\n`;
        
        // Collect content from note files and remove shares
        for (const noteFile of this.noteFiles) {
            try {
                // Read the local file content (skip the first line which is the share URL)
                const content = await fs.readFile(noteFile.localPath, 'utf8');
                const lines = content.split('\n');
                const fileContent = lines.slice(1).join('\n');
                
                // Add to summary
                summaryContent += `## ${path.basename(noteFile.localPath)}\n\n${fileContent}\n\n`;
                
                // Remove the share
                const shares = await this.client.getShares(noteFile.remotePath);
                for (const share of shares) {
                    if (share.getPath() === noteFile.remotePath) {
                        await this.client.deleteShare(share.getId());
                    }
                }
            } catch (error) {
                console.error(`Error processing ${path.basename(noteFile.localPath)}:`, error.message);
            }
        }
        
        // Write summary file locally
        await fs.writeFile(summaryFilePath, summaryContent);
        
        // Upload summary to Nextcloud
        const remoteSummaryPath = `/Notes/${summaryFileName}`;
        await this.client.putFileContents(remoteSummaryPath, summaryContent);
        
        // Create public share for summary
        const summaryShare = await this.client.createShare({
            path: remoteSummaryPath,
            shareType: 3, // Public link
            permissions: 1 // Read only
        });
        
        console.log(`Daily summary share URL: ${summaryShare.getUrl()}`);
    }
}

module.exports = NextcloudNoteSync;