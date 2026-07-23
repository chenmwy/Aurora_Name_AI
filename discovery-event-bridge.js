/**
 * Discovery Event Bridge — TASK045 Phase 3B.1
 *
 * Transforms external interaction outcomes into DiscoveryEvents.
 * Owns: event normalization only.
 * Does NOT own: DiscoveryState, Presentation, Conversation, Provider.
 *
 * Architecture:
 * docs/06_ENGINEERING/TASK045_DISCOVERY_INTEGRATION_ARCHITECTURE.md
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NamoraDiscoveryEventBridge = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var EXTERNAL_TO_DISCOVERY = Object.freeze({
    "direction-selected": "DirectionSelected",
    "name-selected": "NameSelected",
    "user-input": "UserInputReceived",
    "user-preference-added": "UserPreferenceAdded",
    "candidate-rejected": "CandidateRejected"
  });

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

  function normalizeDirectionPayload(payload) {
    payload = payload || {};
    var directionId = String(payload.directionId || "").trim();
    if (!directionId) return null;
    return {
      directionId: directionId,
      label: payload.label != null ? String(payload.label) : directionId,
      weight:
        typeof payload.weight === "number" && isFinite(payload.weight)
          ? payload.weight
          : null
    };
  }

  function normalizeNamePayload(payload) {
    payload = payload || {};
    var candidateId = String(payload.candidateId || "").trim();
    var name = String(payload.name || "").trim();
    if (!candidateId || !name) return null;
    return {
      candidateId: candidateId,
      name: name,
      origin: String(payload.origin || "").trim() || null,
      sourceDirectionId: String(payload.sourceDirectionId || "").trim() || null
    };
  }

  function normalizeUserInputPayload(payload) {
    payload = payload || {};
    if (payload.text == null) return null;
    return {
      text: String(payload.text)
    };
  }

  function normalizePreferencePayload(payload) {
    payload = payload || {};
    var preferenceType = String(payload.preferenceType || "").trim();
    if (!preferenceType) return null;
    return {
      preferenceType: preferenceType,
      value: payload.value
    };
  }

  function normalizeRejectionPayload(payload) {
    payload = payload || {};
    var candidateId = String(payload.candidateId || "").trim();
    if (!candidateId) return null;
    return {
      candidateId: candidateId,
      reason: payload.reason != null ? String(payload.reason) : null
    };
  }

  function normalizePayload(discoveryType, payload) {
    switch (discoveryType) {
      case "DirectionSelected":
        return normalizeDirectionPayload(payload);
      case "NameSelected":
        return normalizeNamePayload(payload);
      case "UserInputReceived":
        return normalizeUserInputPayload(payload);
      case "UserPreferenceAdded":
        return normalizePreferencePayload(payload);
      case "CandidateRejected":
        return normalizeRejectionPayload(payload);
      default:
        return null;
    }
  }

  function createDiscoveryEventBridge(config) {
    config = config || {};

    function createEvent(input) {
      if (!input || typeof input !== "object" || !input.type) {
        return {
          ok: false,
          event: null,
          error: "invalid-input"
        };
      }

      var externalType = String(input.type);
      var discoveryType = EXTERNAL_TO_DISCOVERY[externalType];
      if (!discoveryType) {
        return {
          ok: false,
          event: null,
          error: "unknown-external-type"
        };
      }

      var normalizedPayload = normalizePayload(discoveryType, input.payload);
      if (!normalizedPayload) {
        return {
          ok: false,
          event: null,
          error: "invalid-payload"
        };
      }

      var timestamp =
        typeof input.timestamp === "number" && isFinite(input.timestamp)
          ? input.timestamp
          : Date.now();

      var event = freezeDeep({
        type: discoveryType,
        payload: cloneValue(normalizedPayload),
        timestamp: timestamp
      });

      return {
        ok: true,
        event: event,
        error: null
      };
    }

    return Object.freeze({
      id: "discovery-event-bridge",
      createEvent: createEvent,
      supportedExternalTypes: Object.freeze(
        Object.keys(EXTERNAL_TO_DISCOVERY).slice()
      )
    });
  }

  return Object.freeze({
    createDiscoveryEventBridge: createDiscoveryEventBridge,
    EXTERNAL_TO_DISCOVERY: EXTERNAL_TO_DISCOVERY
  });
});
