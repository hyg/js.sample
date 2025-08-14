// XMTP Bot Node - Enhanced Version
// This script starts an XMTP bot node that listens for messages and responds with Qwen AI
// Enhanced with continuous conversation support, detailed logging, retry logic, health monitoring, and graceful shutdown

import dotenv from 'dotenv';
dotenv.config();

// Bot Configuration
const BOT_CONFIG = {
  // AI Model Configuration
  QWEN_API_KEY: process.env.QWEN_API_KEY,
  QWEN_API_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  MODEL_NAME: 'qwen-turbo',
  MAX_TOKENS: 512,
  TEMPERATURE: 0.8,
  TOP_P: 0.8,
  
  // Conversation Settings
  MAX_HISTORY_LENGTH: 10, // Keep last 10 exchanges per conversation
  ENABLE_CONTEXT: true,  // Enable conversation context
  
  // Logging Configuration
  ENABLE_DETAILED_LOGGING: process.env.DEBUG_XMTP_BOT === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
  
  // Health Monitoring
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  IDLE_THRESHOLD: 300000, // 5 minutes without messages
  
  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // Base delay in ms
};

// Conversation history storage (simple in-memory storage)
const conversationHistory = new Map();

// Enhanced conversation statistics
const conversationStats = {
  totalMessages: 0,
  totalResponses: 0,
  totalApiCalls: 0,
  totalErrors: 0,
  startTime: Date.now(),
  conversationStartTimes: new Map(),
  responseTimes: [],
  lastMessageTimes: new Map()
};

// Function to get response from Qwen AI with enhanced logging
async function getQwenResponse(message, conversationId = null) {
  const requestStartTime = Date.now();
  conversationStats.totalApiCalls++;
  
  if (!BOT_CONFIG.QWEN_API_KEY) {
    console.error('❌ QWEN_API_KEY 环境变量未设置');
    conversationStats.totalErrors++;
    return "Qwen AI is not configured properly.";
  }

  try {
    // Build messages array with conversation history
    const messages = [];
    
    // Add conversation history if available
    if (conversationId && conversationHistory.has(conversationId)) {
      const history = conversationHistory.get(conversationId);
      messages.push(...history);
    }
    
    // Add current message
    messages.push({
      "role": "user",
      "content": message
    });

    // 详细显示发送给LLM的完整请求
    if (BOT_CONFIG.ENABLE_DETAILED_LOGGING || BOT_CONFIG.LOG_LEVEL === 'debug') {
      console.log('\n🔍 LLM API 请求详情:');
      console.log('─'.repeat(50));
      console.log(`📤 请求URL: ${BOT_CONFIG.QWEN_API_URL}`);
      console.log(`🤖 模型: ${BOT_CONFIG.MODEL_NAME}`);
      console.log(`📝 输入消息数: ${messages.length}`);
      console.log(`🔧 参数: max_tokens=${BOT_CONFIG.MAX_TOKENS}, temperature=${BOT_CONFIG.TEMPERATURE}, top_p=${BOT_CONFIG.TOP_P}`);
      
      console.log('\n📋 完整消息历史:');
      messages.forEach((msg, index) => {
        const role = msg.role === 'user' ? '用户' : '助手';
        console.log(`   ${index + 1}. ${role}: ${msg.content}`);
      });
      console.log('─'.repeat(50));
    }

    const response = await fetch(BOT_CONFIG.QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BOT_CONFIG.QWEN_API_KEY}`
      },
      body: JSON.stringify({
        "model": BOT_CONFIG.MODEL_NAME,
        "input": {
          "messages": messages
        },
        "parameters": {
          "max_tokens": BOT_CONFIG.MAX_TOKENS,
          "temperature": BOT_CONFIG.TEMPERATURE,
          "top_p": BOT_CONFIG.TOP_P
        }
      })
    });

    const responseTime = Date.now() - requestStartTime;
    const data = await response.json();
    
    // 记录响应时间统计
    conversationStats.responseTimes.push(responseTime);
    if (conversationStats.responseTimes.length > 100) {
      conversationStats.responseTimes = conversationStats.responseTimes.slice(-100);
    }
    
    if (BOT_CONFIG.ENABLE_DETAILED_LOGGING || BOT_CONFIG.LOG_LEVEL === 'debug') {
      console.log('\n📥 LLM API 响应详情:');
      console.log('─'.repeat(50));
      console.log(`⏱️ API响应时间: ${responseTime}ms`);
      console.log(`📊 HTTP状态码: ${response.status}`);
      console.log(`🔗 请求ID: ${data.request_id || 'N/A'}`);
    }
    
    if (data.output && data.output.text) {
      const responseText = data.output.text;
      conversationStats.totalResponses++;
      
      if (BOT_CONFIG.ENABLE_DETAILED_LOGGING || BOT_CONFIG.LOG_LEVEL === 'debug') {
        console.log(`✅ API调用成功`);
        console.log(`💬 响应长度: ${responseText.length} 字符`);
        console.log(`📝 使用token: ${data.usage?.input_tokens || 'N/A'} 输入, ${data.usage?.output_tokens || 'N/A'} 输出`);
        console.log('─'.repeat(50));
      }
      
      // Update conversation history
      if (conversationId && BOT_CONFIG.ENABLE_CONTEXT) {
        updateConversationHistory(conversationId, message, responseText);
      }
      
      return responseText;
    } else {
      conversationStats.totalErrors++;
      console.error('❌ LLM API 响应格式异常:', data);
      console.error(`🔍 错误代码: ${data.code || 'N/A'}`);
      console.error(`📝 错误消息: ${data.message || 'N/A'}`);
      if (BOT_CONFIG.ENABLE_DETAILED_LOGGING || BOT_CONFIG.LOG_LEVEL === 'debug') {
        console.log('─'.repeat(50));
      }
      return "Sorry, I couldn't process that request.";
    }
  } catch (error) {
    const errorTime = Date.now() - requestStartTime;
    console.error('\n❌ LLM API 调用失败:');
    console.error('─'.repeat(50));
    console.error(`⏱️ 失败时间: ${errorTime}ms`);
    console.error(`🔴 错误类型: ${error.name}`);
    console.error(`📝 错误信息: ${error.message}`);
    const online = (typeof navigator !== 'undefined' && typeof navigator.onLine !== 'undefined') ? navigator.onLine : true;
    console.error(`🌐 网络状态: ${online ? '在线' : '离线'}`);
    console.error('─'.repeat(50));
    return "Sorry, I'm having trouble connecting to the AI service.";
  }
}

// Update conversation history with enhanced logging
function updateConversationHistory(conversationId, userMessage, botResponse) {
  const isNewConversation = !conversationHistory.has(conversationId);
  
  if (isNewConversation) {
    conversationHistory.set(conversationId, []);
    console.log(`📝 创建新对话历史: ${conversationId}`);
  }
  
  const history = conversationHistory.get(conversationId);
  const oldLength = history.length;
  
  // Add user message
  history.push({
    "role": "user",
    "content": userMessage
  });
  
  // Add bot response
  history.push({
    "role": "assistant",
    "content": botResponse
  });
  
  // Keep only the last MAX_HISTORY_LENGTH messages
  if (history.length > BOT_CONFIG.MAX_HISTORY_LENGTH * 2) { // *2 because each exchange has 2 messages
    const removedCount = history.length - (BOT_CONFIG.MAX_HISTORY_LENGTH * 2);
    conversationHistory.set(conversationId, history.slice(-BOT_CONFIG.MAX_HISTORY_LENGTH * 2));
    console.log(`🔄 对话历史清理: 移除了 ${removedCount / 2} 轮旧对话`);
  }
  
  const newLength = conversationHistory.get(conversationId).length;
  const exchangeCount = newLength / 2;
  
  console.log(`📚 对话历史更新:`);
  console.log(`   🆔 对话ID: ${conversationId}`);
  console.log(`   📊 状态: ${isNewConversation ? '新建' : '更新'}`);
  console.log(`   📈 历史长度: ${oldLength / 2} → ${exchangeCount} 轮对话`);
  console.log(`   📝 当前消息数: ${newLength} 条`);
  console.log(`   🗂️  总对话数: ${conversationHistory.size}`);
  
  // 如果启用了详细调试，显示最新的对话内容
  if (BOT_CONFIG.ENABLE_DETAILED_LOGGING || BOT_CONFIG.LOG_LEVEL === 'debug') {
    console.log(`\n📋 最新对话内容:`);
    console.log(`   👤 用户: "${userMessage}"`);
    console.log(`   🤖 助手: "${botResponse.substring(0, 100)}${botResponse.length > 100 ? '...' : ''}"`);
  }
}

// Create a custom signer for EOA (Externally Owned Account)
async function createSigner(wallet) {
  return {
    type: "EOA",
    getIdentifier: () => ({
      identifier: wallet.address.toLowerCase(),
      identifierKind: 0  // Ethereum = 0, Passkey = 1
    }),
    signMessage: async (message) => {
      const signature = await wallet.signMessage(message);
      // Convert hex string to Uint8Array
      return new Uint8Array(Buffer.from(signature.slice(2), 'hex'));
    }
  };
}

// Initialize XMTP client
async function initializeXMTPClient() {
  console.log('Starting initializeXMTPClient...');
  try {
    console.log('Importing XMTP client and Ethers...');
    // Import the XMTP client from the local built SDK
    const { Client } = await import('./xmtp-js/sdks/node-sdk/dist/index.js');
    const { Wallet } = await import('ethers');
    const { generateInboxId } = await import('./xmtp-js/sdks/node-sdk/dist/index.js');
    console.log('XMTP client and Ethers imported successfully.');
    
    console.log('Setting up file paths...');
    // Load wallet from file or create new one
    const fs = await import('fs');
    const path = await import('path');
    const WALLET_FILE = path.join(process.cwd(), 'bot-wallet.json');
    console.log('File paths set up. Wallet file path:', WALLET_FILE);
    
    let wallet;
    if (fs.existsSync(WALLET_FILE)) {
      console.log('Loading existing bot wallet...');
      const walletData = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
      wallet = new Wallet(walletData.privateKey);
      console.log('Bot wallet loaded. Address:', wallet.address);
    } else {
      console.log('Creating new bot wallet...');
      wallet = Wallet.createRandom();
      // Save wallet to file
      fs.writeFileSync(WALLET_FILE, JSON.stringify({
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase
      }, null, 2));
      console.log('Bot wallet saved to', WALLET_FILE);
    }

    console.log('Creating signer...');
    // Create a signer
    const signer = await createSigner(wallet);
    console.log('Signer created successfully.');
    
    console.log('Creating XMTP client with dbPath:', path.join(process.cwd(), 'bot.db3'));
    // Create an XMTP client
    const xmtp = await Client.create(signer, { 
      env: 'dev',
      dbPath: path.join(process.cwd(), 'bot.db3')
    });
    console.log('XMTP bot client created for address:', xmtp.accountIdentifier);
    console.log('XMTP bot inbox ID:', xmtp.inboxId);
    
    return { xmtp, wallet };
  } catch (error) {
    console.error('Error initializing XMTP client:', error);
    throw error;
  }
}

async function listenForMessages(xmtp) {
  console.log('Bot is listening for messages...');
  
  try {
    console.log('Creating conversation stream...');
    // Create a message stream
    const stream = await xmtp.conversations.stream();
    console.log('Conversation stream created. Starting to iterate...');
    
    // Process each conversation as it comes in
    for await (const conversation of stream) {
      console.log(`New conversation started with inbox ID: ${conversation.id}`);
      
      // Handle each conversation in a separate async function to avoid blocking
      handleConversation(xmtp, conversation);
    }
  } catch (streamError) {
    console.error('Error creating or iterating conversation stream:', streamError);
    // Try to restart the stream after a delay
    console.log('Attempting to restart conversation stream in 5 seconds...');
    setTimeout(() => {
      listenForMessages(xmtp).catch(console.error);
    }, 5000);
  }
}

// Add a new function to listen for all messages directly
async function listenForAllMessages(xmtp) {
  console.log('Bot is listening for all messages...');
  
  try {
    console.log('Creating all messages stream...');
    // Create a stream for all messages
    const stream = await xmtp.conversations.streamAllMessages();
    console.log('All messages stream created. Starting to iterate...');
    
    // Process each message as it comes in
    for await (const message of stream) {
      const content = typeof message.content === 'function' ? message.content() : message.content;
      console.log(`Received message from ${message.senderInboxId}: ${content}`);
      
      // Skip messages sent by the bot itself
      if (message.senderInboxId !== xmtp.inboxId) {
        // Handle the message with better error handling and retry logic
        await handleMessage(xmtp, message);
      } else {
        console.log('Skipping message sent by bot itself');
      }
    }
  } catch (streamError) {
    console.error('Error creating or iterating all messages stream:', streamError);
    // Try to restart the stream after a delay
    console.log('Attempting to restart all messages stream in 5 seconds...');
    setTimeout(() => {
      listenForAllMessages(xmtp).catch(console.error);
    }, 5000);
  }
}

// Enhanced message handling function with detailed logging
async function handleMessage(xmtp, message) {
  const startTime = Date.now();
  const messageTimestamp = new Date().toISOString();
  
  try {
    // Update statistics
    messageCount++;
    conversationStats.totalMessages++;
    lastMessageTime = Date.now();
    isHealthy = true;
    
    // 记录对话统计
    if (!conversationStats.conversationStartTimes.has(message.conversationId)) {
      conversationStats.conversationStartTimes.set(message.conversationId, Date.now());
    }
    conversationStats.lastMessageTimes.set(message.conversationId, Date.now());
    
    // 详细日志：收到客户端消息
    console.log('\n' + '='.repeat(80));
    console.log(`📨 [${messageTimestamp}] 收到新消息`);
    console.log('─'.repeat(80));
    console.log(`👤 发送者: ${message.senderInboxId}`);
    {
      const content = typeof message.content === 'function' ? message.content() : message.content;
      console.log(`💬 消息内容: "${content}"`);
    }
    console.log(`🆔 对话ID: ${message.conversationId}`);
    console.log(`📊 总处理消息数: ${messageCount}`);
    console.log('─'.repeat(80));
    
    // 检查对话历史
    const hasHistory = conversationHistory.has(message.conversationId);
    const historyLength = hasHistory ? conversationHistory.get(message.conversationId).length : 0;
    console.log(`📚 对话历史状态: ${hasHistory ? '存在' : '新建'} (${historyLength} 条历史消息)`);
    
    // 显示发送给LLM的消息
    console.log('\n🤖 发送到LLM模型:');
    console.log('─'.repeat(40));
    {
      const content = typeof message.content === 'function' ? message.content() : message.content;
      console.log(`📝 用户消息: "${content}"`);
    }
    
    if (hasHistory) {
      console.log(`📚 包含历史对话: ${historyLength / 2} 轮`);
      const history = conversationHistory.get(message.conversationId);
      history.forEach((msg, index) => {
        const role = msg.role === 'user' ? '用户' : '助手';
        console.log(`   ${index + 1}. ${role}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
      });
    }
    console.log('─'.repeat(40));
    
    // Get response from Qwen AI with retry logic and conversation history
    console.log('\n⏳ 正在等待LLM响应...');
    {
      const content = typeof message.content === 'function' ? message.content() : message.content;
      var aiResponse = await getQwenResponseWithRetry(content, message.conversationId);
    }
    const responseTime = Date.now() - startTime;
    
    // 显示LLM响应
    console.log('\n🤖 LLM模型响应:');
    console.log('─'.repeat(40));
    console.log(`⏱️ 响应时间: ${responseTime}ms`);
    console.log(`💬 AI回复: "${aiResponse}"`);
    console.log('─'.repeat(40));
    
    // Find the conversation for this message
    console.log('\n📤 准备发送响应给客户端...');
    const conversation = await xmtp.conversations.getConversationById(message.conversationId);
    
      if (conversation) {
      console.log(`✅ 找到对话: ${conversation.id}`);
      // Send the AI response back with retry logic
      console.log('📤 正在发送响应...');
        const sendResult = await sendMessageWithRetry(conversation, aiResponse);
        const sentId = typeof sendResult === 'string' ? sendResult : (sendResult && sendResult.id ? sendResult.id : 'unknown');
        console.log(`✅ 响应发送成功! 消息ID: ${sentId}`);
    } else {
      console.log('⚠️ 未找到对话，正在创建新对话...');
      // Try to create a new conversation with the sender
      try {
        const newConversation = await xmtp.conversations.newDm(message.senderInboxId);
          const sendResult = await sendMessageWithRetry(newConversation, aiResponse);
          const sentId = typeof sendResult === 'string' ? sendResult : (sendResult && sendResult.id ? sendResult.id : 'unknown');
          console.log(`✅ 通过新对话发送成功! 消息ID: ${sentId}`);
      } catch (createError) {
        console.error('❌ 创建新对话失败:', createError);
      }
    }
    
    // 最终统计
    const totalTime = Date.now() - startTime;
    console.log('\n📊 对话完成统计:');
    console.log('─'.repeat(40));
    console.log(`⏱️ 总耗时: ${totalTime}ms`);
    console.log(`📝 当前对话历史长度: ${conversationHistory.get(message.conversationId)?.length || 0} 条`);
    console.log(`🔢 活跃对话数: ${conversationHistory.size}`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('\n❌ 处理消息时发生错误:');
    console.error('─'.repeat(40));
    console.error(`⏱️ 错误发生时间: ${errorTime}ms`);
    {
      const content = typeof message.content === 'function' ? message.content() : message.content;
      console.error(`📨 原始消息: "${content}"`);
    }
    console.error(`👤 发送者: ${message.senderInboxId}`);
    console.error(`❌ 错误类型: ${error.name}`);
    console.error(`❌ 错误信息: ${error.message}`);
    console.error(`❌ 错误堆栈: ${error.stack}`);
    console.error('─'.repeat(40));
    
    isHealthy = false;
    
    // Try to send an error message back
    try {
      const conversation = await xmtp.conversations.getConversationById(message.conversationId);
      if (conversation) {
        const errorMessage = '抱歉，我暂时无法处理您的消息，请稍后再试。';
        await conversation.send(errorMessage);
        console.log(`📤 已发送错误消息给用户: "${errorMessage}"`);
      }
    } catch (sendError) {
      console.error('❌ 发送错误消息失败:', sendError);
    }
    console.error('='.repeat(80) + '\n');
  }
}

// Retry logic for Qwen AI
async function getQwenResponseWithRetry(message, conversationId = null, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getQwenResponse(message, conversationId);
    } catch (error) {
      console.error(`Attempt ${attempt} failed for Qwen AI:`, error);
      if (attempt === maxRetries) {
        return "抱歉，AI服务暂时不可用，请稍后再试。";
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Retry logic for sending messages
async function sendMessageWithRetry(conversation, message, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await conversation.send(message);
    } catch (error) {
      console.error(`Attempt ${attempt} failed to send message:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function handleConversation(xmtp, conversation) {
  try {
    console.log(`Creating message stream for conversation ${conversation.id}...`);
    // Listen for messages in this conversation
    const messageStream = await conversation.stream();
    console.log(`Message stream for conversation ${conversation.id} created. Starting to iterate...`);
    for await (const message of messageStream) {
      // Skip messages sent by the bot itself
      if (message.senderInboxId !== xmtp.inboxId) {
        const content = typeof message.content === 'function' ? message.content() : message.content;
        console.log(`Received message from ${message.senderInboxId}: ${content}`);
        
        // Get response from Qwen AI
        console.log('Getting response from Qwen AI...');
        const aiResponse = await getQwenResponse(content);
        console.log(`AI response generated: ${aiResponse}`);
        
        // Send the AI response back
        console.log('Sending response back to sender...');
        await conversation.send(aiResponse);
        console.log('Response sent successfully.');
      } else {
        const content = typeof message.content === 'function' ? message.content() : message.content;
        console.log(`Skipping message sent by bot itself: ${content}`);
      }
    }
  } catch (conversationError) {
    console.error(`Error in conversation ${conversation.id}:`, conversationError);
    // We don't re-throw the error to avoid stopping the entire message stream
  }
}

// Connection health monitoring
let isHealthy = true;
let lastMessageTime = Date.now();
let messageCount = 0;

// Generate detailed statistics report
function generateStatsReport() {
  const uptime = Date.now() - conversationStats.startTime;
  const uptimeSeconds = Math.floor(uptime / 1000);
  const uptimeMinutes = Math.floor(uptimeSeconds / 60);
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  
  // Calculate average response time
  const avgResponseTime = conversationStats.responseTimes.length > 0 
    ? Math.round(conversationStats.responseTimes.reduce((a, b) => a + b, 0) / conversationStats.responseTimes.length)
    : 0;
  
  // Calculate success rate
  const successRate = conversationStats.totalApiCalls > 0
    ? ((conversationStats.totalResponses / conversationStats.totalApiCalls) * 100).toFixed(1)
    : 0;
  
  return {
    uptime: `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`,
    totalMessages: conversationStats.totalMessages,
    totalResponses: conversationStats.totalResponses,
    totalApiCalls: conversationStats.totalApiCalls,
    totalErrors: conversationStats.totalErrors,
    successRate: `${successRate}%`,
    avgResponseTime: `${avgResponseTime}ms`,
    activeConversations: conversationHistory.size,
    totalConversations: conversationStats.conversationStartTimes.size,
    messagesPerMinute: uptimeMinutes > 0 ? (conversationStats.totalMessages / uptimeMinutes).toFixed(2) : 0
  };
}

// Enhanced health check function with detailed logging
function performHealthCheck() {
  const now = Date.now();
  const timeSinceLastMessage = now - lastMessageTime;
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const stats = generateStatsReport();
  
  console.log('\n🔍 健康检查报告:');
  console.log('─'.repeat(50));
  console.log(`⏱️  运行时间: ${stats.uptime}`);
  console.log(`💚 健康状态: ${isHealthy ? '正常' : '异常'}`);
  console.log(`📊 处理消息总数: ${stats.totalMessages}`);
  console.log(`🗂️  活跃对话数: ${stats.activeConversations}`);
  console.log(`📈 平均每分钟消息: ${stats.messagesPerMinute}`);
  
  if (timeSinceLastMessage > BOT_CONFIG.IDLE_THRESHOLD) {
    console.log(`⚠️  长时间无消息: ${Math.floor(timeSinceLastMessage / 1000)} 秒`);
  } else {
    console.log(`📨 最后消息: ${Math.floor(timeSinceLastMessage / 1000)} 秒前`);
  }
  
  // API 统计
  console.log(`🤖 AI API 统计:`);
  console.log(`   📞 总调用次数: ${stats.totalApiCalls}`);
  console.log(`   ✅ 成功响应: ${stats.totalResponses}`);
  console.log(`   ❌ 错误次数: ${stats.totalErrors}`);
  console.log(`   📊 成功率: ${stats.successRate}`);
  console.log(`   ⏱️  平均响应时间: ${stats.avgResponseTime}`);
  
  // 内存使用情况
  console.log(`💾 内存使用:`);
  console.log(`   RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
  console.log(`   Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`   External: ${Math.round(memoryUsage.external / 1024 / 1024)} MB`);
  
  // 对话历史详情
  if (conversationHistory.size > 0) {
    console.log(`📚 对话历史详情:`);
    let totalMessages = 0;
    conversationHistory.forEach((history, conversationId) => {
      const exchanges = history.length / 2;
      totalMessages += history.length;
      const lastActive = conversationStats.lastMessageTimes.get(conversationId);
      const timeSinceActive = lastActive ? Math.floor((now - lastActive) / 1000) : '未知';
      console.log(`   🆔 ${conversationId.substring(0, 8)}...: ${exchanges} 轮对话 (${timeSinceActive}s 前)`);
    });
    console.log(`   📊 总消息数: ${totalMessages} 条`);
  }
  
  // 网络状态
  const online = (typeof navigator !== 'undefined' && typeof navigator.onLine !== 'undefined') ? navigator.onLine : true;
  console.log(`🌐 网络状态: ${online ? '在线' : '离线'}`);
  
  console.log('─'.repeat(50));
}

// Set up periodic health checks
function startHealthMonitoring() {
  setInterval(performHealthCheck, BOT_CONFIG.HEALTH_CHECK_INTERVAL);
  console.log(`✅ 健康监控已启动 (每 ${BOT_CONFIG.HEALTH_CHECK_INTERVAL / 1000} 秒检查一次)`);
}

// Graceful shutdown handler
function setupGracefulShutdown(xmtp) {
  const shutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    
    try {
      // Save conversation history to file for persistence
      const fs = await import('fs');
      const path = await import('path');
      const historyFile = path.join(process.cwd(), 'conversation-history.json');
      
      const historyData = {};
      for (const [conversationId, messages] of conversationHistory.entries()) {
        historyData[conversationId] = messages;
      }
      
      fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2));
      console.log(`Conversation history saved to ${historyFile}`);
      
      // Close XMTP client if possible
      if (xmtp && typeof xmtp.close === 'function') {
        await xmtp.close();
        console.log("XMTP client closed");
      }
      
      console.log("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      console.error("Error during graceful shutdown:", error);
      process.exit(1);
    }
  };
  
  // Handle different shutdown signals
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));
  
  console.log("Graceful shutdown handlers set up");
}

async function main() {
  const startTime = Date.now();
  console.log('\n' + '='.repeat(80));
  console.log('🤖 XMTP Bot Node (增强版) 正在启动...');
  console.log('='.repeat(80));
  console.log(`📅 启动时间: ${new Date().toLocaleString()}`);
  console.log(`🔧 Node.js 版本: ${process.version}`);
  console.log(`💻 平台: ${process.platform} ${process.arch}`);
  console.log(`📁 工作目录: ${process.cwd()}`);
  console.log('='.repeat(80));
  
  try {
    // Test Qwen AI integration
    console.log('\n🧪 测试 Qwen AI 集成...');
    const testStartTime = Date.now();
    const testResponse = await getQwenResponse("Hello, how are you?");
    const testTime = Date.now() - testStartTime;
    console.log(`✅ Qwen AI 测试完成 (${testTime}ms)`);
    console.log(`💬 测试响应: "${testResponse}"`);
    
    // Initialize XMTP client
    console.log('\n🔗 初始化 XMTP 客户端...');
    const xmtpStartTime = Date.now();
    const { xmtp, wallet } = await initializeXMTPClient();
    const xmtpTime = Date.now() - xmtpStartTime;
    console.log(`✅ XMTP 客户端初始化完成 (${xmtpTime}ms)`);
    console.log(`💰 钱包地址: ${wallet.address}`);
    console.log(`📮 收件箱ID: ${xmtp.inboxId}`);
    
    // Save bot inbox ID to file for client to use
    console.log('\n💾 保存收件箱ID到文件...');
    const fs = await import('fs');
    const path = await import('path');
    const inboxIdFile = path.join(process.cwd(), 'bot-inbox-id.txt');
    fs.writeFileSync(inboxIdFile, xmtp.inboxId);
    console.log(`✅ 收件箱ID已保存到: ${inboxIdFile}`);
    
    // Load conversation history if available
    console.log('\n📚 加载对话历史...');
    try {
      const historyFile = path.join(process.cwd(), 'conversation-history.json');
      if (fs.existsSync(historyFile)) {
        const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        for (const [conversationId, messages] of Object.entries(historyData)) {
          conversationHistory.set(conversationId, messages);
        }
        console.log(`✅ 已加载 ${conversationHistory.size} 个对话的历史记录`);
      } else {
        console.log('ℹ️  未找到对话历史文件，将创建新的历史记录');
      }
    } catch (loadError) {
      console.log(`⚠️  无法加载对话历史: ${loadError.message}`);
    }
    
    // Set up health monitoring and graceful shutdown
    console.log('\n🔧 设置系统监控...');
    startHealthMonitoring();
    setupGracefulShutdown(xmtp);
    console.log('✅ 健康监控和优雅关闭已配置');
    
    // Listen for all messages
    console.log('\n👂 开始监听所有消息...');
    await listenForAllMessages(xmtp);
    
    const totalTime = Date.now() - startTime;
    console.log('\n🎉 Bot 启动完成!');
    console.log('─'.repeat(50));
    console.log(`⏱️  总启动时间: ${totalTime}ms`);
    console.log(`🤖 Bot 状态: 运行中`);
    console.log(`📮 收件箱ID: ${xmtp.inboxId}`);
    console.log(`💰 钱包地址: ${wallet.address}`);
    console.log(`🧠 AI 模型: ${BOT_CONFIG.MODEL_NAME}`);
    console.log(`📚 最大历史: ${BOT_CONFIG.MAX_HISTORY_LENGTH} 轮对话`);
    console.log(`🔧 详细日志: ${BOT_CONFIG.ENABLE_DETAILED_LOGGING ? '启用' : '禁用'}`);
    console.log(`📝 日志级别: ${BOT_CONFIG.LOG_LEVEL}`);
    console.log('─'.repeat(50));
    console.log('💡 提示: Bot 现在可以接收和回复消息了!');
    console.log('='.repeat(80) + '\n');
    
    // Keep the bot running with periodic checks
    setInterval(() => {
      // This interval keeps the process alive and performs periodic checks
      if (!isHealthy) {
        console.log('🔄 尝试从异常状态恢复...');
        // Recovery logic could be added here
      }
    }, 30000); // Check every 30 seconds
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('\n❌ 启动过程中发生错误:');
    console.error('─'.repeat(50));
    console.error(`⏱️  错误时间: 启动后 ${errorTime}ms`);
    console.error(`🔴 错误类型: ${error.name}`);
    console.error(`📝 错误信息: ${error.message}`);
    console.error(`📚 错误堆栈: ${error.stack}`);
    console.error('─'.repeat(50));
    console.error('❌ Bot 启动失败，请检查配置和网络连接');
    console.error('='.repeat(80) + '\n');
    // Exit with error code to indicate failure
    process.exit(1);
  }
}

main().catch(console.error);