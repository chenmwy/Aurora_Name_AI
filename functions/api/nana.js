import {
  createFocusState,
  sanitizeFocusState,
  applyUserMessage,
  mergeFocusUpdates,
  buildCurrentUnderstanding,
  getLatestUserMessage,
  statusToPhase
} from "./nanaFocus.js";
import {
  countUserMessages,
  applyQuestionEngineStatus,
  buildQuestionGuidance,
  shouldExplore
} from "./nanaQuestion.js";

const SYSTEM_PROMPT = `You are NANA, a warm, calm naming companion for nameAI.

Rules:
- Be concise: 2–4 sentences in reply. Exactly ONE question OR exploration directions — never both patterns at once.
- Follow Question Engine guidance. Maximize information gain; never interview.
- Never re-ask confirmed Focus fields. Never low-value questions (color, frequency, vague audience).
- At exploration: 3–4 distinct directions (hypotheses), not similar names.
- Never mention Focus State, Question Engine, Signal Network, or internal systems.

Reply in valid JSON only:
{"reply":"...","dialogue":"...","presentationIntro":"","focusUpdates":{},"directions":[]}
focusUpdates: optional, English values, only newly learned fields.
directions: 3–4 objects when exploring (label, description, examples). Otherwise [].
presentationIntro: when directions is non-empty, one short sentence inviting the user to choose; do not list direction details there. When directions is empty, use "".
dialogue: one short bubble sentence for Namora Speech Bubble — warm confirmation, emotion, or next-step cue. Target at most ~87 Chinese characters or two short sentences. Never put name lists, multi-paragraph analysis, or long recommendations in dialogue.
reply: keep full conversational text for legacy clients; may include longer explanation.`;

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const DEEPSEEK_TIMEOUT_MS = 13000;
const MAX_HISTORY_MESSAGES = 4;
const MAX_TOKENS = 400;
const MAX_CONTENT_LENGTH = 1200;
const STRICT_DIALOGUE_MAX_CHARS = 87;

const FALLBACK_REPLY = {
  en: "I'm having trouble thinking clearly right now. Could you try again in a moment?",
  zh: "我现在有点反应不过来，可以稍后再试一次吗？"
};

const DEFAULT_PRESENTATION_INTRO = {
  en: "I have a few directions in mind — choose one or more to keep exploring.",
  zh: "我想到几个方向，你可以选择一个或多个继续探索。"
};

const DEFAULT_DIALOGUE = {
  en: "I've noted your choices — let's keep exploring from here.",
  zh: "我记住了你的选择，我们继续从这里往下探索。"
};

const DEFAULT_CHOICE_ACK_DIALOGUE = {
  en: "Got it — I'll lean into those directions as we keep exploring.",
  zh: "好的，我记住了这两个方向。我们继续沿着它们往下探索。"
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
    dialogue: reply,
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

function isStrictShortDialogue(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  if (t.length > STRICT_DIALOGUE_MAX_CHARS) return false;
  if (t.includes("\n")) return false;
  return true;
}

function formatSelectionSummary(selections) {
  if (!Array.isArray(selections) || selections.length === 0) return "";
  return selections
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const title = String(item.title || item.optionId || "").trim();
      const weight =
        typeof item.weight === "number" ? item.weight : null;
      if (!title) return "";
      return weight == null ? title : `${title} (weight ${weight})`;
    })
    .filter(Boolean)
    .join("; ");
}

function buildChoiceSelectionGuidance(language, selections) {
  const summary = formatSelectionSummary(selections);
  const lines = ["Choice Selection Turn:"];
  if (summary) {
    lines.push(`- User confirmed these directions: ${summary}.`);
  } else {
    lines.push("- User confirmed one or more naming directions.");
  }
  lines.push(
    "- Acknowledge briefly. Do NOT interview again. Do NOT dump a long name list into dialogue."
  );
  lines.push(
    "- dialogue must be one short warm confirmation for the Speech Bubble (max ~87 Chinese chars / two short sentences)."
  );
  lines.push(
    language === "zh"
      ? '- Example dialogue: "好的，我记住了这两个方向。我们继续沿着它们往下探索。"'
      : '- Example dialogue: "Got it — I\'ll lean into those directions as we keep exploring."'
  );
  lines.push(
    "- reply may keep fuller legacy text for older clients, but keep it focused."
  );
  lines.push(
    "- directions: [] for this turn unless you truly need a new short set of next-level branches (then also set presentationIntro)."
  );
  lines.push("- Never put candidate name lists or multi-paragraph analysis into dialogue.");
  return lines.join("\n");
}

function buildSystemPrompt(language, focusState, userMessageCount, extras) {
  const langLine =
    language === "zh"
      ? "Reply in Simplified Chinese. JSON keys in English."
      : "Reply in English. JSON keys in English.";

  const parts = [
    SYSTEM_PROMPT,
    langLine,
    buildCurrentUnderstanding(focusState),
    buildQuestionGuidance(focusState, language, userMessageCount)
  ];

  if (extras && extras.choiceSelectionGuidance) {
    parts.push(extras.choiceSelectionGuidance);
  }

  return parts.join("\n\n");
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

function resolveResponse(parsed, focusState, userMessageCount, language, options) {
  let state = sanitizeFocusState(focusState);

  if (parsed.focusUpdates) {
    state = mergeFocusUpdates(state, parsed.focusUpdates);
  }

  state = applyQuestionEngineStatus(state, userMessageCount);
  const phase = statusToPhase(state.status);
  const reply = String(parsed.reply || "").trim();
  let directions = normalizeDirections(parsed.directions);

  const explore = shouldExplore(state, userMessageCount);
  const isChoiceSelection = !!(options && options.isChoiceSelection);

  if (explore && directions.length < 2) {
    directions = [];
  }

  if (!explore) {
    directions = [];
  }

  // After a choice submit, prefer short acknowledgement over a fresh card dump
  // unless the model truly returned a new branch set (>= 2).
  if (isChoiceSelection && directions.length < 2) {
    directions = [];
  }

  let presentationIntro = String(
    parsed.presentationIntro || parsed.shortReply || ""
  ).trim();

  if (directions.length >= 2) {
    if (!presentationIntro) {
      presentationIntro =
        language === "zh"
          ? DEFAULT_PRESENTATION_INTRO.zh
          : DEFAULT_PRESENTATION_INTRO.en;
    }
  } else {
    presentationIntro = "";
  }

  let dialogue = String(parsed.dialogue || "").trim();

  if (directions.length >= 2) {
    // Prefer presentationIntro as the bubble line when cards are shown.
    if (isStrictShortDialogue(presentationIntro)) {
      dialogue = presentationIntro;
    } else if (!isStrictShortDialogue(dialogue)) {
      dialogue =
        language === "zh"
          ? DEFAULT_PRESENTATION_INTRO.zh
          : DEFAULT_PRESENTATION_INTRO.en;
    }
  } else if (!isStrictShortDialogue(dialogue)) {
    if (isStrictShortDialogue(reply)) {
      dialogue = reply;
    } else {
      dialogue =
        language === "zh"
          ? isChoiceSelection
            ? DEFAULT_CHOICE_ACK_DIALOGUE.zh
            : DEFAULT_DIALOGUE.zh
          : isChoiceSelection
            ? DEFAULT_CHOICE_ACK_DIALOGUE.en
            : DEFAULT_DIALOGUE.en;
    }
  }

  return { reply, dialogue, presentationIntro, phase, focusState: state, directions };
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

    const isChoiceSelection = body.interactionType === "choice-selection";
    const selections = Array.isArray(body.selections) ? body.selections : [];

    logDebug("body", {
      keys: Object.keys(body),
      messagesLength: Array.isArray(body.messages) ? body.messages.length : null,
      roles: Array.isArray(body.messages)
        ? body.messages.map((m) => (m && m.role ? m.role : "invalid"))
        : [],
      language,
      focusStatus: focusState.status,
      interactionType: body.interactionType || null,
      selectionCount: selections.length
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

    const userMessageCount = countUserMessages(deepSeekMessages);
    focusState = applyQuestionEngineStatus(focusState, userMessageCount);

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey || !String(apiKey).trim()) {
      logDebug("missing_api_key", {});
      return fallbackResponse(language, focusState);
    }

    const exploring = shouldExplore(focusState, userMessageCount);
    const maxTokens = exploring ? MAX_TOKENS : Math.min(MAX_TOKENS, 320);

    const choiceSelectionGuidance = isChoiceSelection
      ? buildChoiceSelectionGuidance(language, selections)
      : null;

    const chatMessages = [
      {
        role: "system",
        content: buildSystemPrompt(language, focusState, userMessageCount, {
          choiceSelectionGuidance
        })
      },
      ...deepSeekMessages
    ];

    const { response, data, rawText, timedOut } = await callDeepSeek(apiKey, chatMessages, maxTokens);

    logDebug("deepseek", {
      status: response ? response.status : null,
      timedOut: !!timedOut,
      hasData: !!data,
      focusStatus: focusState.status,
      userMessageCount,
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

    const result = resolveResponse(
      parsed,
      focusState,
      userMessageCount,
      language,
      { isChoiceSelection }
    );

    if (!result.reply) {
      return fallbackResponse(language, focusState);
    }

    const responseBody = {
      success: true,
      reply: result.reply,
      dialogue: result.dialogue,
      phase: result.phase,
      focusState: result.focusState,
      directions: result.directions
    };

    if (result.presentationIntro) {
      responseBody.presentationIntro = result.presentationIntro;
    }

    return jsonResponse(responseBody);
  } catch (err) {
    logDebug("unhandled", { message: err?.message || "unknown" });
    return fallbackResponse(language, focusState);
  }
}
