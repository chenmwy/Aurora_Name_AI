(function (global) {
  const { NANA_STATES, NANA_DEFAULT_POSE, NANA_TIMING, isValidState, getPoseAsset } =
    global.NanaCompanionState;

  function NanaCompanion(rootEl) {
    this.rootEl = rootEl;
    this.spriteEl = rootEl.querySelector(".nana-companion__sprite");
    this.currentState = NANA_STATES.IDLE;
    this.currentPose = NANA_DEFAULT_POSE;
    this.resetTimer = null;
  }

  NanaCompanion.prototype.clearResetTimer = function () {
    if (this.resetTimer) {
      window.clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  };

  NanaCompanion.prototype.setPose = function (poseKey) {
    if (!this.spriteEl) return this;
    this.currentPose = poseKey || NANA_DEFAULT_POSE;
    this.spriteEl.src = getPoseAsset(this.currentPose);
    return this;
  };

  NanaCompanion.prototype.setState = function (nextState) {
    if (!isValidState(nextState)) return this;

    this.clearResetTimer();
    this.currentState = nextState;
    this.rootEl.dataset.state = nextState;
    return this;
  };

  NanaCompanion.prototype.returnToIdle = function (delayMs) {
    this.clearResetTimer();
    this.resetTimer = window.setTimeout(() => {
      this.setState(NANA_STATES.IDLE);
    }, delayMs);
    return this;
  };

  NanaCompanion.prototype.onThinkingStart = function () {
    return this.setState(NANA_STATES.THINKING);
  };

  NanaCompanion.prototype.onGenerateSuccess = function () {
    this.setState(NANA_STATES.SUCCESS);
    return this.returnToIdle(NANA_TIMING.successMs);
  };

  NanaCompanion.prototype.onGenerateError = function () {
    this.setState(NANA_STATES.ERROR);
    return this.returnToIdle(NANA_TIMING.errorMs);
  };

  NanaCompanion.create = function (options) {
    options = options || {};

    const rootEl = document.createElement("div");
    rootEl.className = "nana-companion";
    rootEl.dataset.state = NANA_STATES.IDLE;
    rootEl.setAttribute("aria-hidden", "true");

    rootEl.innerHTML =
      '<div class="nana-companion__float">' +
      '<div class="nana-companion__breathe">' +
      '<div class="nana-companion__glow">' +
      '<img class="nana-companion__sprite" src="" alt="" role="presentation" aria-hidden="true" width="72" height="72">' +
      "</div></div></div>";

    const mountTarget = options.mountTarget || document.body;
    mountTarget.appendChild(rootEl);

    const companion = new NanaCompanion(rootEl);
    companion.setPose(options.pose || NANA_DEFAULT_POSE);
    return companion;
  };

  NanaCompanion.init = function (options) {
    return NanaCompanion.create(options);
  };

  global.NanaCompanion = NanaCompanion;
})(window);
