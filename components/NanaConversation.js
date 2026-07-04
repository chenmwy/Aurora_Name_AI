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

    this.phase = "understanding";
    this.focusState = {
      target: null,
      theme: null,
      coreDirection: null,
      audience: null,
      tone: null,
      status: "understanding"
    };
    this.apiMessages = [];
    this.isLoading = false;
    this.rootEl = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.sendBtn = null;
    this.errorEl = null;
    this.typingEl = null;
    this.greetingBubbleEl = null;
    this.bubbleStageEl = null;
    this.nanaStageEl = null;
    this.memoryBarEl = null;
    this.memoryBarLabelEl = null;
    this.nanaBubble = null;
  }

  NanaConversation.prototype.mountNanaCompanion = function () {
    if (!this.nanaCompanion || !this.nanaCompanion.rootEl || !this.nanaStageEl) return;

    this.nanaCompanion.rootEl.classList.add("nana-companion--staged");
    this.nanaStageEl.appendChild(this.nanaCompanion.rootEl);
  };

  NanaConversation.prototype.render = function () {
    if (!this.mountEl) return;

    this.rootEl = document.createElement("section");
    this.rootEl.className = "nana-conversation nana-conversation-stage";
    this.rootEl.setAttribute("aria-label", this.t("conversation.aria"));

    this.rootEl.innerHTML =
      '<div class="nana-conversation__memory-bar" aria-label="">' +
      '<span class="nana-conversation__memory-bar-label"></span>' +
      "</div>" +
      '<div class="nana-conversation__bubble-stage" aria-hidden="true"></div>' +
      '<div class="nana-conversation__nana-stage"></div>' +
      '<div class="nana-conversation__error" hidden role="alert"></div>' +
      '<form class="nana-conversation__form" novalidate>' +
      '<input type="text" class="nana-conversation__input" autocomplete="off" maxlength="500" />' +
      '<button type="submit" class="nana-conversation__send"></button>' +
      "</form>" +
      '<div class="nana-conversation__messages nana-conversation__messages--stored" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="nana-conversation__divider"><span></span></div>';

    this.mountEl.insertBefore(this.rootEl, this.mountEl.firstChild);

    this.messagesEl = this.rootEl.querySelector(".nana-conversation__messages");
    this.memoryBarEl = this.rootEl.querySelector(".nana-conversation__memory-bar");
    this.memoryBarLabelEl = this.rootEl.querySelector(".nana-conversation__memory-bar-label");
    this.bubbleStageEl = this.rootEl.querySelector(".nana-conversation__bubble-stage");
    this.nanaStageEl = this.rootEl.querySelector(".nana-conversation__nana-stage");
    this.inputEl = this.rootEl.querySelector(".nana-conversation__input");
    this.sendBtn = this.rootEl.querySelector(".nana-conversation__send");
    this.errorEl = this.rootEl.querySelector(".nana-conversation__error");
    this.dividerLabel = this.rootEl.querySelector(".nana-conversation__divider span");

    this.mountNanaCompanion();

    this.nanaBubble = new global.NanaBubble({
      stageEl: this.bubbleStageEl,
      escapeHtml: this.escapeHtml.bind(this),
      bindDirectionScroll: this.bindDirectionScroll.bind(this),
      onDirectionSelect: this.handleDirectionSelect.bind(this)
    });
    if (this.bubbleStageEl) {
      this.bubbleStageEl.dataset.bubbleState = "idle";
    }

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
    this.updateMemoryBar();
  };

  NanaConversation.prototype.getMemoryMessageCount = function () {
    if (!this.messagesEl) return 0;

    return this.messagesEl.querySelectorAll(
      ".nana-conversation__message--user, .nana-conversation__message--nana"
    ).length;
  };

  NanaConversation.prototype.updateMemoryBar = function () {
    if (!this.memoryBarLabelEl) return;

    const count = this.getMemoryMessageCount();
    if (count > 0) {
      this.memoryBarLabelEl.textContent = this.t("conversation.memoryBarCount", {
        count: count
      });
    } else {
      this.memoryBarLabelEl.textContent = this.t("conversation.memoryBar");
    }

    if (this.memoryBarEl) {
      this.memoryBarEl.setAttribute(
        "aria-label",
        this.memoryBarLabelEl.textContent
      );
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
    if (this.nanaBubble) {
      this.nanaBubble.present(greeting, null);
    }
  };

  NanaConversation.prototype.onLanguageChange = function () {
    this.applyStaticLabels();
    this.updateMemoryBar();
    if (!this.hasUserMessages() && this.nanaBubble) {
      const greeting = this.t("conversation.greeting");
      if (this.greetingBubbleEl) {
        this.greetingBubbleEl.textContent = greeting;
      }
      if (this.nanaBubble.isReading()) {
        this.nanaBubble.setTextImmediate(greeting);
      }
    }
  };

  NanaConversation.prototype.buildApiPayload = function () {
    return this.apiMessages
      .filter(function (m) {
        return m && (m.role === "user" || m.role === "assistant");
      })
      .map(function (m) {
        return {
          role: m.role,
          content: String(m.content || "").trim()
        };
      })
      .filter(function (m) {
        return m.content;
      });
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

  NanaConversation.prototype.bindDirectionScroll = function (directionsEl) {
    if (!directionsEl || directionsEl.dataset.wheelBound === "1") return;

    directionsEl.dataset.wheelBound = "1";
    directionsEl.addEventListener(
      "wheel",
      function (event) {
        if (directionsEl.scrollWidth <= directionsEl.clientWidth) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

        directionsEl.scrollLeft += event.deltaY;
        event.preventDefault();
      },
      { passive: false }
    );
  };

  NanaConversation.prototype.appendUserMessage = function (text) {
    if (!this.messagesEl) return;

    const el = document.createElement("div");
    el.className = "nana-conversation__message nana-conversation__message--user";
    el.innerHTML =
      '<div class="nana-conversation__bubble">' + this.escapeHtml(text) + "</div>";
    this.messagesEl.appendChild(el);
    this.updateMemoryBar();
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
      const directionsEl = el.querySelector(".nana-conversation__directions");
      this.bindDirectionScroll(directionsEl);
      el.querySelectorAll(".nana-conversation__direction").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-direction-index"), 10);
          const direction = directions[idx];
          if (direction) this.handleDirectionSelect(direction);
        });
      });
    }

    this.messagesEl.appendChild(el);
    this.updateMemoryBar();
    this.scrollToBottom();
    return el.querySelector(".nana-conversation__bubble");
  };

  NanaConversation.prototype.presentNanaBubble = function (text, directions) {
    if (!this.nanaBubble) return;
    this.nanaBubble.present(text, directions);
  };

  NanaConversation.prototype.disableDirectionButtons = function () {
    if (this.nanaBubble) {
      this.nanaBubble.disableDirections();
    }
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
      const payloadMessages = this.buildApiPayload();
      const response = await fetch("/api/nana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          phase: this.phase,
          language: this.getLang(),
          focusState: this.focusState
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
        throw new Error(this.t("conversation.errors.unavailable"));
      }

      const reply = String(data.reply || "").trim();
      if (!reply) {
        throw new Error(this.t("conversation.errors.empty"));
      }

      if (data.phase) {
        this.phase = data.phase;
      }

      if (data.focusState && typeof data.focusState === "object") {
        this.focusState = {
          target: data.focusState.target || null,
          theme: data.focusState.theme || null,
          coreDirection: data.focusState.coreDirection || null,
          audience: data.focusState.audience || null,
          tone: data.focusState.tone || null,
          status: data.focusState.status || "understanding"
        };
      }

      this.apiMessages.push({ role: "assistant", content: reply });
      const directions =
        data.directions && data.directions.length > 0 ? data.directions : null;
      this.appendNanaMessage(reply, directions);
      this.presentNanaBubble(reply, directions);

      if (directions && directions.length > 0) {
        this.onTrack("nana_exploration", {
          direction_count: directions.length,
          focus_status: this.focusState.status
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
