// ccproxy.js
import 'dotenv/config';
import express from 'express';
import axios from 'axios';

const app = express();
const PORT = 3000;

app.use(express.json());

function short(str) {
  return str ? (str.length > 128 ? str.slice(0, 128) + '...' : str) : '';
}

// 接收请求
app.post('/v1/messages', async (req, res) => {
  const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  const inBody = JSON.stringify(req.body);
  //console.log('⬅️ Claude → Proxy', short(inBody));
  console.log('⬅️ Claude → Proxy', inBody);

  // 修正字段
  const outData = {
    model: 'Moonshot-Kimi-K2-Instruct',
    messages: req.body.messages,
    max_tokens: Math.min(8192, Math.max(1, +req.body.max_tokens || 64)),
    temperature: req.body.temperature ?? 0.6,
    stream: req.body.stream ?? false
  };

  try {
    const { data, status } = await axios({
      method: 'POST',
      url,
      headers: { Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}` },
      data: outData
    });
    const outBody = JSON.stringify(data);
    console.log('➡️ Proxy → Bailian', status, short(outBody));
    res.status(status).json(data);
  } catch (e) {
    console.error('❌ Bailian', e.response?.status, short(JSON.stringify(e.response?.data)));
    res.status(e.response?.status || 500).json(e.response?.data || { error: e.message });
  }
});

app.listen(PORT, () => console.log(`✅ 代理 http://localhost:${PORT}/v1/messages`));