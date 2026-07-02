const FOCUS_FIELDS = ["target", "theme", "coreDirection", "audience", "tone", "status"];

const CORRECTION_PATTERNS = [
  /\b(not|isn't|isnt|actually)\s+(a\s+)?/i,
  /不是|其实是|不对|改一下|其实是想/
];

export function createFocusState(overrides) {
  return {
    target: null,
    theme: null,
    coreDirection: null,
    audience: null,
    tone: null,
    status: "understanding",
    ...(overrides && typeof overrides === "object" ? sanitizeFocusState(overrides) : {})
  };
}

export function sanitizeFocusState(raw) {
  if (!raw || typeof raw !== "object") return createFocusState();

  const state = createFocusState();
  for (const field of FOCUS_FIELDS) {
    if (field === "status") {
      state.status = normalizeStatus(raw.status);
    } else if (raw[field] != null && String(raw[field]).trim()) {
      state[field] = String(raw[field]).trim().slice(0, 120);
    }
  }
  state.status = computeStatus(state);
  return state;
}

function normalizeStatus(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "focused") return "focused";
  if (v === "ready_for_exploration") return "ready_for_exploration";
  return "understanding";
}

export function computeStatus(state) {
  const hasTarget = !!state.target;
  const hasTheme = !!state.theme;
  const hasCore = !!state.coreDirection;
  const hasAudienceOrTone = !!state.audience || !!state.tone;

  if (hasTarget && hasTheme && hasCore && hasAudienceOrTone) {
    return "ready_for_exploration";
  }
  if (hasTarget && hasTheme) {
    return "focused";
  }
  return "understanding";
}

export function statusToPhase(status) {
  if (status === "ready_for_exploration") return "exploration";
  if (status === "focused") return "focused";
  return "understanding";
}

function isCorrection(text) {
  return CORRECTION_PATTERNS.some((p) => p.test(text));
}

function matchFirst(text, rules) {
  for (const rule of rules) {
    if (rule.pattern.test(text)) return rule.value;
  }
  return null;
}

const TARGET_RULES = [
  { pattern: /播客|podcast/i, value: "podcast" },
  { pattern: /youtube|频道|channel/i, value: "YouTube channel" },
  { pattern: /初创|startup/i, value: "startup" },
  { pattern: /商业|business|公司|company/i, value: "business" },
  { pattern: /小说|novel/i, value: "novel" },
  { pattern: /书|book/i, value: "book" },
  { pattern: /产品|product/i, value: "product" },
  { pattern: /中文名|chinese name/i, value: "Chinese name" },
  { pattern: /项目|project/i, value: "project" },
  { pattern: /团队|team/i, value: "team" },
  { pattern: /品牌|brand/i, value: "brand" }
];

const THEME_RULES = [
  { pattern: /生活和工作|生活与工作|生活和工作|life and work|work and life|my life and work/i, value: "life and work" },
  { pattern: /about (my )?life and work|about life and work/i, value: "life and work" },
  { pattern: /记录.*(生活|工作)|record.*(life|work)/i, value: "life and work" },
  { pattern: /人工智能|\bai\b|artificial intelligence/i, value: "AI" },
  { pattern: /金融|finance/i, value: "finance" },
  { pattern: /旅行|travel/i, value: "travel" },
  { pattern: /个人成长|personal growth|self.?growth/i, value: "personal growth" },
  { pattern: /工作任务|生活感悟|任务和生活|工作和生活/i, value: "life and work" },
];

const CORE_RULES = [
  { pattern: /融合|integration|integrat/i, value: "integration" },
  { pattern: /连接|connected|connection|connect/i, value: "connection" },
  { pattern: /成长|growth/i, value: "growth" },
  { pattern: /平衡|balance/i, value: "balance" },
  { pattern: /神秘|mystery/i, value: "mystery" },
  { pattern: /专业|professional/i, value: "professionalism" },
  { pattern: /温暖|warm/i, value: "warmth" }
];

const TONE_RULES = [
  { pattern: /温暖|warm/i, value: "warm" },
  { pattern: /专业|professional/i, value: "professional" },
  { pattern: /诗意|poetic/i, value: "poetic" },
  { pattern: /极简|minimal|简约/i, value: "minimal" },
  { pattern: /playful|有趣|playful/i, value: "playful" },
  { pattern: /严肃|serious/i, value: "serious" }
];

const AUDIENCE_RULES = [
  { pattern: /创业者|entrepreneur/i, value: "entrepreneurs" },
  { pattern: /年轻人|young adult|gen z/i, value: "young adults" },
  { pattern: /职场|professional audience|working professional/i, value: "working professionals" },
  { pattern: /听众|listeners|audience/i, value: "listeners" }
];

function mergeField(current, next, allowOverwrite) {
  if (next == null || !String(next).trim()) return current;
  if (!current || allowOverwrite) return next;
  return current;
}

export function applyUserMessage(focusState, userMessage) {
  const state = sanitizeFocusState(focusState);
  const text = String(userMessage || "").trim();
  if (!text) return state;

  const correcting = isCorrection(text);
  const allowOverwrite = correcting;

  const target = matchFirst(text, TARGET_RULES);
  const theme = matchFirst(text, THEME_RULES);
  const coreDirection = matchFirst(text, CORE_RULES);
  const tone = matchFirst(text, TONE_RULES);
  const audience = matchFirst(text, AUDIENCE_RULES);

  state.target = mergeField(state.target, target, allowOverwrite);
  state.theme = mergeField(state.theme, theme, allowOverwrite) || refineTheme(state.theme, text);
  state.coreDirection = mergeField(state.coreDirection, coreDirection, allowOverwrite);
  state.tone = mergeField(state.tone, tone, allowOverwrite);
  state.audience = mergeField(state.audience, audience, allowOverwrite);

  state.status = computeStatus(state);
  return state;
}

function refineTheme(current, text) {
  if (current) return current;
  const lower = text.toLowerCase();
  if (/about|关于|主题是|内容是|讲|记录/.test(text) && text.length > 4) {
    if (/生活|工作|life|work/.test(lower)) return "life and work";
  }
  return null;
}

export function mergeFocusUpdates(focusState, updates) {
  const state = sanitizeFocusState(focusState);
  if (!updates || typeof updates !== "object") return state;

  for (const field of ["target", "theme", "coreDirection", "audience", "tone"]) {
    if (updates[field] != null && String(updates[field]).trim()) {
      const next = String(updates[field]).trim().slice(0, 120);
      if (!state[field]) {
        state[field] = next;
      }
    }
  }

  state.status = computeStatus(state);
  return state;
}

export function buildCurrentUnderstanding(focusState) {
  const s = sanitizeFocusState(focusState);
  const line = (label, value) => `- ${label}: ${value || "unknown"}`;

  return [
    "Current Understanding:",
    line("Target", s.target),
    line("Theme", s.theme),
    line("Core Direction", s.coreDirection),
    line("Audience", s.audience),
    line("Tone", s.tone),
    line("Status", s.status)
  ].join("\n");
}

export function buildFocusGuidance(focusState) {
  const s = sanitizeFocusState(focusState);
  const confirmed = [];

  if (s.target) confirmed.push(`Target is confirmed: ${s.target}. Do NOT ask whether this is a project, team, product, or tool.`);
  if (s.theme) confirmed.push(`Theme is confirmed: ${s.theme}. Do NOT ask again what it is about unless clarifying a detail.`);
  if (s.coreDirection) confirmed.push(`Core direction is confirmed: ${s.coreDirection}. Do NOT restart broad discovery.`);
  if (s.audience) confirmed.push(`Audience is confirmed: ${s.audience}.`);
  if (s.tone) confirmed.push(`Tone is confirmed: ${s.tone}.`);

  const lines = ["Focus rules:"];
  if (confirmed.length) {
    lines.push(...confirmed);
  } else {
    lines.push("- Gather what they want to name first.");
  }

  if (s.status === "ready_for_exploration") {
    lines.push("- Status is ready_for_exploration: stop broad questions. Offer 3–4 distinct naming directions in the directions array.");
  } else if (s.status === "focused") {
    lines.push("- Ask ONE question about core direction, audience, or tone — whichever is still unknown.");
  } else {
    lines.push("- Ask ONE open question to learn target or theme.");
  }

  return lines.join("\n");
}

export function getLatestUserMessage(messages) {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return String(messages[i].content || "").trim();
  }
  return "";
}
