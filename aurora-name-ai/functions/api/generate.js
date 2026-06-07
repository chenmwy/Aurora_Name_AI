export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 解析前端传来的关键词
  let keywords;
  try {
    const body = await request.json();
    keywords = body.keywords;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (!keywords) {
    return new Response(JSON.stringify({ error: 'Keywords required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 从环境变量读取 API Key
  const apiKey = env.DEEPSEEK_API_KEY;
  
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Generate 10 creative and unique podcast names based on these keywords: "${keywords}". Return ONLY a valid JSON array of strings, like ["Name 1", "Name 2", ...]. Do not include any other text or explanation.`
        }]
      })
    });
    
    const data = await response.json();
    const names = JSON.parse(data.choices[0].message.content);
    
    return new Response(JSON.stringify({ names }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Generation failed, please try again' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}