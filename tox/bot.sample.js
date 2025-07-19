const toxcore = require('js-toxcore-c');
const fs = require('fs');
const path = require('path');

class ToxBot {
    constructor(options = {}) {
        this.botName = options.name || 'ToxBot';
        this.statusMessage = options.status || '我是一个Tox机器人';
        this.dataFile = options.dataFile || './toxbot.data';
        this.password = options.password || null;
        
        // 命令处理器
        this.commands = new Map();
        this.adminUsers = new Set(options.admins || []);
        
        // 初始化Tox实例
        this.initializeTox();
        this.setupEventHandlers();
        this.registerDefaultCommands();
    }

    initializeTox() {
        const toxOptions = {};
        
        // 如果存在数据文件，加载它
        if (fs.existsSync(this.dataFile)) {
            toxOptions.data = this.dataFile;
            if (this.password) {
                toxOptions.pass = this.password;
            }
        }
        
        try {
            this.tox = new toxcore.Tox(toxOptions);
            console.log('Tox实例初始化成功');
        } catch (error) {
            console.error('Tox初始化失败:', error);
            throw error;
        }
    }

    setupEventHandlers() {
        // 好友请求处理
        this.tox.on('friendRequest', (e) => {
            console.log(`收到好友请求: ${e.publicKeyHex()}`);
            console.log(`消息: ${e.message()}`);
            
            // 自动接受好友请求
            try {
                const friendId = this.tox.addFriendNoRequestSync(e.publicKey());
                console.log(`已添加好友，ID: ${friendId}`);
                this.saveData();
            } catch (error) {
                console.error('添加好友失败:', error);
            }
        });

        // 好友消息处理
        this.tox.on('friendMessage', (e) => {
            const friendId = e.friend();
            const message = e.message();
            const friendName = this.getFriendName(friendId);
            
            console.log(`${friendName} (${friendId}): ${message}`);
            
            // 处理命令
            this.handleMessage(friendId, friendName, message);
        });

        // 好友状态变化
        this.tox.on('friendConnectionStatus', (e) => {
            const friendId = e.friend();
            const friendName = this.getFriendName(friendId);
            const status = e.connectionStatus() ? '上线' : '离线';
            console.log(`${friendName} 已${status}`);
        });

        // 好友名称变化
        this.tox.on('friendName', (e) => {
            const friendId = e.friend();
            const newName = e.name();
            console.log(`好友 ${friendId} 改名为: ${newName}`);
        });

        // 好友状态消息变化
        this.tox.on('friendStatusMessage', (e) => {
            const friendId = e.friend();
            const friendName = this.getFriendName(friendId);
            const statusMsg = e.statusMessage();
            console.log(`${friendName} 状态消息: ${statusMsg}`);
        });
    }

    registerDefaultCommands() {
        // 基础命令
        this.addCommand('help', '显示帮助信息', (friendId, args) => {
            let helpText = '可用命令:\\n';
            for (const [cmd, info] of this.commands) {
                helpText += `/${cmd} - ${info.description}\\n`;
            }
            this.sendMessage(friendId, helpText);
        });

        this.addCommand('ping', '测试连接', (friendId, args) => {
            this.sendMessage(friendId, 'pong! 机器人正常运行中');
        });

        this.addCommand('time', '获取当前时间', (friendId, args) => {
            const now = new Date().toLocaleString('zh-CN');
            this.sendMessage(friendId, `当前时间: ${now}`);
        });

        this.addCommand('info', '获取机器人信息', (friendId, args) => {
            const address = this.tox.getAddressHexSync();
            const friendCount = this.tox.getFriendListSync().length;
            const info = `机器人信息:\\n名称: ${this.botName}\\n地址: ${address}\\n好友数量: ${friendCount}`;
            this.sendMessage(friendId, info);
        });

        // 管理员命令
        this.addCommand('admin', '管理员命令', (friendId, args) => {
            if (!this.isAdmin(friendId)) {
                this.sendMessage(friendId, '权限不足');
                return;
            }
            
            const subCommand = args[0];
            switch (subCommand) {
                case 'list':
                    this.listFriends(friendId);
                    break;
                case 'broadcast':
                    this.broadcast(args.slice(1).join(' '));
                    this.sendMessage(friendId, '消息已广播');
                    break;
                case 'status':
                    const newStatus = args.slice(1).join(' ');
                    this.tox.setStatusMessageSync(newStatus);
                    this.sendMessage(friendId, `状态消息已更新: ${newStatus}`);
                    break;
                default:
                    this.sendMessage(friendId, '管理员子命令: list, broadcast, status');
            }
        });
    }

    addCommand(name, description, handler) {
        this.commands.set(name, { description, handler });
    }

    handleMessage(friendId, friendName, message) {
        // 检查是否为命令
        if (message.startsWith('/')) {
            const parts = message.slice(1).split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);
            
            if (this.commands.has(command)) {
                try {
                    this.commands.get(command).handler(friendId, args);
                } catch (error) {
                    console.error(`命令执行错误 ${command}:`, error);
                    this.sendMessage(friendId, `命令执行失败: ${error.message}`);
                }
            } else {
                this.sendMessage(friendId, `未知命令: ${command}. 使用 /help 查看可用命令`);
            }
        } else {
            // 简单的聊天回复
            this.handleChat(friendId, friendName, message);
        }
    }

    handleChat(friendId, friendName, message) {
        // 简单的关键词回复
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('你好') || lowerMessage.includes('hello')) {
            this.sendMessage(friendId, `你好 ${friendName}! 我是 ${this.botName}，有什么可以帮助你的吗？`);
        } else if (lowerMessage.includes('谢谢') || lowerMessage.includes('thanks')) {
            this.sendMessage(friendId, '不客气！很高兴能帮助你。');
        } else if (lowerMessage.includes('再见') || lowerMessage.includes('bye')) {
            this.sendMessage(friendId, '再见！随时欢迎回来聊天。');
        } else {
            // 默认回复
            this.sendMessage(friendId, `收到你的消息: "${message}". 使用 /help 查看可用命令。`);
        }
    }

    sendMessage(friendId, message) {
        try {
            this.tox.sendFriendMessageSync(friendId, message);
            console.log(`发送消息给 ${this.getFriendName(friendId)}: ${message}`);
        } catch (error) {
            console.error('发送消息失败:', error);
        }
    }

    getFriendName(friendId) {
        try {
            return this.tox.getFriendNameSync(friendId);
        } catch (error) {
            return `Friend_${friendId}`;
        }
    }

    isAdmin(friendId) {
        try {
            const publicKey = this.tox.getFriendPublicKeySync(friendId);
            const publicKeyHex = publicKey.toString('hex').toUpperCase();
            return this.adminUsers.has(publicKeyHex);
        } catch (error) {
            return false;
        }
    }

    listFriends(adminId) {
        try {
            const friends = this.tox.getFriendListSync();
            let friendsList = `好友列表 (${friends.length}):\\n`;
            
            friends.forEach(friendId => {
                const name = this.getFriendName(friendId);
                const isOnline = this.tox.getFriendConnectionStatusSync(friendId);
                const status = isOnline ? '在线' : '离线';
                friendsList += `${friendId}: ${name} (${status})\\n`;
            });
            
            this.sendMessage(adminId, friendsList);
        } catch (error) {
            this.sendMessage(adminId, `获取好友列表失败: ${error.message}`);
        }
    }

    broadcast(message) {
        try {
            const friends = this.tox.getFriendListSync();
            friends.forEach(friendId => {
                if (this.tox.getFriendConnectionStatusSync(friendId)) {
                    this.sendMessage(friendId, `[广播] ${message}`);
                }
            });
        } catch (error) {
            console.error('广播失败:', error);
        }
    }

    bootstrap() {
        // 从官方节点列表引导连接
        const nodes = [
            { host: '23.226.230.47', port: 33445, publicKey: 'A09162D68618E742FFBCA1C2C70385E6679604B2D80EA6E84AD0996A1AC8A074' },
            { host: '104.219.184.206', port: 443, publicKey: '8CD087E31C67568103E8C2A28653337E90E6B8EDA0D765D57C6B5172B4F1F04C' },
            { host: '178.62.250.138', port: 33445, publicKey: '788236D34978D1D5BD822F0A5BEBD2C53C64CC31CD3149350EE27D4D9A2F9B6B' },
            { host: '185.25.116.107', port: 33445, publicKey: 'DA4E4ED4B697F2E9B000EEFE3A34B554ACD3F45F5C96EAEA2516DD7FF9AF7B43' }
        ];

        console.log('开始连接到Tox网络...');
        nodes.forEach(node => {
            try {
                this.tox.bootstrapSync(node.host, node.port, node.publicKey);
                console.log(`已连接到节点: ${node.host}:${node.port}`);
            } catch (error) {
                console.error(`连接节点失败 ${node.host}:`, error);
            }
        });
    }

    saveData() {
        try {
            const data = this.tox.getSaveDataSync();
            if (this.password) {
                // 如果有密码，加密保存
                const encrypted = toxcore.toxEncryptSave(data, this.password);
                fs.writeFileSync(this.dataFile, encrypted);
            } else {
                fs.writeFileSync(this.dataFile, data);
            }
            console.log('数据已保存');
        } catch (error) {
            console.error('保存数据失败:', error);
        }
    }

    start() {
        // 设置机器人信息
        this.tox.setNameSync(this.botName);
        this.tox.setStatusMessageSync(this.statusMessage);
        
        // 连接到网络
        this.bootstrap();
        
        // 显示机器人地址
        const address = this.tox.getAddressHexSync();
        console.log(`\\n机器人已启动！`);
        console.log(`机器人名称: ${this.botName}`);
        console.log(`Tox地址: ${address}`);
        console.log(`将此地址分享给其他人来添加机器人为好友\\n`);
        
        // 启动Tox循环
        this.tox.start();
        
        // 定期保存数据
        setInterval(() => {
            this.saveData();
        }, 30000); // 每30秒保存一次
        
        // 处理退出信号
        process.on('SIGINT', () => {
            console.log('\\n正在关闭机器人...');
            this.saveData();
            process.exit(0);
        });
    }
}

// 使用示例
const bot = new ToxBot({
    name: '小助手机器人',
    status: '我是一个友好的Tox聊天机器人，输入/help获取帮助',
    dataFile: './mybot.tox',
    password: null, // 可选：设置密码来加密保存文件
    admins: [
        // 'ADMIN_PUBLIC_KEY_HEX' // 管理员的公钥（十六进制格式）
    ]
});

// 添加自定义命令
bot.addCommand('weather', '获取天气信息', (friendId, args) => {
    const city = args.join(' ') || '北京';
    bot.sendMessage(friendId, `${city}的天气查询功能尚未实现，请稍后再试。`);
});

bot.addCommand('joke', '讲个笑话', (friendId, args) => {
    const jokes = [
        '为什么程序员喜欢用黑色主题？因为光明会使他们害怕！',
        '有10种人：懂二进制的和不懂二进制的。',
        '程序员的烦恼：Debug时发现bug不在代码里，而在需求里。'
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    bot.sendMessage(friendId, joke);
});

// 启动机器人
if (require.main === module) {
    bot.start();
}

module.exports = ToxBot;