// XMTP HTTP代理服务器
// 为纯网页客户端提供HTTP API接口
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createSigner } from './bot-node.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 内存存储的消息队列
const messageQueue = new Map();
const responseStore = new Map();

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'XMTP代理服务器运行正常'
    });
});

// 发送消息API
app.post('/send', async (req, res) => {
    try {
        const { botId, message, userAddress } = req.body;
        
        if (!botId || !message) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }
        
        console.log(`收到消息 from ${userAddress || 'anonymous'}: ${message}`);
        
        // 这里应该连接到实际的XMTP机器人
        // 现在先返回模拟的AI回复
        const aiResponse = await generateAIResponse(message);
        
        res.json({
            success: true,
            response: aiResponse,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('消息处理错误:', error);
        res.status(500).json({
            success: false,
            error: '消息处理失败'
        });
    }
});

// 获取消息状态
app.get('/status/:messageId', (req, res) => {
    const { messageId } = req.params;
    const response = responseStore.get(messageId);
    
    if (response) {
        res.json({
            success: true,
            response: response,
            status: 'completed'
        });
    } else {
        res.json({
            success: true,
            status: 'pending'
        });
    }
});

// 模拟AI回复生成
async function generateAIResponse(message) {
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = {
        '你好': '你好！很高兴见到你！我是AI助手，有什么可以帮助你的吗？',
        '帮助': '我可以帮你回答问题、聊天、提供信息等。请告诉我你需要什么帮助！',
        '天气': '抱歉，我无法获取实时天气信息。建议你查看天气应用或网站。',
        '时间': `现在是 ${new Date().toLocaleString('zh-CN')}`,
        '你是谁': '我是基于XMTP协议的AI聊天机器人，可以和你进行智能对话。',
        '怎么用': '直接输入你想说的话，我会尽力回复你。支持中文对话！',
        '再见': '再见！很高兴和你聊天，随时欢迎回来！',
        '谢谢': '不客气！如果还有其他问题，随时问我。',
        '默认': '我理解了你的消息。作为一个AI助手，我会尽力帮助你。你能告诉我更多细节吗？'
    };
    
    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return responses['默认'];
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n🚀 XMTP HTTP代理服务器已启动！`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`💊 健康检查: http://localhost:${PORT}/health`);
    console.log(`📝 API文档:`);
    console.log(`   POST /send - 发送消息`);
    console.log(`   GET /health - 健康检查`);
    console.log(`\n按 Ctrl+C 停止服务器\n`);
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误'
    });
});

export default app;