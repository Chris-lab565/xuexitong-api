const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行中' });
});

// 获取作业列表
app.get('/api/homework', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(400).json({ error: '缺少 sessionId' });
  }

  try {
    const response = await axios.get('https://mooc1-api.chaoxing.com/mooc-ans/work/getAllWork', {
      headers: {
        'Cookie': `JSESSIONID=${sessionId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('获取作业失败:', error.message);
    res.status(500).json({ error: '获取作业失败', message: error.message });
  }
});

// 获取题目详情
app.get('/api/homework/:workId/questions', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  const { workId } = req.params;
  const { doUrl } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({ error: '缺少 sessionId' });
  }

  try {
    const response = await axios.get(doUrl, {
      headers: {
        'Cookie': `JSESSIONID=${sessionId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('获取题目失败:', error.message);
    res.status(500).json({ error: '获取题目失败', message: error.message });
  }
});

// AI 生成答案 - 用户自备 API Key
app.post('/api/ai/answer', async (req, res) => {
  const { question, apiKey, model = 'gpt-3.5-turbo' } = req.body;
  
  if (!question || !apiKey) {
    return res.status(400).json({ error: '缺少题目或 API Key' });
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: model,
      messages: [
        { role: 'system', content: '你是一个学习助手，请根据题目给出简洁准确的答案。' },
        { role: 'user', content: question }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const answer = response.data.choices[0].message.content;
    res.json({ answer });
  } catch (error) {
    console.error('AI 请求失败:', error.message);
    res.status(500).json({ error: 'AI 请求失败', message: error.message });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
