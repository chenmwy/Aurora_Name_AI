/**
 * Discovery Coordinator — TASK045 Phase 3D
 *
 * Orchestrates Event Bridge → Discovery Runtime → Action Executor.
 * Owns: pipeline sequencing, module composition, structured results.
 * Does NOT own: DiscoveryState, decisions, rendering, messaging, providers.
 *
 * Architecture:
 * docs/06_ENGINEERING/TASK045_DISCOVERY_COORDINATOR_ARCHITECTURE.md
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root, require);
  } else {
    root.NamoraDiscoveryCoordinator = factory(root, null);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (
  root,
  maybeRequire
) {
  "use strict";

  function freezeResult(result) {
    return Object.freeze(result);
  }

  function resolveDependency(explicit, loader) {
    if (explicit) return explicit;
    return loader();
  }

  function loadDefaultBridge() {
    if (maybeRequire) {
      return maybeRequire("./discovery-event-bridge.js").createDiscoveryEventBridge();
    }
    if (root && root.NamoraDiscoveryEventBridge) {
      return root.NamoraDiscoveryEventBridge.createDiscoveryEventBridge();
    }
    throw new Error(
      "[DiscoveryCoordinator] eventBridge required (no default available)"
    );
  }

  function loadDefaultRuntime() {
    if (maybeRequire) {
      return maybeRequire("./discovery-runtime.js").createDiscoveryRuntime();
    }
    if (root && root.NamoraDiscoveryRuntime) {
      return root.NamoraDiscoveryRuntime.createDiscoveryRuntime();
    }
    throw new Error(
      "[DiscoveryCoordinator] discoveryRuntime required (no default available)"
    );
  }

  function loadDefaultExecutor() {
    if (maybeRequire) {
      return maybeRequire("./discovery-action-executor.js").createDiscoveryActionExecutor();
    }
    if (root && root.NamoraDiscoveryActionExecutor) {
      return root.NamoraDiscoveryActionExecutor.createDiscoveryActionExecutor();
    }
    throw new Error(
      "[DiscoveryCoordinator] actionExecutor required (no default available)"
    );
  }

  function createDiscoveryCoordinator(config) {
    config = config || {};

    var eventBridge = resolveDependency(config.eventBridge, loadDefaultBridge);
    var discoveryRuntime = resolveDependency(
      config.discoveryRuntime,
      loadDefaultRuntime
    );
    var actionExecutor = resolveDependency(
      config.actionExecutor,
      loadDefaultExecutor
    );

    if (
      !eventBridge ||
      typeof eventBridge.createEvent !== "function" ||
      !discoveryRuntime ||
      typeof discoveryRuntime.processEvent !== "function" ||
      !actionExecutor ||
      typeof actionExecutor.execute !== "function"
    ) {
      throw new Error(
        "[DiscoveryCoordinator] invalid dependencies: bridge/runtime/executor required"
      );
    }

    function buildResult(partial) {
      return freezeResult({
        success: !!partial.success,
        event: partial.event != null ? partial.event : null,
        state: partial.state != null ? partial.state : null,
        action: partial.action != null ? partial.action : null,
        execution: partial.execution != null ? partial.execution : null,
        stage: partial.stage || null,
        error: partial.error != null ? partial.error : null
      });
    }

    function handleEvent(externalEvent) {
      var bridgeResult = eventBridge.createEvent(externalEvent);
      if (!bridgeResult || bridgeResult.ok !== true || !bridgeResult.event) {
        return buildResult({
          success: false,
          event: null,
          state:
            typeof discoveryRuntime.getState === "function"
              ? discoveryRuntime.getState()
              : null,
          action: null,
          execution: null,
          stage: "bridge",
          error:
            (bridgeResult && bridgeResult.error) || "bridge-failure"
        });
      }

      var discoveryEvent = bridgeResult.event;
      var runtimeResult = discoveryRuntime.processEvent(discoveryEvent);
      if (!runtimeResult || runtimeResult.ok !== true) {
        return buildResult({
          success: false,
          event: discoveryEvent,
          state: runtimeResult ? runtimeResult.state : null,
          action: null,
          execution: null,
          stage: "runtime",
          error: "runtime-rejection"
        });
      }

      var action = runtimeResult.action || null;
      if (!action) {
        return buildResult({
          success: true,
          event: discoveryEvent,
          state: runtimeResult.state,
          action: null,
          execution: null,
          stage: "complete",
          error: null
        });
      }

      var execution = actionExecutor.execute(action);
      var handled = !!(execution && execution.handled);
      return buildResult({
        success: handled,
        event: discoveryEvent,
        state: runtimeResult.state,
        action: action,
        execution: execution,
        stage: handled ? "complete" : "executor",
        error: handled
          ? null
          : (execution && execution.error) || "executor-failure"
      });
    }

    function process(discoveryEvent) {
      var runtimeResult = discoveryRuntime.processEvent(discoveryEvent);
      if (!runtimeResult || runtimeResult.ok !== true) {
        return buildResult({
          success: false,
          event: discoveryEvent || null,
          state: runtimeResult ? runtimeResult.state : null,
          action: null,
          execution: null,
          stage: "runtime",
          error: "runtime-rejection"
        });
      }

      var action = runtimeResult.action || null;
      if (!action) {
        return buildResult({
          success: true,
          event: discoveryEvent || null,
          state: runtimeResult.state,
          action: null,
          execution: null,
          stage: "complete",
          error: null
        });
      }

      var execution = actionExecutor.execute(action);
      var handled = !!(execution && execution.handled);
      return buildResult({
        success: handled,
        event: discoveryEvent || null,
        state: runtimeResult.state,
        action: action,
        execution: execution,
        stage: handled ? "complete" : "executor",
        error: handled
          ? null
          : (execution && execution.error) || "executor-failure"
      });
    }

    function execute(action) {
      if (!action) {
        return buildResult({
          success: false,
          event: null,
          state:
            typeof discoveryRuntime.getState === "function"
              ? discoveryRuntime.getState()
              : null,
          action: null,
          execution: null,
          stage: "executor",
          error: "invalid-action"
        });
      }

      var execution = actionExecutor.execute(action);
      var handled = !!(execution && execution.handled);
      return buildResult({
        success: handled,
        event: null,
        state:
          typeof discoveryRuntime.getState === "function"
            ? discoveryRuntime.getState()
            : null,
        action: action,
        execution: execution,
        stage: handled ? "complete" : "executor",
        error: handled
          ? null
          : (execution && execution.error) || "executor-failure"
      });
    }

    return Object.freeze({
      id: "discovery-coordinator",
      handleEvent: handleEvent,
      process: process,
      execute: execute,
      getDiscoveryState: function () {
        return discoveryRuntime.getState();
      },
      getModules: function () {
        return Object.freeze({
          eventBridge: eventBridge,
          discoveryRuntime: discoveryRuntime,
          actionExecutor: actionExecutor
        });
      }
    });
  }

  return Object.freeze({
    createDiscoveryCoordinator: createDiscoveryCoordinator
  });
});
