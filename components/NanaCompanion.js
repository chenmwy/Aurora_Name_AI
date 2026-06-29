(function (global) {
  const {
    NANA_STATES,
    NANA_DEFAULT_DIRECTION,
    NANA_DIRECTIONS,
    isValidState,
    getPoseAsset
  } = global.NanaCompanionState;

  function NanaCompanion(rootEl) {
    this.rootEl = rootEl;
    this.spritesEl = rootEl.querySelector(".nana-companion__sprites");
    this.presentationState = NANA_STATES.IDLE;
    this.directionController = new global.NanaDirectionController(this.spritesEl);
    this.behaviorEngine = new global.NanaBehaviorEngine(this, this.directionController);
    this.resetTimer = null;
  }

  NanaCompanion.prototype.clearResetTimer = function () {
    if (this.resetTimer) {
      window.clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  };

  NanaCompanion.prototype.setPresentationState = function (nextState) {
    if (!isValidState(nextState)) return this;

    this.clearResetTimer();
    this.presentationState = nextState;
    this.rootEl.dataset.state = nextState;
    return this;
  };

  NanaCompanion.prototype.bindInput = function (inputEl) {
    if (!inputEl) return this;

    inputEl.addEventListener("focus", () => this.onInputNotice());
    inputEl.addEventListener("input", () => this.onInputNotice());
    inputEl.addEventListener("blur", () => this.onInputBlur());

    return this;
  };

  NanaCompanion.prototype.onInputNotice = function () {
    return this.behaviorEngine.onInputNotice();
  };

  NanaCompanion.prototype.onInputBlur = function () {
    return this.behaviorEngine.onInputBlur();
  };

  NanaCompanion.prototype.onParticipateStart = function () {
    return this.behaviorEngine.onParticipateStart();
  };

  NanaCompanion.prototype.onThinkingStart = function () {
    return this.behaviorEngine.onParticipateStart();
  };

  NanaCompanion.prototype.onGenerateSuccess = function () {
    return this.behaviorEngine.onGenerateSuccess();
  };

  NanaCompanion.prototype.onGenerateError = function () {
    return this.behaviorEngine.onGenerateError();
  };

  NanaCompanion.create = function (options) {
    options = options || {};

    const rootEl = document.createElement("div");
    rootEl.className = "nana-companion";
    rootEl.dataset.state = NANA_STATES.IDLE;
    rootEl.dataset.behavior = "observe";
    rootEl.setAttribute("aria-hidden", "true");

    rootEl.innerHTML =
      '<div class="nana-companion__float">' +
      '<div class="nana-companion__breathe">' +
      '<div class="nana-companion__glow">' +
      '<div class="nana-companion__sprites">' +
      '<img class="nana-companion__sprite nana-companion__sprite--layer-a is-active" src="" alt="" role="presentation" aria-hidden="true">' +
      '<img class="nana-companion__sprite nana-companion__sprite--layer-b" alt="" role="presentation" aria-hidden="true">' +
      "</div></div></div></div>";

    const mountTarget = options.mountTarget || document.body;
    mountTarget.appendChild(rootEl);

    const companion = new NanaCompanion(rootEl);
    companion.directionController.setDirectionImmediate(NANA_DEFAULT_DIRECTION);
    companion.directionController.preloadDirection(NANA_DIRECTIONS.front45Right);
    companion.directionController.preloadDirection(NANA_DIRECTIONS.right);

    if (options.inputEl) {
      companion.bindInput(options.inputEl);
    }

    return companion;
  };

  NanaCompanion.init = function (options) {
    return NanaCompanion.create(options);
  };

  global.NanaCompanion = NanaCompanion;
})(window);
