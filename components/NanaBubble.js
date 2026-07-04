(function (global) {
  var STATES = {
    IDLE: "idle",
    APPEARING: "appearing",
    TYPING: "typing",
    READING: "reading"
  };

  var APPEAR_MS = 360;

  function NanaBubble(options) {
    this.stageEl = options.stageEl;
    this.choicesEl = options.choicesEl || null;
    this.escapeHtml = options.escapeHtml || function (text) {
      return String(text);
    };
    this.bindDirectionScroll = options.bindDirectionScroll || function () {};
    this.onDirectionSelect = options.onDirectionSelect || function () {};

    this.state = STATES.IDLE;
    this.rootEl = null;
    this.bodyEl = null;
    this.typeTimer = null;
    this.appearTimer = null;
    this.currentDirections = null;
    this.tokens = [];
    this.tokenIndex = 0;
  }

  NanaBubble.prototype.clearTimers = function () {
    if (this.typeTimer) {
      window.clearTimeout(this.typeTimer);
      this.typeTimer = null;
    }
    if (this.appearTimer) {
      window.clearTimeout(this.appearTimer);
      this.appearTimer = null;
    }
  };

  NanaBubble.prototype.setState = function (nextState) {
    this.state = nextState;
    if (this.rootEl) {
      this.rootEl.dataset.state = nextState;
    }
    if (this.stageEl) {
      this.stageEl.dataset.bubbleState = nextState;
      this.stageEl.setAttribute(
        "aria-hidden",
        nextState === STATES.IDLE ? "true" : "false"
      );
    }
  };

  NanaBubble.prototype.ensureRoot = function () {
    if (this.rootEl && this.rootEl.parentNode === this.stageEl) return;

    if (this.rootEl && this.rootEl.parentNode) {
      this.rootEl.parentNode.removeChild(this.rootEl);
    }

    this.rootEl = document.createElement("div");
    this.rootEl.className = "nana-bubble";
    this.rootEl.setAttribute("role", "status");
    this.rootEl.setAttribute("aria-live", "polite");
    this.rootEl.innerHTML =
      '<div class="nana-bubble__shell">' +
      '<div class="nana-bubble__body"></div>' +
      '<span class="nana-bubble__tail" aria-hidden="true"></span>' +
      "</div>";

    this.bodyEl = this.rootEl.querySelector(".nana-bubble__body");
    this.stageEl.appendChild(this.rootEl);
  };

  NanaBubble.prototype.hideChoices = function () {
    if (!this.choicesEl) return;

    this.choicesEl.hidden = true;
    this.choicesEl.classList.remove("nana-conversation__choices--visible");
    this.choicesEl.classList.remove(
      "nana-conversation__choices--many",
      "nana-conversation__choices--count-1",
      "nana-conversation__choices--count-2",
      "nana-conversation__choices--count-3",
      "nana-conversation__choices--count-4"
    );
    this.choicesEl.innerHTML = "";
  };

  NanaBubble.prototype.applyChoicesLayout = function () {
    if (!this.choicesEl) return;

    const count = this.currentDirections ? this.currentDirections.length : 0;
    this.choicesEl.classList.remove(
      "nana-conversation__choices--many",
      "nana-conversation__choices--count-1",
      "nana-conversation__choices--count-2",
      "nana-conversation__choices--count-3",
      "nana-conversation__choices--count-4"
    );

    if (count > 4) {
      this.choicesEl.classList.add("nana-conversation__choices--many");
    } else if (count > 0) {
      this.choicesEl.classList.add("nana-conversation__choices--count-" + count);
    }
  };

  NanaBubble.prototype.prepareChoices = function (directions) {
    if (!this.choicesEl) return;

    this.choicesEl.classList.remove("nana-conversation__choices--visible");
    if (directions && directions.length > 0) {
      this.choicesEl.innerHTML = this.buildDirectionsHtml(directions);
      this.choicesEl.hidden = true;
    } else {
      this.hideChoices();
    }
  };

  NanaBubble.prototype.tokenizeForTyping = function (text) {
    const tokens = [];
    const parts = String(text || "").split(/(\*\*[^*]+\*\*|\n)/g);

    parts.forEach(function (part) {
      if (!part) return;

      if (part === "\n") {
        tokens.push({ type: "break" });
        return;
      }

      if (part.indexOf("**") === 0 && part.lastIndexOf("**") === part.length - 2) {
        const inner = part.slice(2, -2);
        for (let i = 0; i < inner.length; i += 1) {
          tokens.push({ type: "bold-char", char: inner.charAt(i) });
        }
        return;
      }

      for (let j = 0; j < part.length; j += 1) {
        tokens.push({ type: "char", char: part.charAt(j) });
      }
    });

    return tokens;
  };

  NanaBubble.prototype.renderTokens = function (count) {
    let html = "";
    let openBold = false;

    for (let i = 0; i < count && i < this.tokens.length; i += 1) {
      const token = this.tokens[i];

      if (token.type === "break") {
        if (openBold) {
          html += "</strong>";
          openBold = false;
        }
        html += "<br>";
        continue;
      }

      const isBold = token.type === "bold-char";
      if (isBold && !openBold) {
        html += "<strong>";
        openBold = true;
      }
      if (!isBold && openBold) {
        html += "</strong>";
        openBold = false;
      }

      html += this.escapeHtml(token.char);
    }

    if (openBold) html += "</strong>";
    return html;
  };

  NanaBubble.prototype.delayForToken = function (token) {
    if (!token) return 20;
    if (token.type === "break") return 70;

    const ch = token.char;
    if (ch === "." || ch === "!" || ch === "?" || ch === "。" || ch === "！" || ch === "？") {
      return 110;
    }
    if (ch === "," || ch === ";" || ch === "，" || ch === "；") return 55;
    if (ch === " ") return 14;
    return 20;
  };

  NanaBubble.prototype.buildDirectionsHtml = function (directions) {
    let html = "";
    directions.forEach(function (dir, index) {
      html +=
        '<button type="button" class="nana-conversation__direction" data-direction-index="' +
        index +
        '">' +
        '<span class="nana-conversation__direction-label">' +
        this.escapeHtml(dir.label) +
        "</span>" +
        '<span class="nana-conversation__direction-desc">' +
        this.escapeHtml(dir.description) +
        "</span>";

      if (dir.examples && dir.examples.length > 0) {
        html +=
          '<span class="nana-conversation__direction-examples">' +
          this.escapeHtml(dir.examples.join(" · ")) +
          "</span>";
      }

      html += "</button>";
    }, this);
    return html;
  };

  NanaBubble.prototype.bindDirectionButtons = function () {
    if (!this.choicesEl || !this.currentDirections) return;

    if (this.currentDirections.length > 4) {
      this.bindDirectionScroll(this.choicesEl);
    }

    this.choicesEl.querySelectorAll(".nana-conversation__direction").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-direction-index"), 10);
        const direction = this.currentDirections[idx];
        if (direction) this.onDirectionSelect(direction);
      });
    });
  };

  NanaBubble.prototype.revealDirections = function () {
    if (!this.choicesEl || !this.currentDirections || this.currentDirections.length === 0) {
      return;
    }

    this.choicesEl.hidden = false;
    this.applyChoicesLayout();
    this.choicesEl.classList.add("nana-conversation__choices--visible");
    this.bindDirectionButtons();
  };

  NanaBubble.prototype.finishTyping = function () {
    if (!this.bodyEl) return;

    this.bodyEl.innerHTML = this.renderTokens(this.tokens.length);
    this.bodyEl.classList.remove("nana-bubble__body--typing");
    this.setState(STATES.READING);
    this.revealDirections();
  };

  NanaBubble.prototype.stepTyping = function () {
    if (!this.bodyEl) return;

    this.tokenIndex += 1;
    this.bodyEl.innerHTML = this.renderTokens(this.tokenIndex);

    if (this.tokenIndex >= this.tokens.length) {
      this.typeTimer = null;
      this.finishTyping();
      return;
    }

    const delay = this.delayForToken(this.tokens[this.tokenIndex - 1]);
    this.typeTimer = window.setTimeout(() => this.stepTyping(), delay);
  };

  NanaBubble.prototype.startTyping = function () {
    if (!this.bodyEl) return;

    this.setState(STATES.TYPING);
    this.bodyEl.classList.add("nana-bubble__body--typing");
    this.bodyEl.innerHTML = "";
    this.tokenIndex = 0;

    if (this.tokens.length === 0) {
      this.finishTyping();
      return;
    }

    this.stepTyping();
  };

  NanaBubble.prototype.beginAppear = function () {
    this.setState(STATES.APPEARING);
    this.rootEl.classList.remove("nana-bubble--reading");
    this.rootEl.classList.add("nana-bubble--appearing");

    window.requestAnimationFrame(() => {
      this.rootEl.classList.add("nana-bubble--visible");
    });

    this.appearTimer = window.setTimeout(() => {
      this.appearTimer = null;
      this.rootEl.classList.add("nana-bubble--reading");
      this.startTyping();
    }, APPEAR_MS);
  };

  NanaBubble.prototype.prefersReducedMotion = function () {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  };

  NanaBubble.prototype.present = function (text, directions) {
    if (!this.stageEl) return;

    if (this.prefersReducedMotion()) {
      this.setTextImmediate(text, directions);
      return;
    }

    this.clearTimers();
    this.ensureRoot();
    this.currentDirections =
      directions && directions.length > 0 ? directions.slice() : null;
    this.tokens = this.tokenizeForTyping(text);
    this.prepareChoices(this.currentDirections);

    if (this.bodyEl) {
      this.bodyEl.classList.remove("nana-bubble__body--typing");
      this.bodyEl.innerHTML = "";
    }

    this.rootEl.classList.remove("nana-bubble--visible", "nana-bubble--reading");
    this.beginAppear();
  };

  NanaBubble.prototype.setTextImmediate = function (text, directions) {
    if (!this.stageEl) return;

    this.clearTimers();
    this.ensureRoot();
    this.currentDirections =
      directions && directions.length > 0 ? directions.slice() : null;
    this.tokens = this.tokenizeForTyping(text);
    this.prepareChoices(this.currentDirections);

    if (this.bodyEl) {
      this.bodyEl.classList.remove("nana-bubble__body--typing");
      this.bodyEl.innerHTML = this.renderTokens(this.tokens.length);
    }

    this.rootEl.classList.add("nana-bubble--visible", "nana-bubble--appearing", "nana-bubble--reading");
    this.setState(STATES.READING);

    if (this.currentDirections) {
      this.revealDirections();
    }
  };

  NanaBubble.prototype.disableDirections = function () {
    if (!this.choicesEl) return;
    this.choicesEl.querySelectorAll(".nana-conversation__direction").forEach((btn) => {
      btn.disabled = true;
    });
  };

  NanaBubble.prototype.isReading = function () {
    return this.state === STATES.READING;
  };

  global.NanaBubble = NanaBubble;
  global.NanaBubbleStates = STATES;
})(window);
