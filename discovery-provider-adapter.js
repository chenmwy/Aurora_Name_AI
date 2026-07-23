/**
 * Discovery Provider Adapter — TASK046 Phase 1
 *
 * Builds structured Discovery Context for Response Providers.
 * Owns: context shaping from DiscoveryState + DiscoveryAction.
 * Does NOT own: DiscoveryState decisions, Presentation, Conversation messages.
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NamoraDiscoveryProviderAdapter = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function cloneValue(value) {
    if (value === null || typeof value !== "object") {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(cloneValue);
    }
    var out = {};
    Object.keys(value).forEach(function (key) {
      out[key] = cloneValue(value[key]);
    });
    return out;
  }

  function freezeDeep(value) {
    if (value === null || typeof value !== "object") {
      return value;
    }
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        freezeDeep(value[i]);
      }
      return Object.freeze(value);
    }
    Object.keys(value).forEach(function (key) {
      freezeDeep(value[key]);
    });
    return Object.freeze(value);
  }

  function latestPreference(preferences) {
    if (!Array.isArray(preferences) || preferences.length < 1) {
      return null;
    }
    return cloneValue(preferences[preferences.length - 1]);
  }

  function latestAnchor(anchors, action) {
    if (
      action &&
      action.payload &&
      action.payload.anchor &&
      typeof action.payload.anchor === "object"
    ) {
      return cloneValue(action.payload.anchor);
    }
    if (!Array.isArray(anchors) || anchors.length < 1) {
      return null;
    }
    return cloneValue(anchors[anchors.length - 1]);
  }

  /**
   * Structured context passed to providers.
   * Provider only generates; Discovery Runtime decides.
   */
  function buildDiscoveryContext(state, action) {
    state = state || {};
    action = action || null;
    var constraints = state.constraints || {};
    var anchor = latestAnchor(state.anchors, action);
    var preference = latestPreference(state.preferences);

    return freezeDeep({
      action: action && action.type ? String(action.type) : null,
      reason: action && action.reason != null ? String(action.reason) : null,
      phase: state.phase != null ? String(state.phase) : null,
      anchor: anchor,
      allowedDirections: Array.isArray(constraints.allowedDirections)
        ? cloneValue(constraints.allowedDirections)
        : [],
      excludedDirections: Array.isArray(constraints.excludedDirections)
        ? cloneValue(constraints.excludedDirections)
        : [],
      userPreference: preference,
      preferences: Array.isArray(state.preferences)
        ? cloneValue(state.preferences)
        : []
    });
  }

  function createDiscoveryProviderAdapter() {
    return Object.freeze({
      id: "discovery-provider-adapter",
      buildDiscoveryContext: buildDiscoveryContext
    });
  }

  return Object.freeze({
    createDiscoveryProviderAdapter: createDiscoveryProviderAdapter,
    buildDiscoveryContext: buildDiscoveryContext
  });
});
