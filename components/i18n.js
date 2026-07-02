(function (global) {
  const STORAGE_KEY = "nameai_lang";

  const translations = {
    en: {
      meta: {
        title: "AI Podcast Name Generator - Free Creative Show Title Ideas",
        description:
          "Generate unique podcast names instantly with our AI-powered tool. Enter your niche keywords and get 10 creative, usable show titles for free."
      },
      langSwitcher: {
        aria: "Language",
        english: "English",
        chinese: "中文"
      },
      header: {
        logoAlt: "nameAI — Podcast Name Generator",
        eyebrow: "AI Podcast Naming",
        title: "AI Podcast Name Generator",
        subtitle: "Generate memorable podcast names in seconds."
      },
      generator: {
        quickExample: "Quick Example",
        keywordTips: "Keyword Tips",
        keywordTipsBody: "Use 1–2 keywords separated by commas.",
        keywordTipsExamples: "Examples:",
        exampleKeywords: "AI + Business",
        exampleResult: "The Automation Edge",
        fieldLabel: "Podcast keywords",
        fieldHint: "e.g. tech, comedy, true crime",
        placeholder: "tech, news",
        btnGenerate: "Generate 10 Names"
      },
      thinking: {
        generic1: "Understanding your idea...",
        generic2: "Exploring different naming directions...",
        generic3: "Balancing creativity and memorability...",
        generic4: "Creating brand-worthy name ideas...",
        generic5: "Preparing your recommendations...",
        keyword1: "Understanding your {phrase} idea...",
        keyword2: "Exploring memorable {primary} branding...",
        keyword4: "Creating brand-worthy {primary} name ideas..."
      },
      results: {
        title: "Your podcast names",
        meta: '{count} ideas · hover <span class="info-icon-inline" aria-hidden="true">i</span> for details',
        regenerate: "Generate again",
        aiRecommended: "🏆 AI Recommended",
        nameScore: "Name Score",
        memorability: "Memorability",
        brandability: "Brandability",
        professionalism: "Professionalism",
        meaning: "Meaning",
        inspiration: "Inspiration",
        meaningFallback: "A creative title crafted for your niche.",
        inspirationFallback: "Inspired by your keywords and podcast branding trends.",
        infoAria: "Show meaning and inspiration for {name}",
        copy: "Copy",
        copyAria: "Copy {name}",
        copied: "Copied!",
        checkDomain: "Check Domain"
      },
      traits: {
        high: "High",
        medium: "Medium",
        low: "Low"
      },
      comingSoon: {
        title: "Coming Soon",
        subtitle: "Help us decide what to build next",
        badge: "Soon",
        votes: "{count} votes",
        vote: "Vote",
        voted: "Voted",
        notify: "Notify Me",
        subscribed: "Subscribed",
        notifyLabel: "Email for launch updates",
        emailPlaceholder: "you@email.com",
        subscribe: "Subscribe",
        notifySuccess: "You're on the list!",
        tools: {
          business: "Business Name Generator",
          startup: "Startup Name Generator",
          chinese: "Chinese Name Generator",
          youtube: "YouTube Name Generator"
        }
      },
      footer: {
        text: "Built for creators. Names are AI suggestions — verify trademarks and domains before you launch.",
        version: "Aurora Name AI · v1.0.2 · User Experience Improvements"
      },
      errors: {
        keywordEmpty: "Please enter at least one keyword.",
        keywordTooMany: "Please use only 1–2 keywords (comma-separated).",
        network: "Network error. Check your connection and try again.",
        generic: "Something went wrong. Please try again.",
        unexpectedResponse: "Unexpected response from the server. Please try again.",
        requestFailed: "Request failed ({status}).",
        noNames: "No names were returned. Please try again."
      },
      conversation: {
        aria: "Chat with NANA",
        title: "NANA",
        subtitle: "Your naming companion",
        greeting: "Hi — I'm NANA. What would you like to name today?",
        placeholder: "Share your idea…",
        inputAria: "Message to NANA",
        send: "Send",
        sendAria: "Send message",
        divider: "Or generate with keywords",
        directionFeedback: "The {label} direction feels closer to what I want.",
        errors: {
          network: "Network error. Check your connection and try again.",
          generic: "Something went wrong. Please try again.",
          unexpected: "Unexpected response from the server. Please try again.",
          empty: "NANA didn't respond. Please try again.",
          unavailable: "NANA is temporarily unavailable. Please try again in a moment."
        }
      }
    },
    zh: {
      meta: {
        title: "AI 播客名称生成器 - 免费创意节目名称灵感",
        description:
          "用 AI 快速生成独特播客名称。输入领域关键词，免费获取 10 个可用节目名称建议。"
      },
      langSwitcher: {
        aria: "语言",
        english: "English",
        chinese: "中文"
      },
      header: {
        logoAlt: "nameAI — 播客名称生成器",
        eyebrow: "AI 播客命名",
        title: "AI 播客名称生成器",
        subtitle: "几秒内生成让人记住的播客名称。"
      },
      generator: {
        quickExample: "快速示例",
        keywordTips: "关键词提示",
        keywordTipsBody: "建议使用 1–2 个关键词，用逗号分隔。",
        keywordTipsExamples: "示例：",
        exampleKeywords: "AI + 商业",
        exampleResult: "The Automation Edge",
        fieldLabel: "播客关键词",
        fieldHint: "例如：科技、喜剧、真实犯罪",
        placeholder: "科技, 新闻",
        btnGenerate: "生成 10 个名称"
      },
      thinking: {
        generic1: "正在理解你的想法…",
        generic2: "探索不同的命名方向…",
        generic3: "平衡创意与记忆度…",
        generic4: "构思值得记住的名称…",
        generic5: "整理推荐结果…",
        keyword1: "正在理解你的{phrase}想法…",
        keyword2: "探索{primary}相关的命名灵感…",
        keyword4: "构思适合{primary}的名称…"
      },
      results: {
        title: "你的播客名称",
        meta: '{count} 个灵感 · 悬停 <span class="info-icon-inline" aria-hidden="true">i</span> 查看详情',
        regenerate: "再次生成",
        aiRecommended: "🏆 AI 推荐",
        nameScore: "名称评分",
        memorability: "记忆度",
        brandability: "品牌感",
        professionalism: "专业度",
        meaning: "含义",
        inspiration: "灵感",
        meaningFallback: "为你的领域量身构思的创意名称。",
        inspirationFallback: "灵感来自你的关键词与播客命名趋势。",
        infoAria: "查看 {name} 的含义与灵感",
        copy: "复制",
        copyAria: "复制 {name}",
        copied: "已复制！",
        checkDomain: "查域名"
      },
      traits: {
        high: "高",
        medium: "中",
        low: "低"
      },
      comingSoon: {
        title: "即将推出",
        subtitle: "告诉我们你希望我们接下来做什么",
        badge: "即将上线",
        votes: "{count} 票",
        vote: "投票",
        voted: "已投票",
        notify: "通知我",
        subscribed: "已订阅",
        notifyLabel: "上线通知邮箱",
        emailPlaceholder: "you@email.com",
        subscribe: "订阅",
        notifySuccess: "已加入通知列表！",
        tools: {
          business: "商业名称生成器",
          startup: "初创公司名称生成器",
          chinese: "中文名称生成器",
          youtube: "YouTube 名称生成器"
        }
      },
      footer: {
        text: "为创作者而生。名称由 AI 生成，仅供参考 — 上线前请自行核实商标与域名。",
        version: "Aurora Name AI · v1.0.2 · 用户体验优化"
      },
      errors: {
        keywordEmpty: "请至少输入一个关键词。",
        keywordTooMany: "请只使用 1–2 个关键词（逗号分隔）。",
        network: "网络异常，请检查连接后重试。",
        generic: "出了点问题，请稍后再试。",
        unexpectedResponse: "服务器响应异常，请稍后再试。",
        requestFailed: "请求失败（{status}）。",
        noNames: "未返回名称，请重试。"
      },
      conversation: {
        aria: "与 NANA 对话",
        title: "NANA",
        subtitle: "你的命名伙伴",
        greeting: "你好，我是 NANA。今天你想给什么起名字？",
        placeholder: "说说你的想法…",
        inputAria: "发给 NANA 的消息",
        send: "发送",
        sendAria: "发送消息",
        divider: "或使用关键词快速生成",
        directionFeedback: "「{label}」这个方向更接近我想要的。",
        errors: {
          network: "网络异常，请检查连接后重试。",
          generic: "出了点问题，请稍后再试。",
          unexpected: "服务器响应异常，请稍后再试。",
          empty: "NANA 没有回复，请重试。",
          unavailable: "NANA 暂时不可用，请稍后再试。"
        }
      }
    }
  };

  let currentLang = "en";
  const listeners = [];

  function getNested(obj, key) {
    return key.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
  }

  function detectBrowserLanguage() {
    const langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || "en"];

    for (let i = 0; i < langs.length; i += 1) {
      if (String(langs[i]).toLowerCase().indexOf("zh") === 0) return "zh";
    }
    return "en";
  }

  function getSavedLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "zh") return saved;
    } catch {
      /* ignore */
    }
    return null;
  }

  function resolveLanguage() {
    return getSavedLanguage() || detectBrowserLanguage();
  }

  function documentLang(lang) {
    return lang === "zh" ? "zh-CN" : "en";
  }

  function t(key, params) {
    let value = getNested(translations[currentLang], key);
    if (value == null) value = getNested(translations.en, key);
    if (value == null) return key;

    if (!params) return String(value);

    return String(value).replace(/\{(\w+)\}/g, (_, token) =>
      params[token] !== undefined ? String(params[token]) : `{${token}}`
    );
  }

  function applyStaticTranslations() {
    document.documentElement.lang = documentLang(currentLang);

    const titleEl = document.querySelector("title");
    if (titleEl) titleEl.textContent = t("meta.title");

    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute("content", t("meta.description"));

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      el.setAttribute("alt", t(el.getAttribute("data-i18n-alt")));
    });

    document.querySelectorAll(".lang-switcher__btn").forEach((btn) => {
      const lang = btn.getAttribute("data-lang");
      btn.classList.toggle("is-active", lang === currentLang);
      btn.setAttribute("aria-pressed", lang === currentLang ? "true" : "false");
    });
  }

  function setLanguage(lang, persist) {
    if (lang !== "en" && lang !== "zh") return;
    currentLang = lang;
    if (persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* ignore */
      }
    }
    applyStaticTranslations();
    listeners.forEach((fn) => fn(currentLang));
  }

  function getLanguage() {
    return currentLang;
  }

  function onLanguageChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }

  function bindLanguageSwitcher() {
    document.querySelectorAll(".lang-switcher__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        if (lang && lang !== currentLang) setLanguage(lang, true);
      });
    });
  }

  function init() {
    currentLang = resolveLanguage();
    bindLanguageSwitcher();
    applyStaticTranslations();
  }

  global.NameAiI18n = {
    STORAGE_KEY,
    translations,
    init,
    t,
    getLanguage,
    setLanguage,
    resolveLanguage,
    detectBrowserLanguage,
    applyStaticTranslations,
    onLanguageChange
  };
})(window);
