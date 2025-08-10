const NextcloudNoteSync = require('./nextcloud-sync');
const fs = require('fs').promises;

/**
 * 主函数
 * 加载配置并启动Nextcloud笔记同步器
 */
async function main() {
    // 加载配置
    let config;
    try {
        const configContent = await fs.readFile('config.json', 'utf8');
        config = JSON.parse(configContent);
    } catch (error) {
        console.error('读取 config.json 时出错:', error.message);
        console.error('请创建一个 config.json 文件，包含您的Nextcloud凭据和设置。');
        process.exit(1);
    }

    const sync = new NextcloudNoteSync(
        config.nextcloudUrl,
        config.username,
        config.password,
        config.localNoteDir
    );

    // 初始化同步器
    await sync.initialize();
    console.log('Nextcloud笔记同步已初始化');

    // 处理优雅关闭
    process.on('SIGINT', async () => {
        console.log('\n正在关闭...');
        await sync.shutdown();
        console.log('关闭完成');
        process.exit(0);
    });
}

main().catch(console.error);