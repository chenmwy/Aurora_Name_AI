function extractJsonArray(text) {
  const trimmed = String(text).trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }

  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start !== -1 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  return null;
}

function normalizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim();
        return name ? { name, meaning: '', inspiration: '' } : null;
      }
      if (item && typeof item === 'object') {
        const name = String(item.name || item.title || '').trim();
        if (!name) return null;
        return {
          name,
          meaning: String(item.meaning || item.description || '').trim(),
          inspiration: String(item.inspiration || item.idea || '').trim()
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 10);
}

export async function onRequestPost(context) {
  const { request, env } = context;

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

  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    return new Response(JSON.stringify({ error: 'Server configuration error: API key not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a podcast branding expert for English-language shows.
Return ONLY a valid JSON array of exactly 10 objects. Each object must have:
- "name": the podcast show title (string)
- "meaning": 1-2 sentences explaining what the name conveys (string)
- "inspiration": 1-2 sentences on the creative idea behind it (string)
No markdown, no code fences, no extra text.`
          },
          {
            role: 'user',
            content: `Keywords: ${keywords}\nGenerate 10 podcast names with meaning and inspiration for each.`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'AI service request failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return new Response(JSON.stringify({ error: 'AI service returned empty content' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let parsed;
    try {
      parsed = extractJsonArray(rawContent);
    } catch {
      return new Response(JSON.stringify({ error: 'Could not parse AI response' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!parsed) {
      return new Response(JSON.stringify({ error: 'Could not parse AI response' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const names = normalizeItems(parsed);
    if (names.length === 0) {
      return new Response(JSON.stringify({ error: 'AI returned invalid name list' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
