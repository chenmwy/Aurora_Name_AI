/**
 * TASK045 Phase 2B — Discovery Runtime Skeleton verification
 * Node-only. No browser. No Namora integration.
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const {
  createDiscoveryRuntime,
  EVENT_TYPES
} = require(path.join(__dirname, "..", "discovery-runtime.js"));

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

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function run() {
  console.log("=== Discovery Runtime Skeleton Verification ===\n");

  // 1. Initial state
  const runtime = createDiscoveryRuntime();
  let state = runtime.getState();
  assert(state.phase === "understanding", "1. initial phase is understanding");
  assert(state.target === null, "1. initial target is null");
  assert(
    Array.isArray(state.constraints.allowedDirections) &&
      state.constraints.allowedDirections.length === 0,
    "1. allowedDirections empty"
  );
  assert(
    Array.isArray(state.constraints.excludedDirections) &&
      state.constraints.excludedDirections.length === 0,
    "1. excludedDirections empty"
  );
  assert(state.anchors.length === 0, "1. anchors empty");
  assert(state.preferences.length === 0, "1. preferences empty");
  assert(state.history.length === 0, "1. history empty");

  let action = runtime.resolveAction();
  assert(
    action &&
      action.type === "ask" &&
      action.reason === "missing-target" &&
      deepEqual(action.payload, {}),
    "1. resolveAction asks for missing-target"
  );

  // 2. DirectionSelected
  let result = runtime.processEvent({
    type: EVENT_TYPES.DirectionSelected,
    payload: { directionId: "modern", label: "现代", weight: 0.8 }
  });
  assert(result.ok === true, "2. DirectionSelected ok");
  state = result.state;
  assert(state.phase === "direction-selection", "2. phase becomes direction-selection");
  assert(state.constraints.allowedDirections.length === 1, "2. allowedDirections updated");
  assert(
    state.constraints.allowedDirections[0].directionId === "modern" &&
      state.constraints.allowedDirections[0].label === "现代" &&
      state.constraints.allowedDirections[0].weight === 0.8,
    "2. direction data preserved"
  );
  assert(state.history.length === 1, "2. history appended");
  assert(
    state.history[0].type === "DirectionSelected",
    "2. history type DirectionSelected"
  );

  // 3. NameSelected
  result = runtime.processEvent({
    type: EVENT_TYPES.NameSelected,
    payload: {
      candidateId: "name-lumi",
      name: "Lumi",
      origin: "inside-constraint",
      sourceDirectionId: "modern"
    }
  });
  assert(result.ok === true, "3. NameSelected ok");
  state = result.state;
  assert(state.phase === "name-exploration", "3. phase is name-exploration");
  assert(state.anchors.length === 1, "3. anchor created");
  assert(
    state.anchors[0].name === "Lumi" &&
      state.anchors[0].candidateId === "name-lumi" &&
      state.anchors[0].origin === "inside-constraint" &&
      state.anchors[0].sourceDirectionId === "modern",
    "3. anchor fields preserved"
  );
  assert(
    result.action &&
      result.action.type === "refine" &&
      result.action.reason === "expand-selected-anchor" &&
      result.action.payload.anchor.name === "Lumi",
    "3. processEvent returns refine action"
  );

  // 4. Outside constraint preservation
  const beforeExcluded = JSON.stringify(state.constraints.excludedDirections);
  result = runtime.processEvent({
    type: EVENT_TYPES.NameSelected,
    payload: {
      candidateId: "name-miu",
      name: "Miu",
      origin: "outside-constraint",
      sourceDirectionId: "minimal"
    }
  });
  assert(result.ok === true, "4. outside NameSelected ok");
  state = result.state;
  assert(
    state.anchors[state.anchors.length - 1].origin === "outside-constraint" &&
      state.anchors[state.anchors.length - 1].sourceDirectionId === "minimal",
    "4. outside origin and sourceDirectionId preserved"
  );
  assert(
    JSON.stringify(state.constraints.excludedDirections) === beforeExcluded,
    "4. excludedDirections unchanged by outside selection"
  );
  assert(
    !state.constraints.allowedDirections.some(function (d) {
      return d.directionId === "minimal";
    }),
    "4. excluded direction not re-enabled via allowedDirections"
  );

  // 5. UserPreferenceAdded
  result = runtime.processEvent({
    type: EVENT_TYPES.UserPreferenceAdded,
    payload: { preferenceType: "tone", value: "stronger" }
  });
  assert(result.ok === true, "5. UserPreferenceAdded ok");
  state = result.state;
  assert(state.preferences.length === 1, "5. preference appended");
  assert(
    state.preferences[0].preferenceType === "tone" &&
      state.preferences[0].value === "stronger",
    "5. preference value preserved"
  );
  assert(state.phase === "name-refinement", "5. phase becomes name-refinement");
  assert(
    result.action &&
      result.action.type === "refine" &&
      result.action.reason === "preference-guided-refine",
    "5. preference guides refine action"
  );

  // 6. CandidateRejected
  const constraintsBeforeReject = JSON.stringify(state.constraints);
  result = runtime.processEvent({
    type: EVENT_TYPES.CandidateRejected,
    payload: { candidateId: "name-luno", reason: "too-soft" }
  });
  assert(result.ok === true, "6. CandidateRejected ok");
  state = result.state;
  assert(
    state.history.some(function (h) {
      return (
        h.type === "CandidateRejected" &&
        h.payload.candidateId === "name-luno" &&
        h.payload.reason === "too-soft"
      );
    }),
    "6. rejection recorded in history"
  );
  assert(
    JSON.stringify(state.constraints) === constraintsBeforeReject,
    "6. constraints unchanged after rejection"
  );

  // 7. UserInputReceived
  const historyBeforeInput = state.history.length;
  result = runtime.processEvent({
    type: EVENT_TYPES.UserInputReceived,
    payload: { text: "我想要更有力量感" }
  });
  assert(result.ok === true, "7. UserInputReceived ok");
  state = result.state;
  assert(state.history.length === historyBeforeInput + 1, "7. history recorded");
  assert(
    state.history[state.history.length - 1].payload.text === "我想要更有力量感",
    "7. text preserved without interpretation"
  );

  // 8. resolveAction with anchor
  action = runtime.resolveAction();
  assert(
    action &&
      action.type === "refine" &&
      action.reason === "preference-guided-refine" &&
      action.payload.anchor &&
      action.payload.anchor.candidateId === "name-miu",
    "8. resolveAction returns preference-guided refine for latest anchor"
  );

  // 9. Unknown event
  result = runtime.processEvent({
    type: "TotallyUnknownEvent",
    payload: { foo: 1 }
  });
  assert(result.ok === false, "9. unknown event returns ok:false");
  assert(result.action === null, "9. unknown event action is null");

  // 10. reset
  const resetState = runtime.reset();
  assert(resetState.phase === "understanding", "10. reset phase understanding");
  assert(resetState.anchors.length === 0, "10. reset clears anchors");
  assert(resetState.history.length === 0, "10. reset clears history");
  assert(
    runtime.resolveAction().reason === "missing-target",
    "10. reset restores missing-target action"
  );

  // 11. State immutability (snapshots are frozen; mutations must not leak)
  const fresh = createDiscoveryRuntime();
  const snap = fresh.getState();
  let phaseMutated = false;
  let constraintsMutated = false;
  let historyMutated = false;
  try {
    snap.phase = "test";
    phaseMutated = snap.phase === "test";
  } catch (err) {
    phaseMutated = false;
  }
  try {
    snap.constraints.allowedDirections.push({ directionId: "hacked" });
    constraintsMutated = snap.constraints.allowedDirections.length > 0;
  } catch (err) {
    constraintsMutated = false;
  }
  try {
    snap.history.push({ type: "hacked" });
    historyMutated = snap.history.length > 0;
  } catch (err) {
    historyMutated = false;
  }
  const internal = fresh.getState();
  assert(
    !phaseMutated && internal.phase === "understanding",
    "11. phase mutation does not leak"
  );
  assert(
    !constraintsMutated && internal.constraints.allowedDirections.length === 0,
    "11. constraints mutation does not leak"
  );
  assert(
    !historyMutated && internal.history.length === 0,
    "11. history mutation does not leak"
  );

  const hist = fresh.getHistory();
  let histPushSucceeded = false;
  try {
    hist.push({ type: "hacked-history" });
    histPushSucceeded = hist.length > 0;
  } catch (err) {
    histPushSucceeded = false;
  }
  assert(
    !histPushSucceeded && fresh.getHistory().length === 0,
    "11. getHistory snapshot immutable"
  );

  console.log("\n=== Summary ===");
  console.log("Passed:", passed);
  console.log("Failed:", failed);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
