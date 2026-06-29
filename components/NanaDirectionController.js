(function (global) {
  const { getPoseAsset, isValidDirection, NBE_TIMING, NANA_DEFAULT_DIRECTION } =
    global.NanaCompanionState;

  function NanaDirectionController(spritesEl) {
    this.spritesEl = spritesEl;
    this.layerA = spritesEl.querySelector(".nana-companion__sprite--layer-a");
    this.layerB = spritesEl.querySelector(".nana-companion__sprite--layer-b");
    this.activeLayer = this.layerA;
    this.idleLayer = this.layerB;
    this.currentDirection = NANA_DEFAULT_DIRECTION;
    this.transitionMs = NBE_TIMING.directionFadeMs;
    this.transitioning = false;
  }

  NanaDirectionController.prototype.getDirection = function () {
    return this.currentDirection;
  };

  NanaDirectionController.prototype.preloadDirection = function (directionKey) {
    if (!isValidDirection(directionKey)) return;
    const img = new Image();
    img.src = getPoseAsset(directionKey);
  };

  NanaDirectionController.prototype.setDirectionImmediate = function (directionKey) {
    if (!isValidDirection(directionKey)) return Promise.resolve();

    this.currentDirection = directionKey;
    this.activeLayer.src = getPoseAsset(directionKey);
    this.activeLayer.classList.add("is-active");
    this.idleLayer.classList.remove("is-active");
    this.idleLayer.removeAttribute("src");
    return Promise.resolve();
  };

  NanaDirectionController.prototype.transitionTo = function (directionKey) {
    if (!isValidDirection(directionKey)) return Promise.resolve();
    if (directionKey === this.currentDirection && !this.transitioning) {
      return Promise.resolve();
    }

    const targetLayer = this.activeLayer === this.layerA ? this.layerB : this.layerA;
    const sourceLayer = this.activeLayer;

    return new Promise((resolve) => {
      this.transitioning = true;
      targetLayer.src = getPoseAsset(directionKey);

      const finalize = () => {
        this.currentDirection = directionKey;
        targetLayer.classList.add("is-active");
        sourceLayer.classList.remove("is-active");
        this.activeLayer = targetLayer;
        this.idleLayer = sourceLayer;
        this.idleLayer.removeAttribute("src");
        this.transitioning = false;
        window.setTimeout(resolve, this.transitionMs);
      };

      if (targetLayer.complete) {
        window.requestAnimationFrame(finalize);
        return;
      }

      targetLayer.onload = () => window.requestAnimationFrame(finalize);
      targetLayer.onerror = () => window.requestAnimationFrame(finalize);
    });
  };

  global.NanaDirectionController = NanaDirectionController;
})(window);
