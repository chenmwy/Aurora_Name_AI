(function (global) {
  const NANA_STATES = {
    IDLE: "idle",
    THINKING: "thinking",
    SUCCESS: "success",
    ERROR: "error"
  };

  const NBE_BEHAVIOR = {
    OBSERVE: "observe",
    NOTICE: "notice",
    PARTICIPATE: "participate",
    THINKING: "thinking",
    SUCCESS: "success",
    ERROR: "error"
  };

  const NANA_DIRECTIONS = {
    front: "front",
    front45Right: "front45Right",
    right: "right",
    front45Left: "front45Left",
    left: "left",
    back45Left: "back45Left",
    back: "back",
    back45Right: "back45Right"
  };

  const NANA_POSES = {
    front: "assets/companion/base/nana_front_v1.png",
    front45Left: "assets/companion/base/nana_front45_left_v1.png",
    left: "assets/companion/base/nana_left_v1.png",
    back45Left: "assets/companion/base/nana_back45_left_v1.png",
    back: "assets/companion/base/nana_back_v1.png",
    back45Right: "assets/companion/base/nana_back45_right_v1.png",
    right: "assets/companion/base/nana_left_v1.png",
    front45Right: "assets/companion/base/nana_front45_left_v1.png"
  };

  const NANA_DEFAULT_DIRECTION = NANA_DIRECTIONS.front;

  const NBE_TIMING = {
    noticeDelayMs: 200,
    participateDelayMs: 150,
    participateStepMs: 180,
    successWaitMs: 250,
    successStepMs: 220,
    errorReturnMs: 700,
    directionFadeMs: 180
  };

  const NANA_TIMING = {
    successMs: 650,
    errorMs: 1000
  };

  function isValidState(state) {
    return Object.values(NANA_STATES).includes(state);
  }

  function isValidDirection(direction) {
    return Object.prototype.hasOwnProperty.call(NANA_POSES, direction);
  }

  function getPoseAsset(directionKey) {
    return NANA_POSES[directionKey] || NANA_POSES[NANA_DEFAULT_DIRECTION];
  }

  global.NanaCompanionState = {
    NANA_STATES,
    NBE_BEHAVIOR,
    NANA_DIRECTIONS,
    NANA_POSES,
    NANA_DEFAULT_DIRECTION,
    NBE_TIMING,
    NANA_TIMING,
    isValidState,
    isValidDirection,
    getPoseAsset
  };
})(window);
