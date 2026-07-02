import {
  createFocusState,
  sanitizeFocusState,
  applyUserMessage,
  mergeFocusUpdates,
  buildCurrentUnderstanding,
  buildFocusGuidance,
  getLatestUserMessage,
  computeStatus,
  statusToPhase
} from "./nanaFocus.js";

const SYSTEM_PROMPT = `You are NANA, a warm, calm naming companion for nameAI.

Rules:
- Be concise: 2–4 sentences. Ask at most ONE meaningful question per reply.
- Do not generate name lists early unless status is ready_for_exploration.
- Use the Current Understanding block. Never re-ask about confirmed fields.
- When ready_for_exploration, offer 3–4 distinct naming directions (not similar names).
- Never mention Focus State, Signal Network, status, or internal systems.

Reply in valid JSON only:
{"reply":"...","focusUpdates":{},"directions":[]}
focusUpdates: optional object with any of target, theme, coreDirection, audience, tone (English values, only if newly learned).
directions: array of 3–4 objects when exploring, each with label, description, examples (1–2 names). Otherwise [].`;

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const DEEPSEEK_TIMEOUT_MS = 13000;
const MAX_HISTORY_MESSAGES = 4;
const MAX_TOKENS = 400;
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

function fallbackResponse(language, focusState) {
  const state = sanitizeFocusState(focusState);
  const reply = language === "zh" ? FALLBACK_REPLY.zh : FALLBACK_REPLY.en;
  return jsonResponse({
    success: true,
    reply,
    phase: statusToPhase(state.status),
    focusState: state,
    directions: [],
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

function normalizeLanguage(body) {
  const raw = body?.language ?? body?.lang ?? "en";
  return String(raw).toLowerCase() === "zh" ? "zh" : "en";
}

function normalizeDirections(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
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

function buildSystemPrompt(language, focusState) {
  const langLine =
    language === "zh"
      ? "Reply in Simplified Chinese. JSON keys in English."
      : "Reply in English. JSON keys in English.";

  return [
    SYSTEM_PROMPT,
    langLine,
    buildCurrentUnderstanding(focusState),
    buildFocusGuidance(focusState)
  ].join("\n\n");
}

async function callDeepSeek(apiKey, messages, maxTokens) {
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
        max_tokens: maxTokens,
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

function resolveResponse(parsed, focusState) {
  let state = sanitizeFocusState(focusState);

  if (parsed.focusUpdates) {
    state = mergeFocusUpdates(state, parsed.focusUpdates);
  }

  state.status = computeStatus(state);
  const phase = statusToPhase(state.status);
  const reply = String(parsed.reply || "").trim();
  let directions = normalizeDirections(parsed.directions);

  if (state.status === "ready_for_exploration" && directions.length < 2) {
    directions = [];
  }

  if (state.status !== "ready_for_exploration") {
    directions = [];
  }

  return { reply, phase, focusState: state, directions };
}

export async function onRequestPost(context) {
  let language = "en";
  let focusState = createFocusState();

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

    language = normalizeLanguage(body);
    focusState = sanitizeFocusState(body.focusState);

    logDebug("body", {
      keys: Object.keys(body),
      messagesLength: Array.isArray(body.messages) ? body.messages.length : null,
      roles: Array.isArray(body.messages)
        ? body.messages.map((m) => (m && m.role ? m.role : "invalid"))
        : [],
      language,
      focusStatus: focusState.status
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

    const latestUser = getLatestUserMessage(deepSeekMessages);
    focusState = applyUserMessage(focusState, latestUser);

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey || !String(apiKey).trim()) {
      logDebug("missing_api_key", {});
      return fallbackResponse(language, focusState);
    }

    const maxTokens =
      focusState.status === "ready_for_exploration" ? MAX_TOKENS : Math.min(MAX_TOKENS, 320);

    const chatMessages = [
      { role: "system", content: buildSystemPrompt(language, focusState) },
      ...deepSeekMessages
    ];

    const { response, data, rawText, timedOut } = await callDeepSeek(apiKey, chatMessages, maxTokens);

    logDebug("deepseek", {
      status: response ? response.status : null,
      timedOut: !!timedOut,
      hasData: !!data,
      focusStatus: focusState.status,
      rawPreview: rawText ? rawText.slice(0, 300) : ""
    });

    if (timedOut) {
      return fallbackResponse(language, focusState);
    }

    if (!response || !data || !response.ok) {
      return fallbackResponse(language, focusState);
    }

    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      logDebug("deepseek_empty_content", {
        finishReason: data?.choices?.[0]?.finish_reason || null
      });
      return fallbackResponse(language, focusState);
    }

    const parsed = extractJsonObject(rawContent);
    if (!parsed || !parsed.reply) {
      logDebug("deepseek_parse_failed", {
        rawContentPreview: String(rawContent).slice(0, 300)
      });
      return fallbackResponse(language, focusState);
    }

    const result = resolveResponse(parsed, focusState);

    if (!result.reply) {
      return fallbackResponse(language, focusState);
    }

    return jsonResponse({
      success: true,
      reply: result.reply,
      phase: result.phase,
      focusState: result.focusState,
      directions: result.directions
    });
  } catch (err) {
    logDebug("unhandled", { message: err?.message || "unknown" });
    return fallbackResponse(language, focusState);
  }
}
