(function (global) {
  const {
    NANA_STATES,
    NBE_BEHAVIOR,
    NANA_DIRECTIONS,
    NBE_TIMING,
    NANA_TIMING
  } = global.NanaCompanionState;

  function NanaBehaviorEngine(companion, directionController) {
    this.companion = companion;
    this.direction = directionController;
    this.behaviorState = NBE_BEHAVIOR.OBSERVE;
    this.timers = [];
    this.noticeTimer = null;
    this.noticeArmed = false;
    this.blurDeferTimer = null;
  }

  NanaBehaviorEngine.prototype.clearTimers = function () {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
    if (this.noticeTimer) {
      window.clearTimeout(this.noticeTimer);
      this.noticeTimer = null;
    }
    if (this.blurDeferTimer) {
      window.clearTimeout(this.blurDeferTimer);
      this.blurDeferTimer = null;
    }
    this.noticeArmed = false;
  };

  NanaBehaviorEngine.prototype.delay = function (ms) {
    return new Promise((resolve) => {
      const id = window.setTimeout(resolve, ms);
      this.timers.push(id);
    });
  };

  NanaBehaviorEngine.prototype.setBehavior = function (behavior) {
    this.behaviorState = behavior;
    if (this.companion.rootEl) {
      this.companion.rootEl.dataset.behavior = behavior;
    }
  };

  NanaBehaviorEngine.prototype.isInputFocused = function () {
    return this.companion.isInputFocused();
  };

  NanaBehaviorEngine.prototype.observe = function () {
    this.clearTimers();
    this.setBehavior(NBE_BEHAVIOR.OBSERVE);
    this.companion.setPresentationState(NANA_STATES.IDLE);
    return this.direction.transitionTo(NANA_DIRECTIONS.front);
  };

  NanaBehaviorEngine.prototype.enterNotice = function () {
    this.setBehavior(NBE_BEHAVIOR.NOTICE);
    this.companion.setPresentationState(NANA_STATES.IDLE);
    return this.direction.transitionTo(NANA_DIRECTIONS.front45Right);
  };

  NanaBehaviorEngine.prototype.returnToContext = async function () {
    if (this.isInputFocused()) {
      await this.direction.transitionTo(NANA_DIRECTIONS.front45Right);
      this.setBehavior(NBE_BEHAVIOR.NOTICE);
      this.companion.setPresentationState(NANA_STATES.IDLE);
      return;
    }

    await this.direction.transitionTo(NANA_DIRECTIONS.front45Right);
    await this.direction.transitionTo(NANA_DIRECTIONS.front);
    this.setBehavior(NBE_BEHAVIOR.OBSERVE);
    this.companion.setPresentationState(NANA_STATES.IDLE);
  };

  NanaBehaviorEngine.prototype.onInputFocus = function () {
    if (
      this.behaviorState === NBE_BEHAVIOR.PARTICIPATE ||
      this.behaviorState === NBE_BEHAVIOR.THINKING ||
      this.behaviorState === NBE_BEHAVIOR.SUCCESS ||
      this.behaviorState === NBE_BEHAVIOR.ERROR
    ) {
      return;
    }

    if (this.behaviorState === NBE_BEHAVIOR.OBSERVE) {
      this.onInputNotice();
    }
  };

  NanaBehaviorEngine.prototype.onInputNotice = function () {
    if (
      this.behaviorState === NBE_BEHAVIOR.PARTICIPATE ||
      this.behaviorState === NBE_BEHAVIOR.THINKING ||
      this.behaviorState === NBE_BEHAVIOR.SUCCESS ||
      this.behaviorState === NBE_BEHAVIOR.ERROR
    ) {
      return;
    }

    if (this.behaviorState === NBE_BEHAVIOR.NOTICE || this.noticeArmed) return;

    this.noticeArmed = true;
    this.noticeTimer = window.setTimeout(() => {
      this.noticeTimer = null;
      this.noticeArmed = false;

      if (
        this.behaviorState !== NBE_BEHAVIOR.OBSERVE &&
        this.behaviorState !== NBE_BEHAVIOR.NOTICE
      ) {
        return;
      }

      this.enterNotice();
    }, NBE_TIMING.noticeDelayMs);

    this.timers.push(this.noticeTimer);
  };

  NanaBehaviorEngine.prototype.onInputBlur = function () {
    if (this.blurDeferTimer) {
      window.clearTimeout(this.blurDeferTimer);
    }

    this.blurDeferTimer = window.setTimeout(() => {
      this.blurDeferTimer = null;

      if (this.isInputFocused()) return;

      if (
        this.behaviorState === NBE_BEHAVIOR.PARTICIPATE ||
        this.behaviorState === NBE_BEHAVIOR.THINKING ||
        this.behaviorState === NBE_BEHAVIOR.SUCCESS ||
        this.behaviorState === NBE_BEHAVIOR.ERROR
      ) {
        return;
      }

      if (this.behaviorState === NBE_BEHAVIOR.NOTICE) {
        this.observe();
      }
    }, 120);

    this.timers.push(this.blurDeferTimer);
  };

  NanaBehaviorEngine.prototype.onParticipateStart = function () {
    this.clearTimers();
    this.setBehavior(NBE_BEHAVIOR.PARTICIPATE);

    const run = async () => {
      await this.delay(NBE_TIMING.participateDelayMs);

      if (this.behaviorState !== NBE_BEHAVIOR.PARTICIPATE) return;

      const alreadyNoticed =
        this.direction.getDirection() === NANA_DIRECTIONS.front45Right;

      if (!alreadyNoticed) {
        await this.direction.transitionTo(NANA_DIRECTIONS.front45Right);
        await this.delay(NBE_TIMING.participateStepMs);
      }

      if (this.behaviorState !== NBE_BEHAVIOR.PARTICIPATE) return;

      await this.direction.transitionTo(NANA_DIRECTIONS.right);

      if (this.behaviorState !== NBE_BEHAVIOR.PARTICIPATE) return;

      this.setBehavior(NBE_BEHAVIOR.THINKING);
      this.companion.setPresentationState(NANA_STATES.THINKING);
    };

    run();
  };

  NanaBehaviorEngine.prototype.onGenerateSuccess = function () {
    this.clearTimers();
    this.setBehavior(NBE_BEHAVIOR.SUCCESS);

    const run = async () => {
      await this.delay(NBE_TIMING.successWaitMs);

      if (this.behaviorState !== NBE_BEHAVIOR.SUCCESS) return;

      await this.direction.transitionTo(NANA_DIRECTIONS.front45Right);
      await this.delay(NBE_TIMING.successStepMs);

      if (this.behaviorState !== NBE_BEHAVIOR.SUCCESS) return;

      await this.direction.transitionTo(NANA_DIRECTIONS.front);

      if (this.behaviorState !== NBE_BEHAVIOR.SUCCESS) return;

      this.companion.setPresentationState(NANA_STATES.SUCCESS);

      await this.delay(NANA_TIMING.successMs);

      if (this.behaviorState !== NBE_BEHAVIOR.SUCCESS) return;

      await this.returnToContext();
    };

    run();
  };

  NanaBehaviorEngine.prototype.onConversationThinking = function () {
    this.onParticipateStart();
  };

  NanaBehaviorEngine.prototype.onConversationComplete = function () {
    if (
      this.behaviorState === NBE_BEHAVIOR.THINKING ||
      this.behaviorState === NBE_BEHAVIOR.PARTICIPATE
    ) {
      this.companion.setPresentationState(NANA_STATES.IDLE);
      this.returnToContext();
    }
  };

  NanaBehaviorEngine.prototype.onGenerateError = function () {
    this.clearTimers();
    this.setBehavior(NBE_BEHAVIOR.ERROR);
    this.direction.transitionTo(NANA_DIRECTIONS.right);
    this.companion.setPresentationState(NANA_STATES.ERROR);

    const run = async () => {
      await this.delay(NBE_TIMING.errorReturnMs);

      if (this.behaviorState !== NBE_BEHAVIOR.ERROR) return;

      await this.returnToContext();
    };

    run();
  };

  global.NanaBehaviorEngine = NanaBehaviorEngine;
})(window);
