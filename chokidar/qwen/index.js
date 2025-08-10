const NextcloudNoteSync = require('./nextcloud-sync');
require('dotenv').config();

/**
 * 主函数
 * 从环境变量加载配置并启动Nextcloud笔记同步器
 */
async function main() {
    // 从环境变量获取配置
    const nextcloudUrl = process.env.NEXTCLOUD_URL;
    const username = process.env.NEXTCLOUD_USERNAME;
    const password = process.env.NEXTCLOUD_PASSWORD;
    const localNoteDir = process.env.LOCAL_NOTE_DIR || './notes';

    // 验证必要的配置是否存在
    if (!nextcloudUrl || !username || !password) {
        console.error('缺少必要的环境变量配置');
        console.error('请确保在 .env 文件中设置 NEXTCLOUD_URL、NEXTCLOUD_USERNAME 和 NEXTCLOUD_PASSWORD');
        process.exit(1);
    }

    const sync = new NextcloudNoteSync(
        nextcloudUrl,
        username,
        password,
        localNoteDir
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