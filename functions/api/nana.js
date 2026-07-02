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

OUTPUT FORMAT — return ONLY valid JSON, no markdown:
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

async function callDeepSeek(apiKey, messages) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      max_tokens: 2048,
      temperature: 0.75,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();
  return { response, data };
}

function buildLanguageInstruction(lang) {
  if (lang === "zh") {
    return "Respond in Simplified Chinese (简体中文). JSON keys stay in English; reply and direction text in Chinese.";
  }
  return "Respond in English. JSON keys stay in English.";
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
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const messages = body.messages;
  const currentPhase = normalizePhase(body.phase);
  const lang = body.lang === "zh" ? "zh" : "en";

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    return new Response(JSON.stringify({ error: "Server configuration error: API key not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  const chatMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `${buildLanguageInstruction(lang)} Current phase hint from client: ${currentPhase}. User messages so far: ${userMessageCount}.`
    },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").trim()
    }))
  ];

  try {
    const { response, data } = await callDeepSeek(apiKey, chatMessages);

    if (!response.ok) {
      const errMsg = data?.error?.message || `API error (${response.status})`;
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return new Response(JSON.stringify({ error: "Empty response from AI" }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const parsed = extractJsonObject(rawContent);
    if (!parsed || !parsed.reply) {
      return new Response(JSON.stringify({ error: "Could not parse NANA response" }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = enforcePhaseRules(parsed, userMessageCount, currentPhase);

    if (!result.reply) {
      return new Response(JSON.stringify({ error: "Empty reply from NANA" }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        reply: result.reply,
        phase: result.phase,
        directions: result.directions
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
