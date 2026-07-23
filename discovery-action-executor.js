/**
 * Discovery Action Executor — TASK045 Phase 3B.1
 *
 * Routes DiscoveryActions to registered handlers.
 * Owns: action routing only.
 * Does NOT execute real Presentation / Conversation / Provider behavior.
 *
 * Architecture:
 * docs/06_ENGINEERING/TASK045_DISCOVERY_INTEGRATION_ARCHITECTURE.md
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NamoraDiscoveryActionExecutor = factory();
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

  function createDiscoveryActionExecutor(config) {
    config = config || {};
    var handlers = Object.create(null);
    var executionLog = [];

    function registerHandler(type, handler) {
      var actionType = String(type || "").trim();
      if (!actionType || typeof handler !== "function") {
        return false;
      }
      handlers[actionType] = handler;
      return true;
    }

    function hasHandler(type) {
      return typeof handlers[String(type || "")] === "function";
    }

    function listRegisteredTypes() {
      return Object.freeze(Object.keys(handlers).slice());
    }

    function getExecutionLog() {
      return freezeDeep(cloneValue(executionLog));
    }

    function clearExecutionLog() {
      executionLog = [];
    }

    function execute(action) {
      if (!action || typeof action !== "object" || !action.type) {
        return freezeDeep({
          handled: false,
          type: null,
          reason: null,
          error: "invalid-action"
        });
      }

      var type = String(action.type);
      var reason = action.reason != null ? String(action.reason) : null;
      var handler = handlers[type];

      if (typeof handler !== "function") {
        var unknownResult = {
          handled: false,
          type: type,
          reason: reason,
          error: "unknown-action-type"
        };
        executionLog.push({
          type: type,
          reason: reason,
          handled: false
        });
        return freezeDeep(unknownResult);
      }

      var handlerResult = null;
      try {
        handlerResult = handler({
          type: type,
          reason: reason,
          payload: cloneValue(action.payload || {})
        });
      } catch (err) {
        var failure = {
          handled: false,
          type: type,
          reason: reason,
          error: "handler-threw"
        };
        executionLog.push({
          type: type,
          reason: reason,
          handled: false,
          error: "handler-threw"
        });
        return freezeDeep(failure);
      }

      var handled =
        handlerResult && typeof handlerResult === "object"
          ? handlerResult.handled !== false
          : true;

      var result = {
        handled: !!handled,
        type: type,
        reason: reason
      };

      if (handlerResult && typeof handlerResult === "object") {
        if (handlerResult.detail !== undefined) {
          result.detail = cloneValue(handlerResult.detail);
        }
      }

      executionLog.push({
        type: type,
        reason: reason,
        handled: result.handled
      });

      return freezeDeep(result);
    }

    return Object.freeze({
      id: "discovery-action-executor",
      registerHandler: registerHandler,
      hasHandler: hasHandler,
      listRegisteredTypes: listRegisteredTypes,
      execute: execute,
      getExecutionLog: getExecutionLog,
      clearExecutionLog: clearExecutionLog
    });
  }

  return Object.freeze({
    createDiscoveryActionExecutor: createDiscoveryActionExecutor
  });
});
