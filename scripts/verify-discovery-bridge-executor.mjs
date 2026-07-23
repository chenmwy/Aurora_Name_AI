/**
 * TASK045 Phase 3B.1 — Event Bridge + Action Executor verification
 * Node-only. No Namora boot integration.
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const { createDiscoveryEventBridge } = require(
  path.join(root, "discovery-event-bridge.js")
);
const { createDiscoveryActionExecutor } = require(
  path.join(root, "discovery-action-executor.js")
);
const { createDiscoveryRuntime } = require(
  path.join(root, "discovery-runtime.js")
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

function run() {
  console.log("=== Discovery Bridge + Executor Verification ===\n");

  const bridge = createDiscoveryEventBridge();
  const executor = createDiscoveryActionExecutor();
  const runtime = createDiscoveryRuntime();

  // 1. direction-selected conversion
  const directionResult = bridge.createEvent({
    type: "direction-selected",
    payload: {
      directionId: "modern",
      label: "现代",
      weight: 0.8
    }
  });
  assert(directionResult.ok === true, "1. direction-selected ok");
  assert(
    directionResult.event.type === "DirectionSelected",
    "1. DiscoveryEvent type DirectionSelected"
  );
  assert(
    directionResult.event.payload.directionId === "modern" &&
      directionResult.event.payload.label === "现代" &&
      directionResult.event.payload.weight === 0.8,
    "1. direction payload preserved"
  );
  assert(
    typeof directionResult.event.timestamp === "number",
    "1. timestamp assigned"
  );

  // 2. name-selected conversion
  const nameResult = bridge.createEvent({
    type: "name-selected",
    payload: {
      candidateId: "name-miu",
      name: "Miu",
      origin: "outside-constraint",
      sourceDirectionId: "minimal"
    }
  });
  assert(nameResult.ok === true, "2. name-selected ok");
  assert(nameResult.event.type === "NameSelected", "2. type NameSelected");
  assert(
    nameResult.event.payload.origin === "outside-constraint" &&
      nameResult.event.payload.sourceDirectionId === "minimal",
    "2. origin and sourceDirectionId preserved"
  );

  // 3. user-input conversion
  const inputResult = bridge.createEvent({
    type: "user-input",
    payload: { text: "我想要更有力量感" }
  });
  assert(inputResult.ok === true, "3. user-input ok");
  assert(
    inputResult.event.type === "UserInputReceived",
    "3. type UserInputReceived"
  );
  assert(
    inputResult.event.payload.text === "我想要更有力量感",
    "3. text preserved"
  );

  // 4. invalid event handling
  const unknownExternal = bridge.createEvent({
    type: "totally-unknown",
    payload: {}
  });
  assert(unknownExternal.ok === false, "4. unknown external type rejected");
  assert(unknownExternal.event === null, "4. unknown external event null");

  const invalidName = bridge.createEvent({
    type: "name-selected",
    payload: { candidateId: "", name: "" }
  });
  assert(invalidName.ok === false, "4. invalid name payload rejected");

  const invalidInput = bridge.createEvent(null);
  assert(invalidInput.ok === false, "4. null input rejected");

  // Pipeline check: bridge -> runtime (no Namora wiring)
  const processedDirection = runtime.processEvent(directionResult.event);
  assert(processedDirection.ok === true, "pipeline: DirectionSelected accepted");
  assert(
    processedDirection.state.constraints.allowedDirections[0].directionId ===
      "modern",
    "pipeline: allowedDirections updated via bridged event"
  );

  const processedName = runtime.processEvent(nameResult.event);
  assert(processedName.ok === true, "pipeline: NameSelected accepted");
  assert(
    processedName.state.anchors[0].origin === "outside-constraint",
    "pipeline: outside origin preserved in DiscoveryState"
  );
  assert(
    processedName.state.constraints.excludedDirections.length === 0,
    "pipeline: excludedDirections unchanged"
  );

  // 5. register handler
  let presentCalls = 0;
  const registered = executor.registerHandler("present", function (action) {
    presentCalls += 1;
    return {
      handled: true,
      type: "present",
      detail: {
        reason: action.reason
      }
    };
  });
  assert(registered === true, "5. registerHandler present succeeds");
  assert(executor.hasHandler("present") === true, "5. hasHandler present");
  assert(
    executor.listRegisteredTypes().indexOf("present") !== -1,
    "5. listed registered type"
  );

  // 6. execute registered action
  const executePresent = executor.execute({
    type: "present",
    reason: "expand-selected-name",
    payload: { presentationType: "name-candidate" }
  });
  assert(executePresent.handled === true, "6. present handled");
  assert(executePresent.type === "present", "6. present type echoed");
  assert(
    executePresent.reason === "expand-selected-name",
    "6. present reason echoed"
  );
  assert(presentCalls === 1, "6. present handler invoked once");

  // Also route a refine action from runtime decision through executor stub
  let refineCalls = 0;
  executor.registerHandler("refine", function (action) {
    refineCalls += 1;
    return {
      handled: true,
      type: "refine",
      detail: { anchor: action.payload && action.payload.anchor }
    };
  });
  const refineAction = runtime.resolveAction();
  const executeRefine = executor.execute(refineAction);
  assert(
    refineAction && refineAction.type === "refine",
    "6b. runtime resolved refine"
  );
  assert(executeRefine.handled === true, "6b. refine routed");
  assert(refineCalls === 1, "6b. refine handler invoked");

  // 7. unknown action
  const unknownAction = executor.execute({
    type: "teleport",
    reason: "should-not-run",
    payload: {}
  });
  assert(unknownAction.handled === false, "7. unknown action not handled");
  assert(unknownAction.type === "teleport", "7. unknown type echoed");

  const invalidAction = executor.execute(null);
  assert(invalidAction.handled === false, "7. null action not handled");

  // 8. no side effects — handlers are stubs; Discovery Runtime state unchanged
  //    by executor; executor does not invent Presentation/Conversation calls.
  const stateBefore = runtime.getState();
  executor.execute({
    type: "present",
    reason: "side-effect-check",
    payload: { presentationType: "choice" }
  });
  const stateAfter = runtime.getState();
  assert(
    JSON.stringify(stateBefore) === JSON.stringify(stateAfter),
    "8. executor does not mutate DiscoveryState"
  );
  assert(presentCalls === 2, "8. only stub handler side effect is local counter");
  assert(
    typeof executor.execute === "function" &&
      typeof bridge.createEvent === "function" &&
      typeof runtime.processEvent === "function",
    "8. ownership boundaries remain separate APIs"
  );

  console.log("\n=== Summary ===");
  console.log("Passed:", passed);
  console.log("Failed:", failed);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
