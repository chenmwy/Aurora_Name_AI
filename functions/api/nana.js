const SYSTEM_PROMPT = `You are NANA, a warm, calm naming companion for nameAI.

Rules:
- Be concise: 2–4 sentences. Ask at most ONE meaningful question per reply.
- Do not generate name lists early. First understand what the user wants to name.
- After enough context (usually 3+ user messages), offer 3–4 distinct naming directions (not similar names). Each direction: label, one-sentence description, 1–2 example name ideas.
- Never mention internal systems or algorithms.

Reply in valid JSON only:
{"reply":"your message","phase":"understand|focus|exploration","directions":null}
Set directions to an array of 3–4 objects only when offering directions:
{"label":"...","description":"...","examples":["..."]}`;

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const DEEPSEEK_TIMEOUT_MS = 13000;
const MAX_HISTORY_MESSAGES = 4;
const MAX_TOKENS = 350;
const MAX_CONTENT_LENGTH = 1200;

const FALLBACK_REPLY = {
  en: "I'm having trouble thinking clearly right now. Could you try again in a moment?",
  zh: "我现在有点反应不过来，可以稍后再试一次吗？"
};

function logDebug(stage, info) {
  try {
    console.log(`[nana] ${stage}`, JSON.stringify(info));
  } catch {
    console.log(`[nana] ${stage}`, String(info));
  }
}

function jsonResponse(body, status = 200) {
  try {
    return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
  } catch (err) {
    logDebug("json_stringify_failed", { message: err?.message || "unknown" });
    return new Response(
      JSON.stringify({
        success: false,
        error: "NANA_API_ERROR",
        message: "NANA is temporarily unavailable."
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  }
}

function errorResponse(errorCode, message, status = 400) {
  return jsonResponse({ success: false, error: errorCode, message }, status);
}

function fallbackResponse(language, phase) {
  const reply = language === "zh" ? FALLBACK_REPLY.zh : FALLBACK_REPLY.en;
  return jsonResponse({
    success: true,
    reply,
    phase: normalizePhase(phase),
    directions: null,
    fallback: true
  });
}

function extractJsonObject(text) {
  const trimmed = String(text).trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through */
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      /* fall through */
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }

  return null;
}

function normalizePhase(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "focus" || v === "exploration") return v;
  return "understand";
}

function normalizeLanguage(body) {
  const raw = body?.language ?? body?.lang ?? "en";
  return String(raw).toLowerCase() === "zh" ? "zh" : "en";
}

function normalizeDirections(raw) {
  if (!Array.isArray(raw)) return null;
  const directions = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = String(item.label || "").trim();
      const description = String(item.description || "").trim();
      const examples = Array.isArray(item.examples)
        ? item.examples.map((e) => String(e || "").trim()).filter(Boolean).slice(0, 2)
        : [];
      if (!label || !description) return null;
      return { label, description, examples };
    })
    .filter(Boolean)
    .slice(0, 4);

  return directions.length >= 2 ? directions : null;
}

function normalizeMessages(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = item.role === "assistant" ? "assistant" : item.role === "user" ? "user" : null;
      const content = String(item.content || "").trim();
      if (!role || !content) return null;
      return { role, content: content.slice(0, MAX_CONTENT_LENGTH) };
    })
    .filter(Boolean);
}

function trimHistory(messages) {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
  const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
  if (trimmed.length > 0 && trimmed[0].role !== "user") {
    return trimmed.slice(1);
  }
  return trimmed;
}

function sanitizeForDeepSeek(messages) {
  const cleaned = [];

  for (const msg of messages) {
    if (cleaned.length === 0) {
      if (msg.role !== "user") continue;
      cleaned.push({ role: msg.role, content: msg.content });
      continue;
    }

    const last = cleaned[cleaned.length - 1];
    if (last.role === msg.role) {
      last.content = `${last.content}\n${msg.content}`.slice(0, MAX_CONTENT_LENGTH);
    } else {
      cleaned.push({ role: msg.role, content: msg.content });
    }
  }

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== "user") {
    return null;
  }

  return cleaned;
}

function buildSystemPrompt(language, userMessageCount) {
  const langLine =
    language === "zh"
      ? "Reply in Simplified Chinese. JSON keys in English."
      : "Reply in English. JSON keys in English.";

  return `${SYSTEM_PROMPT}\n${langLine}\nUser messages so far: ${userMessageCount}.`;
}

async function callDeepSeek(apiKey, messages) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);

  let response;
  let rawText = "";

  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        max_tokens: MAX_TOKENS,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    rawText = await response.text();
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      response: null,
      data: null,
      rawText: "",
      timedOut: err?.name === "AbortError"
    };
  }

  clearTimeout(timeoutId);

  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  return { response, data, rawText, timedOut: false };
}

function enforcePhaseRules(parsed, userMessageCount, currentPhase) {
  let phase = normalizePhase(parsed.phase);
  const reply = String(parsed.reply || "").trim();

  if (userMessageCount < 2) {
    phase = "understand";
  } else if (userMessageCount < 3 && phase === "exploration") {
    phase = currentPhase === "focus" ? "focus" : "understand";
  }

  let directions = null;
  if (phase === "exploration") {
    directions = normalizeDirections(parsed.directions);
    if (!directions) {
      phase = "focus";
    }
  }

  return { reply, phase, directions };
}

export async function onRequestPost(context) {
  let language = "en";
  let currentPhase = "understand";

  try {
    const { request, env } = context;

    logDebug("request", { method: request.method });

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid request body.", 400);
    }

    if (!body || typeof body !== "object") {
      return errorResponse("INVALID_REQUEST", "Invalid request body.", 400);
    }

    currentPhase = normalizePhase(body.phase);
    language = normalizeLanguage(body);

    logDebug("body", {
      keys: Object.keys(body),
      messagesLength: Array.isArray(body.messages) ? body.messages.length : null,
      roles: Array.isArray(body.messages)
        ? body.messages.map((m) => (m && m.role ? m.role : "invalid"))
        : [],
      language
    });

    const normalizedMessages = normalizeMessages(body.messages);
    const messages = trimHistory(normalizedMessages);

    if (messages.length === 0) {
      return errorResponse("INVALID_REQUEST", "Messages required.", 400);
    }

    if (!messages.some((m) => m.role === "user")) {
      return errorResponse("INVALID_REQUEST", "At least one user message is required.", 400);
    }

    const deepSeekMessages = sanitizeForDeepSeek(messages);
    if (!deepSeekMessages) {
      return errorResponse("INVALID_REQUEST", "Invalid message history.", 400);
    }

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey || !String(apiKey).trim()) {
      logDebug("missing_api_key", {});
      return fallbackResponse(language, currentPhase);
    }

    const userMessageCount = deepSeekMessages.filter((m) => m.role === "user").length;
    const chatMessages = [
      { role: "system", content: buildSystemPrompt(language, userMessageCount) },
      ...deepSeekMessages
    ];

    const { response, data, rawText, timedOut } = await callDeepSeek(apiKey, chatMessages);

    logDebug("deepseek", {
      status: response ? response.status : null,
      timedOut: !!timedOut,
      hasData: !!data,
      rawPreview: rawText ? rawText.slice(0, 300) : ""
    });

    if (timedOut) {
      return fallbackResponse(language, currentPhase);
    }

    if (!response || !data || !response.ok) {
      return fallbackResponse(language, currentPhase);
    }

    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      logDebug("deepseek_empty_content", {
        finishReason: data?.choices?.[0]?.finish_reason || null
      });
      return fallbackResponse(language, currentPhase);
    }

    const parsed = extractJsonObject(rawContent);
    if (!parsed || !parsed.reply) {
      logDebug("deepseek_parse_failed", {
        rawContentPreview: String(rawContent).slice(0, 300)
      });
      return fallbackResponse(language, currentPhase);
    }

    const result = enforcePhaseRules(parsed, userMessageCount, currentPhase);

    if (!result.reply) {
      return fallbackResponse(language, currentPhase);
    }

    return jsonResponse({
      success: true,
      reply: result.reply,
      phase: result.phase,
      directions: result.directions
    });
  } catch (err) {
    logDebug("unhandled", { message: err?.message || "unknown" });
    return fallbackResponse(language, currentPhase);
  }
}
