(function (global) {
  function NanaConversation(options) {
    this.mountEl = options.mountEl;
    this.nanaCompanion = options.nanaCompanion || null;
    this.t = options.t || function (key) {
      return key;
    };
    this.getLang = options.getLang || function () {
      return "en";
    };
    this.onTrack = options.onTrack || function () {};

    this.phase = "understand";
    this.apiMessages = [];
    this.isLoading = false;
    this.rootEl = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.sendBtn = null;
    this.errorEl = null;
    this.typingEl = null;
    this.greetingBubbleEl = null;
  }

  NanaConversation.prototype.render = function () {
    if (!this.mountEl) return;

    this.rootEl = document.createElement("section");
    this.rootEl.className = "nana-conversation";
    this.rootEl.setAttribute("aria-label", this.t("conversation.aria"));

    this.rootEl.innerHTML =
      '<div class="nana-conversation__panel">' +
      '<div class="nana-conversation__header">' +
      '<div class="nana-conversation__avatar" aria-hidden="true">N</div>' +
      "<div>" +
      '<p class="nana-conversation__title">' +
      this.escapeHtml(this.t("conversation.title")) +
      "</p>" +
      '<p class="nana-conversation__subtitle">' +
      this.escapeHtml(this.t("conversation.subtitle")) +
      "</p>" +
      "</div></div>" +
      '<div class="nana-conversation__messages" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="nana-conversation__error" hidden role="alert"></div>' +
      '<form class="nana-conversation__form" novalidate>' +
      '<input type="text" class="nana-conversation__input" autocomplete="off" maxlength="500" />' +
      '<button type="submit" class="nana-conversation__send"></button>' +
      "</form></div>" +
      '<div class="nana-conversation__divider"><span></span></div>';

    this.mountEl.insertBefore(this.rootEl, this.mountEl.firstChild);

    this.messagesEl = this.rootEl.querySelector(".nana-conversation__messages");
    this.inputEl = this.rootEl.querySelector(".nana-conversation__input");
    this.sendBtn = this.rootEl.querySelector(".nana-conversation__send");
    this.errorEl = this.rootEl.querySelector(".nana-conversation__error");
    this.dividerLabel = this.rootEl.querySelector(".nana-conversation__divider span");

    const form = this.rootEl.querySelector(".nana-conversation__form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    if (this.nanaCompanion && this.inputEl) {
      this.nanaCompanion.bindInput(this.inputEl);
    }

    this.applyStaticLabels();
    this.showGreeting();
  };

  NanaConversation.prototype.applyStaticLabels = function () {
    if (!this.rootEl) return;

    this.rootEl.setAttribute("aria-label", this.t("conversation.aria"));
    const title = this.rootEl.querySelector(".nana-conversation__title");
    const subtitle = this.rootEl.querySelector(".nana-conversation__subtitle");
    if (title) title.textContent = this.t("conversation.title");
    if (subtitle) subtitle.textContent = this.t("conversation.subtitle");
    if (this.inputEl) {
      this.inputEl.placeholder = this.t("conversation.placeholder");
      this.inputEl.setAttribute("aria-label", this.t("conversation.inputAria"));
    }
    if (this.sendBtn) {
      this.sendBtn.textContent = this.t("conversation.send");
      this.sendBtn.setAttribute("aria-label", this.t("conversation.sendAria"));
    }
    if (this.dividerLabel) {
      this.dividerLabel.textContent = this.t("conversation.divider");
    }
  };

  NanaConversation.prototype.escapeHtml = function (text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  NanaConversation.prototype.hasUserMessages = function () {
    return this.apiMessages.some(function (m) {
      return m.role === "user";
    });
  };

  NanaConversation.prototype.showGreeting = function () {
    const greeting = this.t("conversation.greeting");
    this.greetingBubbleEl = this.appendNanaMessage(greeting, null);
  };

  NanaConversation.prototype.onLanguageChange = function () {
    this.applyStaticLabels();
    if (!this.hasUserMessages() && this.greetingBubbleEl) {
      this.greetingBubbleEl.textContent = this.t("conversation.greeting");
    }
  };

  NanaConversation.prototype.resolveApiError = function (data) {
    if (data && data.error === "NANA_API_ERROR") {
      return this.t("conversation.errors.unavailable");
    }
    if (data && data.error === "INVALID_REQUEST") {
      return this.t("conversation.errors.generic");
    }
    return this.t("conversation.errors.generic");
  };

  NanaConversation.prototype.setLoading = function (loading) {
    this.isLoading = loading;
    if (this.inputEl) this.inputEl.disabled = loading;
    if (this.sendBtn) this.sendBtn.disabled = loading;

    if (loading) {
      this.showTyping();
      if (this.nanaCompanion && this.nanaCompanion.onConversationThinking) {
        this.nanaCompanion.onConversationThinking();
      }
    } else {
      this.hideTyping();
    }
  };

  NanaConversation.prototype.showTyping = function () {
    if (!this.messagesEl || this.typingEl) return;

    this.typingEl = document.createElement("div");
    this.typingEl.className = "nana-conversation__typing";
    this.typingEl.setAttribute("aria-hidden", "true");
    this.typingEl.innerHTML =
      '<span class="nana-conversation__typing-dot"></span>' +
      '<span class="nana-conversation__typing-dot"></span>' +
      '<span class="nana-conversation__typing-dot"></span>';
    this.messagesEl.appendChild(this.typingEl);
    this.scrollToBottom();
  };

  NanaConversation.prototype.hideTyping = function () {
    if (this.typingEl && this.typingEl.parentNode) {
      this.typingEl.parentNode.removeChild(this.typingEl);
    }
    this.typingEl = null;
  };

  NanaConversation.prototype.showError = function (message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.hidden = !message;
  };

  NanaConversation.prototype.scrollToBottom = function () {
    if (!this.messagesEl) return;
    window.requestAnimationFrame(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    });
  };

  NanaConversation.prototype.appendUserMessage = function (text) {
    if (!this.messagesEl) return;

    const el = document.createElement("div");
    el.className = "nana-conversation__message nana-conversation__message--user";
    el.innerHTML =
      '<div class="nana-conversation__bubble">' + this.escapeHtml(text) + "</div>";
    this.messagesEl.appendChild(el);
    this.scrollToBottom();
  };

  NanaConversation.prototype.appendNanaMessage = function (text, directions) {
    if (!this.messagesEl) return null;

    const el = document.createElement("div");
    el.className = "nana-conversation__message nana-conversation__message--nana";

    let html =
      '<div class="nana-conversation__bubble">' + this.escapeHtml(text) + "</div>";

    if (directions && directions.length > 0) {
      html += '<div class="nana-conversation__directions">';
      directions.forEach((dir, index) => {
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
      });
      html += "</div>";
    }

    el.innerHTML = html;

    if (directions && directions.length > 0) {
      el.querySelectorAll(".nana-conversation__direction").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-direction-index"), 10);
          const direction = directions[idx];
          if (direction) this.handleDirectionSelect(direction);
        });
      });
    }

    this.messagesEl.appendChild(el);
    this.scrollToBottom();
    return el.querySelector(".nana-conversation__bubble");
  };

  NanaConversation.prototype.disableDirectionButtons = function () {
    if (!this.rootEl) return;
    this.rootEl.querySelectorAll(".nana-conversation__direction").forEach((btn) => {
      btn.disabled = true;
    });
  };

  NanaConversation.prototype.handleDirectionSelect = function (direction) {
    if (this.isLoading) return;

    this.disableDirectionButtons();

    const feedback = this.t("conversation.directionFeedback", {
      label: direction.label
    });

    this.onTrack("nana_direction_select", { direction: direction.label });
    this.sendMessage(feedback);
  };

  NanaConversation.prototype.handleSubmit = function () {
    if (!this.inputEl || this.isLoading) return;

    const text = this.inputEl.value.trim();
    if (!text) return;

    this.inputEl.value = "";
    this.sendMessage(text);
  };

  NanaConversation.prototype.sendMessage = async function (text) {
    if (this.isLoading || !text) return;

    this.showError("");
    this.appendUserMessage(text);
    this.apiMessages.push({ role: "user", content: text });

    this.onTrack("nana_message", {
      phase: this.phase,
      message_count: this.apiMessages.filter(function (m) {
        return m.role === "user";
      }).length
    });

    this.setLoading(true);

    try {
      const response = await fetch("/api/nana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: this.apiMessages,
          phase: this.phase,
          language: this.getLang()
        })
      });

      const rawText = await response.text();
      let data = null;
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = null;
        }
      }

      if (!data) {
        throw new Error(this.t("conversation.errors.unexpected"));
      }

      if (!response.ok || data.success === false) {
        throw new Error(this.resolveApiError(data));
      }

      const reply = String(data.reply || "").trim();
      if (!reply) {
        throw new Error(this.t("conversation.errors.empty"));
      }

      if (data.phase) {
        this.phase = data.phase;
      }

      this.apiMessages.push({ role: "assistant", content: reply });
      this.appendNanaMessage(reply, data.directions || null);

      if (data.directions && data.directions.length > 0) {
        this.onTrack("nana_exploration", {
          direction_count: data.directions.length
        });
      }

      if (this.nanaCompanion && this.nanaCompanion.onConversationComplete) {
        this.nanaCompanion.onConversationComplete();
      }
    } catch (err) {
      const message =
        err instanceof TypeError && err.message.includes("fetch")
          ? this.t("conversation.errors.network")
          : err.message || this.t("conversation.errors.generic");

      this.showError(message);
      this.apiMessages.pop();

      const userMsgs = this.messagesEl.querySelectorAll(".nana-conversation__message--user");
      const lastUser = userMsgs[userMsgs.length - 1];
      if (lastUser) lastUser.remove();

      if (this.nanaCompanion && this.nanaCompanion.onConversationComplete) {
        this.nanaCompanion.onConversationComplete();
      }
    } finally {
      this.setLoading(false);
      if (this.inputEl) this.inputEl.focus();
    }
  };

  NanaConversation.prototype.init = function () {
    this.render();
    return this;
  };

  global.NanaConversation = NanaConversation;
})(window);
