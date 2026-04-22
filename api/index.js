const axios = require('axios');

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
};

module.exports = async (req, res) => {
  // 处理 CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // 设置 CORS 头
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { pathname } = new URL(req.url, `https://${req.headers.host}`);

  // 健康检查
  if (pathname === '/api/health') {
    res.statusCode = 200;
    res.json({ status: 'ok', message: '服务运行中' });
    return;
  }

  // 获取作业列表
  if (pathname === '/api/homework' && req.method === 'GET') {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      res.statusCode = 400;
      res.json({ error: '缺少 sessionId' });
      return;
    }

    try {
      const response = await axios.get('https://mooc1-api.chaoxing.com/mooc-ans/work/getAllWork', {
        headers: {
          'Cookie': `JSESSIONID=${sessionId}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      res.statusCode = 200;
      res.json(response.data);
    } catch (error) {
      console.error('获取作业失败:', error.message);
      res.statusCode = 500;
      res.json({ error: '获取作业失败', message: error.message });
    }
    return;
  }

  // AI 生成答案
  if (pathname === '/api/ai/answer' && req.method === 'POST') {
    const { question, apiKey, model = 'gpt-3.5-turbo' } = req.body;
    
    if (!question || !apiKey) {
      res.statusCode = 400;
      res.json({ error: '缺少题目或 API Key' });
      return;
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
      res.statusCode = 200;
      res.json({ answer });
    } catch (error) {
      console.error('AI 请求失败:', error.message);
      res.statusCode = 500;
      res.json({ error: 'AI 请求失败', message: error.message });
    }
    return;
  }

  // 404
  res.statusCode = 404;
  res.json({ error: 'Not Found' });
};
