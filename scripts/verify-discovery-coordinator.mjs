/**
 * TASK045 Phase 3D — Discovery Coordinator Skeleton verification
 * Node-only. No Namora boot integration.
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const { createDiscoveryCoordinator } = require(
  path.join(root, "discovery-coordinator.js")
);
const { createDiscoveryEventBridge } = require(
  path.join(root, "discovery-event-bridge.js")
);
const { createDiscoveryRuntime } = require(
  path.join(root, "discovery-runtime.js")
);
const { createDiscoveryActionExecutor } = require(
  path.join(root, "discovery-action-executor.js")
);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log("PASS:", message);
  } else {
    failed += 1;
    console.error("FAIL:", message);
  }
}

function registerStubHandlers(executor) {
  executor.registerHandler("ask", function (action) {
    return { handled: true, type: "ask", detail: { reason: action.reason } };
  });
  executor.registerHandler("refine", function (action) {
    return {
      handled: true,
      type: "refine",
      detail: { anchor: action.payload && action.payload.anchor }
    };
  });
  executor.registerHandler("present", function (action) {
    return { handled: true, type: "present", detail: { reason: action.reason } };
  });
  executor.registerHandler("generate", function (action) {
    return { handled: true, type: "generate", detail: { reason: action.reason } };
  });
}

function run() {
  console.log("=== Discovery Coordinator Verification ===\n");

  // 1. Coordinator creation (defaults)
  const coordinator = createDiscoveryCoordinator();
  assert(!!coordinator && typeof coordinator.handleEvent === "function", "1. coordinator created");
  assert(coordinator.id === "discovery-coordinator", "1. coordinator id");
  const modules = coordinator.getModules();
  assert(
    modules.eventBridge && modules.discoveryRuntime && modules.actionExecutor,
    "1. default modules composed"
  );
  registerStubHandlers(modules.actionExecutor);

  // Initial ask path via resolve-only state (no event yet)
  assert(
    coordinator.getDiscoveryState().phase === "understanding",
    "1. initial discovery phase understanding"
  );

  // 2. Direction event pipeline
  const directionResult = coordinator.handleEvent({
    type: "direction-selected",
    payload: {
      directionId: "modern",
      label: "现代",
      weight: 0.7
    }
  });
  assert(directionResult.success === true, "2. direction pipeline success");
  assert(
    directionResult.event && directionResult.event.type === "DirectionSelected",
    "2. Bridge created DirectionSelected"
  );
  assert(
    directionResult.state.constraints.allowedDirections.some(function (d) {
      return d.directionId === "modern";
    }),
    "2. Runtime updated allowedDirections"
  );
  assert(
    directionResult.action === null || typeof directionResult.action === "object",
    "2. action field present in result"
  );
  // After direction only (no anchors), action may be null — still success
  assert(
    directionResult.execution === null || directionResult.execution.handled === true,
    "2. execution absent or handled"
  );

  // 3. Name event pipeline
  const nameResult = coordinator.handleEvent({
    type: "name-selected",
    payload: {
      candidateId: "name-lumi",
      name: "Lumi",
      origin: "inside-constraint",
      sourceDirectionId: "modern"
    }
  });
  assert(nameResult.success === true, "3. name pipeline success");
  assert(nameResult.event.type === "NameSelected", "3. NameSelected event");
  assert(nameResult.state.phase === "name-exploration", "3. phase name-exploration");
  assert(nameResult.state.anchors.length >= 1, "3. anchor created");
  assert(
    nameResult.state.anchors[0].name === "Lumi" &&
      nameResult.state.anchors[0].origin === "inside-constraint" &&
      nameResult.state.anchors[0].sourceDirectionId === "modern",
    "3. origin/sourceDirectionId preserved"
  );
  assert(
    nameResult.action &&
      nameResult.action.type === "refine" &&
      nameResult.action.reason === "expand-selected-anchor",
    "3. refine action resolved"
  );
  assert(
    nameResult.execution && nameResult.execution.handled === true,
    "3. action executed via executor"
  );

  // 4. Outside constraint preservation
  const beforeExcluded = JSON.stringify(
    nameResult.state.constraints.excludedDirections
  );
  const outsideResult = coordinator.handleEvent({
    type: "name-selected",
    payload: {
      candidateId: "name-miu",
      name: "Miu",
      origin: "outside-constraint",
      sourceDirectionId: "minimal"
    }
  });
  assert(outsideResult.success === true, "4. outside name pipeline success");
  assert(
    outsideResult.state.anchors.some(function (a) {
      return (
        a.candidateId === "name-miu" &&
        a.origin === "outside-constraint" &&
        a.sourceDirectionId === "minimal"
      );
    }),
    "4. outside anchor preserved"
  );
  assert(
    JSON.stringify(outsideResult.state.constraints.excludedDirections) ===
      beforeExcluded,
    "4. excludedDirections unchanged"
  );
  assert(
    !outsideResult.state.constraints.allowedDirections.some(function (d) {
      return d.directionId === "minimal";
    }),
    "4. excluded direction not re-enabled"
  );

  // 5. User input pipeline
  const inputResult = coordinator.handleEvent({
    type: "user-input",
    payload: { text: "更有力量感" }
  });
  assert(inputResult.success === true, "5. user input pipeline success");
  assert(
    inputResult.event.type === "UserInputReceived",
    "5. UserInputReceived event"
  );
  assert(
    inputResult.state.history.some(function (h) {
      return h.type === "UserInputReceived" && h.payload.text === "更有力量感";
    }),
    "5. history recorded without interpretation"
  );

  // 6. Invalid event
  const invalidResult = coordinator.handleEvent({
    type: "not-a-real-event",
    payload: {}
  });
  assert(invalidResult.success === false, "6. invalid event fails");
  assert(invalidResult.event === null, "6. invalid event has null DiscoveryEvent");
  assert(invalidResult.stage === "bridge", "6. failure stage is bridge");

  const invalidPayload = coordinator.handleEvent({
    type: "name-selected",
    payload: { candidateId: "", name: "" }
  });
  assert(invalidPayload.success === false, "6. invalid payload fails at bridge");

  // 7. Action executor integration (unhandled action path)
  const isolatedRuntime = createDiscoveryRuntime();
  const isolatedBridge = createDiscoveryEventBridge();
  const emptyExecutor = createDiscoveryActionExecutor();
  const noHandlerCoordinator = createDiscoveryCoordinator({
    eventBridge: isolatedBridge,
    discoveryRuntime: isolatedRuntime,
    actionExecutor: emptyExecutor
  });
  const noHandlerResult = noHandlerCoordinator.handleEvent({
    type: "name-selected",
    payload: {
      candidateId: "name-luno",
      name: "Luno",
      origin: "inside-constraint",
      sourceDirectionId: "modern"
    }
  });
  assert(
    noHandlerResult.action && noHandlerResult.action.type === "refine",
    "7. action still resolved by runtime"
  );
  assert(
    noHandlerResult.success === false &&
      noHandlerResult.execution &&
      noHandlerResult.execution.handled === false,
    "7. missing executor handler returns failure without inventing fallback"
  );

  // 8. Dependency injection with mocks
  let bridgeCalls = 0;
  let runtimeCalls = 0;
  let executorCalls = 0;

  const mockBridge = {
    createEvent: function (input) {
      bridgeCalls += 1;
      if (!input || input.type !== "direction-selected") {
        return { ok: false, event: null, error: "mock-bridge-reject" };
      }
      return {
        ok: true,
        event: {
          type: "DirectionSelected",
          payload: {
            directionId: input.payload.directionId,
            label: input.payload.label,
            weight: input.payload.weight
          },
          timestamp: 123
        },
        error: null
      };
    }
  };

  const mockRuntime = {
    processEvent: function (event) {
      runtimeCalls += 1;
      return {
        ok: true,
        state: {
          phase: "direction-selection",
          mock: true,
          eventType: event.type
        },
        action: {
          type: "present",
          reason: "mock-present",
          payload: {}
        }
      };
    },
    getState: function () {
      return { phase: "direction-selection", mock: true };
    }
  };

  const mockExecutor = {
    execute: function (action) {
      executorCalls += 1;
      return {
        handled: true,
        type: action.type,
        reason: action.reason
      };
    }
  };

  const mocked = createDiscoveryCoordinator({
    eventBridge: mockBridge,
    discoveryRuntime: mockRuntime,
    actionExecutor: mockExecutor
  });
  const mockResult = mocked.handleEvent({
    type: "direction-selected",
    payload: { directionId: "elegant", label: "优雅", weight: 0.5 }
  });
  assert(bridgeCalls === 1, "8. mock bridge invoked");
  assert(runtimeCalls === 1, "8. mock runtime invoked");
  assert(executorCalls === 1, "8. mock executor invoked");
  assert(mockResult.success === true, "8. mocked pipeline success");
  assert(mockResult.state.mock === true, "8. mocked state returned");
  assert(mockResult.action.reason === "mock-present", "8. mocked action returned");
  assert(
    mocked.getModules().eventBridge === mockBridge &&
      mocked.getModules().discoveryRuntime === mockRuntime &&
      mocked.getModules().actionExecutor === mockExecutor,
    "8. injected dependencies retained"
  );

  assert(
    typeof mocked.getDiscoveryState === "function" &&
      JSON.stringify(mocked.getDiscoveryState()) ===
        JSON.stringify(mockRuntime.getState()),
    "8. state read-through remains on runtime"
  );

  console.log("\n=== Summary ===");
  console.log("Passed:", passed);
  console.log("Failed:", failed);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
