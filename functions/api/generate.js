function extractJsonArray(text) {
  const trimmed = String(text).trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return { names: parsed, method: 'direct' };
  } catch {
    /* fall through */
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return { names: JSON.parse(fenceMatch[1].trim()), method: 'fence' };
  }

  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start !== -1 && end > start) {
    return { names: JSON.parse(trimmed.slice(start, end + 1)), method: 'bracket' };
  }

  return null;
}

function normalizeNames(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
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
    return new Response(JSON.stringify({ error: 'Invalid request', _debug: { step: 'parseBody', hypothesisId: 'E' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (!keywords) {
    return new Response(JSON.stringify({ error: 'Keywords required', _debug: { step: 'missingKeywords', hypothesisId: 'E' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const apiKey = env.DEEPSEEK_API_KEY;
  const hasApiKey = Boolean(apiKey && String(apiKey).trim());

  if (!hasApiKey) {
    return new Response(JSON.stringify({
      error: 'Server configuration error: API key not set',
      _debug: { step: 'missingApiKey', hypothesisId: 'A', hasApiKey: false }
    }), {
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
            content: 'You are a podcast branding expert. Return ONLY a valid JSON array of exactly 10 strings. No markdown, no code fences, no explanation.'
          },
          {
            role: 'user',
            content: `Keywords: ${keywords}\nGenerate 10 podcast names as a JSON array.`
          }
        ]
      })
    });
    
    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: 'AI service request failed',
        _debug: {
          step: 'deepseekHttpError',
          hypothesisId: 'A',
          deepseekStatus: response.status,
          deepseekError: data?.error?.message || data?.error?.type || null
        }
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return new Response(JSON.stringify({
        error: 'AI service returned empty content',
        _debug: {
          step: 'emptyChoices',
          hypothesisId: 'C',
          hasChoices: Array.isArray(data?.choices),
          choicesLen: data?.choices?.length ?? 0
        }
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let parseResult;
    try {
      parseResult = extractJsonArray(rawContent);
    } catch (parseErr) {
      return new Response(JSON.stringify({
        error: 'Could not parse AI response',
        _debug: {
          step: 'jsonParseFail',
          hypothesisId: 'B',
          contentPreview: String(rawContent).slice(0, 120),
          parseErr: parseErr.message
        }
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!parseResult) {
      return new Response(JSON.stringify({
        error: 'Could not parse AI response',
        _debug: {
          step: 'jsonParseFail',
          hypothesisId: 'B',
          contentPreview: String(rawContent).slice(0, 120),
          parseErr: 'no JSON array found'
        }
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const names = normalizeNames(parseResult.names);
    if (names.length === 0) {
      return new Response(JSON.stringify({
        error: 'AI returned invalid name list',
        _debug: { step: 'invalidNamesArray', hypothesisId: 'B', parseMethod: parseResult.method }
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ names, _debug: { step: 'success', parseMethod: parseResult.method } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Generation failed, please try again',
      _debug: { step: 'unexpectedCatch', hypothesisId: 'C', errMsg: error?.message }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}