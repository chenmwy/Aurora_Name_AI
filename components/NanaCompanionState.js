(function (global) {
  const NANA_STATES = {
    IDLE: "idle",
    THINKING: "thinking",
    SUCCESS: "success",
    ERROR: "error"
  };

  const NANA_POSES = {
    front: "assets/companion/base/nana_front_v1.png",
    front45Left: "assets/companion/base/nana_front45_left_v1.png",
    left: "assets/companion/base/nana_left_v1.png",
    back45Left: "assets/companion/base/nana_back45_left_v1.png",
    back: "assets/companion/base/nana_back_v1.png",
    back45Right: "assets/companion/base/nana_back45_right_v1.png",
    right: "assets/companion/base/nana_right_v1.png",
    front45Right: "assets/companion/base/nana_front45_right_v1.png"
  };

  const NANA_DEFAULT_POSE = "front";

  const NANA_TIMING = {
    successMs: 650,
    errorMs: 1000
  };

  function isValidState(state) {
    return Object.values(NANA_STATES).includes(state);
  }

  function getPoseAsset(poseKey) {
    return NANA_POSES[poseKey] || NANA_POSES[NANA_DEFAULT_POSE];
  }

  global.NanaCompanionState = {
    NANA_STATES,
    NANA_POSES,
    NANA_DEFAULT_POSE,
    NANA_TIMING,
    isValidState,
    getPoseAsset
  };
})(window);
