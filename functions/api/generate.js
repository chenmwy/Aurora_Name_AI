const TARGET_COUNT = 10;

const SYSTEM_PROMPT = `You are a podcast branding expert for English-language shows.
Return ONLY a valid JSON array. Each item is an object with:
- "name": podcast show title (string)
- "meaning": one short sentence on what the name conveys
- "inspiration": one short sentence on the creative idea
- "score": overall name quality, number from 1.0 to 10.0 with one decimal (e.g. 8.6)
- "memorability": exactly "High", "Medium", or "Low"
- "brandability": exactly "High", "Medium", or "Low"
- "professionalism": exactly "High", "Medium", or "Low"
Keep meaning and inspiration under 20 words each. No markdown, no code fences, no extra text.`;

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

function normalizeLevel(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'high') return 'High';
  if (v === 'medium' || v === 'med') return 'Medium';
  if (v === 'low') return 'Low';
  return 'Medium';
}

function normalizeScore(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return 7.5;
  return Math.min(10, Math.max(1, Math.round(n * 10) / 10));
}

function normalizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim();
        return name
          ? {
              name,
              meaning: '',
              inspiration: '',
              score: 7.5,
              memorability: 'Medium',
              brandability: 'Medium',
              professionalism: 'Medium'
            }
          : null;
      }
      if (item && typeof item === 'object') {
        const name = String(item.name || item.title || '').trim();
        if (!name) return null;
        return {
          name,
          meaning: String(item.meaning || item.description || '').trim(),
          inspiration: String(item.inspiration || item.idea || '').trim(),
          score: normalizeScore(item.score),
          memorability: normalizeLevel(item.memorability),
          brandability: normalizeLevel(item.brandability),
          professionalism: normalizeLevel(item.professionalism)
        };
      }
      return null;
    })
    .filter(Boolean);
}

function dedupeByName(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function callDeepSeek(apiKey, messages) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 8192,
      temperature: 0.9
    })
  });

  const data = await response.json();
  return { response, data };
}

function parseDeepSeekContent(data) {
  const rawContent = data?.choices?.[0]?.message?.content;
  const finishReason = data?.choices?.[0]?.finish_reason ?? null;
  if (!rawContent) return { items: [], finishReason, rawLen: 0 };

  let parsed;
  try {
    parsed = extractJsonArray(rawContent);
  } catch {
    return { items: [], finishReason, rawLen: rawContent.length, parseError: true };
  }

  if (!parsed) {
    return { items: [], finishReason, rawLen: rawContent.length, parseError: true };
  }

  return {
    items: normalizeItems(parsed),
    finishReason,
    rawLen: rawContent.length,
    parsedLen: parsed.length
  };
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
    const { response, data } = await callDeepSeek(apiKey, [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Keywords: ${keywords}\nGenerate exactly ${TARGET_COUNT} podcast names. For each include meaning, inspiration, score (1.0-10.0), memorability, brandability, and professionalism.`
      }
    ]);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'AI service request failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result = parseDeepSeekContent(data);
    let names = dedupeByName(result.items);

    // #region agent log
    const debugMeta = {
      hypothesisId: 'A,B',
      firstParsedLen: result.parsedLen ?? result.items.length,
      firstFinishReason: result.finishReason,
      firstRawLen: result.rawLen,
      afterFirst: names.length
    };
    // #endregion

    if (names.length < TARGET_COUNT) {
      const need = TARGET_COUNT - names.length;
      const existing = names.map((n) => n.name).join(', ');
      const { response: retryRes, data: retryData } = await callDeepSeek(apiKey, [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Keywords: ${keywords}\nGenerate exactly ${need} MORE podcast names (different from: ${existing}). Return a JSON array of ${need} objects only.`
        }
      ]);

      if (retryRes.ok) {
        const retryResult = parseDeepSeekContent(retryData);
        names = dedupeByName(names.concat(retryResult.items)).slice(0, TARGET_COUNT);
        // #region agent log
        debugMeta.retryParsedLen = retryResult.parsedLen ?? retryResult.items.length;
        debugMeta.retryFinishReason = retryResult.finishReason;
        debugMeta.afterRetry = names.length;
        // #endregion
      }
    }

    names = names.slice(0, TARGET_COUNT);

    if (names.length === 0) {
      return new Response(JSON.stringify({
        error: 'AI returned invalid name list',
        _debug: debugMeta
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // #region agent log
    debugMeta.finalCount = names.length;
    // #endregion

    return new Response(JSON.stringify({ names, _debug: debugMeta }), {
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
