require('dotenv').config();
const { createClient } = require('matrix-js-sdk');
const axios = require('axios');

// 初始化Matrix客户端
const client = createClient({
  baseUrl: process.env.MATRIX_HOMESERVER_URL,
  accessToken: process.env.MATRIX_ACCESS_TOKEN,
  userId: process.env.MATRIX_BOT_USER_ID
});

// 自动加入房间
client.on('RoomMember.membership', async (event, member) => {
  if (member.membership === 'invite' && member.userId === client.getUserId()) {
    try {
      await client.joinRoom(member.roomId);
      console.log(`已自动加入房间: ${member.roomId}`);
    } catch (e) {
      console.error('加入房间失败:', e);
    }
  }
});

// 处理消息事件
client.on('Room.timeline', async (event, room, toStartOfTimeline) => {
  // 忽略历史消息
  if (toStartOfTimeline) return;

  // 忽略自己发送的消息
  if (event.getSender() === client.getUserId()) return;

  // 只处理文本消息
  if (event.getType() !== 'm.room.message' || event.getContent()?.msgtype !== 'm.text') return;

  try {
    // 从MCP服务器获取响应
    const mcpResponse = await axios.post(
      `${process.env.MCP_SERVER_URL}/run`,
      {
        server_name: process.env.MCP_SERVER_NAME,
        tool_name: 'get-library-docs',
        args: { topic: event.getContent().body }
      }
    );

    // 发送响应到Matrix房间
    await client.sendEvent(room.roomId, 'm.room.message', {
      msgtype: 'm.text',
      body: mcpResponse.data.result || '抱歉，我无法获取相关信息。'
    });
  } catch (error) {
    console.error('MCP服务器请求错误:', error);
    await client.sendEvent(room.roomId, 'm.room.message', {
      msgtype: 'm.text',
      body: '处理请求时发生错误，请稍后再试。'
    });
  }
});

// 启动客户端
client.startClient();
console.log('机器人已启动，正在监听消息...');

// 处理连接状态
client.on('sync', (state, prevState, data) => {
  if (state === 'PREPARED') {
    console.log('已成功连接到Matrix服务器');
  } else if (state === 'ERROR') {
    console.error('连接错误:', data.error);
  }
});