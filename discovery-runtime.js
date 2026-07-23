/**
 * Discovery Runtime Skeleton — TASK045 Phase 2B
 *
 * Isolated exploration state machine.
 * Owns: DiscoveryState, DiscoveryEvent processing, DiscoveryAction resolution.
 * Does NOT own: messages, input, rendering, providers, API.
 *
 * Architecture:
 * docs/06_ENGINEERING/TASK045_DISCOVERY_RUNTIME_ARCHITECTURE.md
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NamoraDiscoveryRuntime = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var EVENT_TYPES = Object.freeze({
    DirectionSelected: "DirectionSelected",
    NameSelected: "NameSelected",
    UserPreferenceAdded: "UserPreferenceAdded",
    CandidateRejected: "CandidateRejected",
    UserInputReceived: "UserInputReceived"
  });

  function createInitialState() {
    return {
      phase: "understanding",
      target: null,
      constraints: {
        allowedDirections: [],
        excludedDirections: []
      },
      anchors: [],
      preferences: [],
      history: [],
      readiness: {}
    };
  }

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

  function snapshotState(state) {
    return freezeDeep(cloneValue(state));
  }

  function appendHistory(state, event) {
    state.history.push({
      type: event.type,
      payload: cloneValue(event.payload || {}),
      timestamp: event.timestamp
    });
  }

  function findAllowedDirectionIndex(allowed, directionId) {
    for (var i = 0; i < allowed.length; i++) {
      if (allowed[i].directionId === directionId) {
        return i;
      }
    }
    return -1;
  }

  function applyDirectionSelected(state, payload) {
    payload = payload || {};
    var directionId = String(payload.directionId || "").trim();
    if (!directionId) {
      return false;
    }

    var entry = {
      directionId: directionId,
      label: payload.label != null ? String(payload.label) : directionId,
      weight:
        typeof payload.weight === "number" && isFinite(payload.weight)
          ? payload.weight
          : null
    };

    var index = findAllowedDirectionIndex(
      state.constraints.allowedDirections,
      directionId
    );
    if (index === -1) {
      state.constraints.allowedDirections.push(entry);
    } else {
      state.constraints.allowedDirections[index] = entry;
    }

    if (state.phase === "understanding") {
      state.phase = "direction-selection";
    }

    return true;
  }

  function applyNameSelected(state, payload) {
    payload = payload || {};
    var name = String(payload.name || "").trim();
    var candidateId = String(payload.candidateId || "").trim();
    if (!name || !candidateId) {
      return false;
    }

    var origin = String(payload.origin || "").trim() || null;
    var sourceDirectionId =
      String(payload.sourceDirectionId || "").trim() || null;

    var anchor = {
      name: name,
      candidateId: candidateId,
      origin: origin,
      sourceDirectionId: sourceDirectionId
    };

    var replaced = false;
    for (var i = 0; i < state.anchors.length; i++) {
      if (state.anchors[i].candidateId === candidateId) {
        state.anchors[i] = anchor;
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      state.anchors.push(anchor);
    }

    // Outside-constraint selections must never restore excluded directions.
    state.phase = "name-exploration";
    return true;
  }

  function applyUserPreferenceAdded(state, payload) {
    payload = payload || {};
    var preferenceType = String(payload.preferenceType || "").trim();
    if (!preferenceType) {
      return false;
    }

    state.preferences.push({
      preferenceType: preferenceType,
      value: payload.value
    });

    // Anchor + preference → refinement exploration (TASK046 Phase 1).
    if (state.anchors.length > 0) {
      state.phase = "name-refinement";
    }
    return true;
  }

  function applyCandidateRejected(state, payload) {
    payload = payload || {};
    var candidateId = String(payload.candidateId || "").trim();
    if (!candidateId) {
      return false;
    }
    // History records the rejection; constraints remain unchanged.
    return true;
  }

  function applyUserInputReceived(state, payload) {
    payload = payload || {};
    if (payload.text == null) {
      return false;
    }
    // Record only — no interpretation in Phase 2B.
    return true;
  }

  function applyEvent(state, event) {
    switch (event.type) {
      case EVENT_TYPES.DirectionSelected:
        return applyDirectionSelected(state, event.payload);
      case EVENT_TYPES.NameSelected:
        return applyNameSelected(state, event.payload);
      case EVENT_TYPES.UserPreferenceAdded:
        return applyUserPreferenceAdded(state, event.payload);
      case EVENT_TYPES.CandidateRejected:
        return applyCandidateRejected(state, event.payload);
      case EVENT_TYPES.UserInputReceived:
        return applyUserInputReceived(state, event.payload);
      default:
        return null;
    }
  }

  function resolveActionFromState(state) {
    if (state.phase === "understanding" && state.target === null) {
      return {
        type: "ask",
        reason: "missing-target",
        payload: {}
      };
    }

    if (state.anchors.length > 0) {
      var latestAnchor = state.anchors[state.anchors.length - 1];
      var hasPreference = state.preferences.length > 0;
      return {
        type: "refine",
        reason: hasPreference
          ? "preference-guided-refine"
          : "expand-selected-anchor",
        payload: {
          anchor: cloneValue(latestAnchor),
          preferences: cloneValue(state.preferences)
        }
      };
    }

    return null;
  }

  function createDiscoveryRuntime(config) {
    config = config || {};
    var state = createInitialState();

    if (config.initialState && typeof config.initialState === "object") {
      // Reserved for future tests; Phase 2B starts from createInitialState only.
    }

    function getState() {
      return snapshotState(state);
    }

    function getHistory() {
      return freezeDeep(cloneValue(state.history));
    }

    function reset() {
      state = createInitialState();
      return getState();
    }

    function resolveAction() {
      var action = resolveActionFromState(state);
      return action ? freezeDeep(cloneValue(action)) : null;
    }

    function processEvent(event) {
      if (!event || typeof event !== "object" || !event.type) {
        return {
          ok: false,
          state: getState(),
          action: null
        };
      }

      var normalizedEvent = {
        type: String(event.type),
        payload:
          event.payload && typeof event.payload === "object"
            ? cloneValue(event.payload)
            : {},
        timestamp:
          typeof event.timestamp === "number" && isFinite(event.timestamp)
            ? event.timestamp
            : Date.now()
      };

      var applied = applyEvent(state, normalizedEvent);
      if (applied === null) {
        return {
          ok: false,
          state: getState(),
          action: null
        };
      }

      if (applied === false) {
        return {
          ok: false,
          state: getState(),
          action: null
        };
      }

      appendHistory(state, normalizedEvent);

      return {
        ok: true,
        state: getState(),
        action: resolveAction()
      };
    }

    return Object.freeze({
      id: "discovery-runtime",
      getState: getState,
      reset: reset,
      processEvent: processEvent,
      resolveAction: resolveAction,
      getHistory: getHistory
    });
  }

  return Object.freeze({
    createDiscoveryRuntime: createDiscoveryRuntime,
    EVENT_TYPES: EVENT_TYPES
  });
});
