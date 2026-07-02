const SYSTEM_PROMPT = `You are NANA, the conversational guide for nameAI — a warm, calm, thoughtful creative partner who helps people discover the right name.

You are NOT a marketing assistant. You sound like a creative collaborator sitting beside the user.

CORE RULES (never break these):
1. Never generate a list of finished names during understand or focus phases. Only ask and listen.
2. Ask at most ONE meaningful question per reply. Never questionnaires. Never multiple questions.
3. Every question must improve naming quality. If it does not, do not ask it.
4. Be curious, never interrogative. Warm, never sales-like. Concise: normally 2–5 sentences.
5. Never mention internal systems (Focus, Signal Network, confidence scores, phases, algorithms).
6. Never explain how nameAI works internally.
7. Conversation should naturally become more focused, never broader.

PHASES (advance when enough understanding exists — do not rush):
- understand: Listen. One open question at a time. Learn what they want to name and why it matters.
- focus: Stop broad questions. Ask specific questions about feeling, audience, tone, or identity.
- exploration: Stop asking questions. Present 3–4 distinct naming DIRECTIONS (not many similar names). Each direction is a different interpretation of their intention. Include a short label, one-sentence description, and 1–2 example name ideas that illustrate the direction (examples are hypotheses, not final recommendations).

PHASE TRANSITION:
- Stay in understand until you know WHAT they are naming and have basic context.
- Move to focus once you can ask a specific, purposeful question (not "tell me more").
- Move to exploration only when you could describe their intent in your own words and further questions would not clearly improve naming quality.
- Minimum: at least 2 user messages before leaving understand; at least 3 user messages before exploration.

When phase is exploration, your reply should briefly acknowledge what you understood, then introduce the directions naturally. Do not ask a question in exploration unless reacting to user feedback on directions.

You must respond with valid JSON only, no markdown fences, no extra text. Use this json schema:
{
  "reply": "NANA's message to the user",
  "phase": "understand" | "focus" | "exploration",
  "directions": null or [
    {
      "label": "Direction name e.g. Emotional",
      "description": "One sentence on what this direction emphasizes",
      "examples": ["Example Name One", "Example Name Two"]
    }
  ]
}

Set directions to a non-null array only when phase is "exploration". Provide 3 or 4 directions with genuinely different interpretations.`;

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const DEEPSEEK_TIMEOUT_MS = 22000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_TOKENS = 768;

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
      { status: 502, headers: JSON_HEADERS }
    );
  }
}

function errorResponse(errorCode, message, status = 502) {
  return jsonResponse({ success: false, error: errorCode, message }, status);
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
        ? item.examples.map((e) => String(e || "").trim()).filter(Boolean).slice(0, 3)
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
      return { role, content: content.slice(0, 4000) };
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
      last.content = `${last.content}\n${msg.content}`.slice(0, 4000);
    } else {
      cleaned.push({ role: msg.role, content: msg.content });
    }
  }

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== "user") {
    return null;
  }

  return cleaned;
}

function buildSystemPrompt(language, currentPhase, userMessageCount) {
  const languageInstruction =
    language === "zh"
      ? "Respond in Simplified Chinese (简体中文). JSON keys must stay in English; put reply and direction text in Chinese."
      : "Respond in English. JSON keys must stay in English.";

  return `${SYSTEM_PROMPT}\n\n${languageInstruction}\nCurrent phase hint from client: ${currentPhase}. User messages so far: ${userMessageCount}.`;
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
        temperature: 0.75
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
  try {
    const { request, env } = context;

    logDebug("request", {
      method: request.method,
      url: request.url
    });

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid request body.", 400);
    }

    if (!body || typeof body !== "object") {
      return errorResponse("INVALID_REQUEST", "Invalid request body.", 400);
    }

    logDebug("body", {
      keys: Object.keys(body),
      messagesLength: Array.isArray(body.messages) ? body.messages.length : null,
      roles: Array.isArray(body.messages)
        ? body.messages.map((m) => (m && m.role ? m.role : "invalid"))
        : [],
      language: normalizeLanguage(body),
      phase: body.phase || null
    });

    const normalizedMessages = normalizeMessages(body.messages);
    const messages = trimHistory(normalizedMessages);
    const currentPhase = normalizePhase(body.phase);
    const language = normalizeLanguage(body);

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
      return errorResponse("NANA_API_ERROR", "NANA is temporarily unavailable.", 500);
    }

    const userMessageCount = deepSeekMessages.filter((m) => m.role === "user").length;
    const chatMessages = [
      {
        role: "system",
        content: buildSystemPrompt(language, currentPhase, userMessageCount)
      },
      ...deepSeekMessages
    ];

    const { response, data, rawText, timedOut } = await callDeepSeek(apiKey, chatMessages);

    logDebug("deepseek", {
      status: response ? response.status : null,
      timedOut: !!timedOut,
      hasData: !!data,
      rawPreview: rawText ? rawText.slice(0, 500) : ""
    });

    if (timedOut) {
      return errorResponse("NANA_API_ERROR", "NANA is temporarily unavailable.", 504);
    }

    if (!response || !data) {
      return errorResponse("NANA_API_ERROR", "NANA is temporarily unavailable.", 502);
    }

    if (!response.ok) {
      return errorResponse("NANA_API_ERROR", "NANA is temporarily unavailable.", 502);
    }

    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      logDebug("deepseek_empty_content", {
        finishReason: data?.choices?.[0]?.finish_reason || null,
        rawPreview: rawText.slice(0, 500)
      });
      return errorResponse("NANA_API_ERROR", "NANA is temporarily unavailable.", 502);
    }

    const parsed = extractJsonObject(rawContent);
    if (!parsed || !parsed.reply) {
      logDebug("deepseek_parse_failed", {
        rawContentPreview: String(rawContent).slice(0, 500)
      });
      return errorResponse("NANA_API_ERROR", "NANA is temporarily unavailable.", 502);
    }

    const result = enforcePhaseRules(parsed, userMessageCount, currentPhase);

    if (!result.reply) {
      return errorResponse("NANA_API_ERROR", "NANA is temporarily unavailable.", 502);
    }

    return jsonResponse({
      success: true,
      reply: result.reply,
      phase: result.phase,
      directions: result.directions
    });
  } catch (err) {
    logDebug("unhandled", { message: err?.message || "unknown" });
    return errorResponse("NANA_API_ERROR", "NANA is temporarily unavailable.", 500);
  }
}
