import { sanitizeFocusState, computeStatus } from "./nanaFocus.js";

const QUESTION_BUDGET_SOFT = 4;
const QUESTION_BUDGET_EARLY_EXPLORE = 3;

const FIELD_PRIORITY = ["target", "theme", "coreDirection", "tone", "audience"];

const LOW_VALUE_PATTERNS = [
  /what color/i,
  /update frequency/i,
  /how often/i,
  /什么颜色/,
  /更新频率/,
  /多久更新/
];

const QUESTION_HINTS = {
  en: {
    target: "Ask warmly what they want to name today. One question only.",
    theme:
      "Ask for the one-sentence essence — what it is really about. High gain only.",
    coreDirection:
      "Ask what main idea they hope people remember, or the feeling the name should carry.",
    tone:
      "Ask what feeling the name should leave when heard — insightful, not logistical.",
    audience:
      "Only if it clearly changes naming; otherwise skip to exploration."
  },
  zh: {
    target: "温暖地问今天想为什么起名字。只问一个问题。",
    theme: "问一句本质——这到底是什么/about 什么。高价值问题。",
    coreDirection: "问他们希望别人记住的核心想法，或名字该传递的方向。",
    tone: "问听到名字时该留下什么感觉——有洞察力，不要问流程或细节。",
    audience: "仅当明显影响命名时才问；否则进入方向探索。"
  }
};

const QUESTION_EXAMPLES = {
  en: {
    theme: 'Good: "If this could be one sentence, what would it be?"',
    coreDirection: 'Good: "What main idea do you hope people remember?"',
    tone: 'Good: "When someone hears the name, what feeling should it leave?"'
  },
  zh: {
    theme: "好问题：「如果用一句话形容，它会是什么？」",
    coreDirection: "好问题：「你希望别人记住的核心是什么？」",
    tone: "好问题：「听到这个名字时，你希望留下什么感觉？」"
  }
};

export function countUserMessages(messages) {
  if (!Array.isArray(messages)) return 0;
  return messages.filter((m) => m?.role === "user").length;
}

export function selectNextField(focusState) {
  const s = sanitizeFocusState(focusState);

  if (!s.target) return "target";
  if (!s.theme) return "theme";
  if (!s.coreDirection) return "coreDirection";
  if (!s.tone) return "tone";

  return null;
}

export function shouldExplore(focusState, userMessageCount) {
  const s = sanitizeFocusState(focusState);

  if (s.target && s.theme && s.coreDirection && (s.tone || s.audience)) {
    return true;
  }

  if (
    userMessageCount >= QUESTION_BUDGET_EARLY_EXPLORE &&
    s.target &&
    s.theme &&
    s.coreDirection
  ) {
    return true;
  }

  if (userMessageCount >= QUESTION_BUDGET_SOFT && s.target && s.theme) {
    return true;
  }

  return false;
}

export function applyQuestionEngineStatus(focusState, userMessageCount) {
  const state = sanitizeFocusState(focusState);

  if (shouldExplore(state, userMessageCount)) {
    state.status = "ready_for_exploration";
  } else {
    state.status = computeStatus(state);
  }

  return state;
}

function buildConfirmedRules(state) {
  const rules = [];
  if (state.target) {
    rules.push(`Confirmed target: ${state.target}. Never ask if this is a product, team, project, or tool.`);
  }
  if (state.theme) {
    rules.push(`Confirmed theme: ${state.theme}. Never re-ask what it is about.`);
  }
  if (state.coreDirection) {
    rules.push(`Confirmed core direction: ${state.coreDirection}. Never restart broad discovery.`);
  }
  if (state.tone) rules.push(`Confirmed tone: ${state.tone}. Do not ask tone again.`);
  if (state.audience) rules.push(`Confirmed audience: ${state.audience}.`);
  return rules;
}

export function buildQuestionGuidance(focusState, language, userMessageCount) {
  const lang = language === "zh" ? "zh" : "en";
  const state = sanitizeFocusState(focusState);
  const explore = shouldExplore(state, userMessageCount);
  const lines = ["Question Engine:"];

  lines.push(...buildConfirmedRules(state));

  if (explore) {
    lines.push(
      "- Stop questioning. Offer 3–4 representative naming directions (e.g. Warm, Professional, Minimal — adapted to context)."
    );
    lines.push("- User direction choice becomes the next signal. No more interview questions.");
    lines.push("- directions array required; reply briefly introduces them.");
    return lines.join("\n");
  }

  const nextField = selectNextField(state);
  if (!nextField) {
    lines.push("- No high-value question left. Move to 3–4 representative naming directions.");
    return lines.join("\n");
  }

  const hints = QUESTION_HINTS[lang];
  const examples = QUESTION_EXAMPLES[lang];
  const remainingBudget = Math.max(0, QUESTION_BUDGET_SOFT - userMessageCount);

  lines.push(`- Ask exactly ONE question. Priority field: ${nextField}.`);
  lines.push(`- ${hints[nextField] || hints.theme}`);
  if (examples[nextField]) lines.push(`- ${examples[nextField]}`);
  lines.push("- Never ask multiple questions. Never ask low-value logistics.");
  lines.push("- Avoid: color, update frequency, generic audience unless naming-critical.");
  if (remainingBudget <= 1) {
    lines.push("- Question budget nearly spent; prefer exploration on next turn if gain is low.");
  }

  return lines.join("\n");
}

export function isLowValueQuestion(text) {
  return LOW_VALUE_PATTERNS.some((p) => p.test(String(text || "")));
}
