/**
 * TASK046 Phase 1 — First Discovery Integration verification
 *
 * 1) Node: Discovery Runtime + Provider Adapter refine context
 * 2) Source: Conversation emits facts; Provider receives discoveryContext
 * 3) Optional Playwright: "Lumi 更现代一点" → refinement presentation
 */
import { createRequire } from "module";
import fs from "fs";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

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

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function startServer() {
  const server = http.createServer(function (req, res) {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const safePath = urlPath === "/" ? "/namora.html" : urlPath;
    const filePath = path.join(ROOT, safePath.replace(/^\//, ""));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    fs.readFile(filePath, function (err, data) {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(data);
    });
  });
  return new Promise(function (resolve, reject) {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", function () {
      resolve(server);
    });
  });
}

function runNodeChecks() {
  console.log("--- Node discovery loop ---\n");
  const {
    createDiscoveryRuntime,
    EVENT_TYPES
  } = require(path.join(ROOT, "discovery-runtime.js"));
  const { createDiscoveryCoordinator } = require(
    path.join(ROOT, "discovery-coordinator.js")
  );
  const { buildDiscoveryContext } = require(
    path.join(ROOT, "discovery-provider-adapter.js")
  );

  const runtime = createDiscoveryRuntime();
  runtime.processEvent({
    type: EVENT_TYPES.NameSelected,
    payload: {
      candidateId: "name-lumi",
      name: "Lumi",
      origin: "inside-constraint",
      sourceDirectionId: "modern"
    }
  });
  const prefResult = runtime.processEvent({
    type: EVENT_TYPES.UserPreferenceAdded,
    payload: { preferenceType: "style", value: "more-modern" }
  });
  assert(prefResult.ok === true, "1: preference event accepted");
  assert(
    prefResult.state.phase === "name-refinement",
    "1: phase becomes name-refinement"
  );
  assert(
    prefResult.action &&
      prefResult.action.type === "refine" &&
      prefResult.action.reason === "preference-guided-refine",
    "1: DiscoveryState drives preference-guided refine"
  );

  const context = buildDiscoveryContext(prefResult.state, prefResult.action);
  assert(context.action === "refine", "3: context.action is refine");
  assert(context.anchor && context.anchor.name === "Lumi", "3: context.anchor");
  assert(
    context.userPreference && context.userPreference.value === "more-modern",
    "3: context.userPreference"
  );
  assert(Array.isArray(context.allowedDirections), "3: allowedDirections");
  assert(Array.isArray(context.excludedDirections), "3: excludedDirections");

  const coordinator = createDiscoveryCoordinator();
  const pipeline = coordinator.handleEvent({
    type: "name-selected",
    payload: {
      candidateId: "name-lumi",
      name: "Lumi",
      origin: "inside-constraint",
      sourceDirectionId: "modern"
    }
  });
  // Without handlers registered, refine may be unhandled — register deferred ones.
  const modules = coordinator.getModules();
  modules.actionExecutor.registerHandler("refine", function (action) {
    return {
      handled: true,
      deferredToProvider: true,
      type: action.type,
      reason: action.reason
    };
  });
  const refineAgain = coordinator.handleEvent({
    type: "user-preference-added",
    payload: { preferenceType: "style", value: "more-modern" }
  });
  assert(
    refineAgain.success === true &&
      refineAgain.action &&
      refineAgain.action.type === "refine",
    "pipeline: coordinator refine succeeds with deferred handler"
  );
  assert(!!pipeline, "pipeline: coordinator available");
}

function runSourceChecks() {
  console.log("\n--- Source checks ---\n");
  const namoraSource = fs.readFileSync(path.join(ROOT, "namora.js"), "utf8");
  const htmlSource = fs.readFileSync(path.join(ROOT, "namora.html"), "utf8");

  assert(
    namoraSource.indexOf("collectDiscoveryExternalEventsFromSubmit") !== -1,
    "2: Conversation fact collector present"
  );
  assert(
    namoraSource.indexOf("runDiscoverySubmitPipeline") !== -1,
    "2: Discovery submit pipeline present"
  );
  assert(
    namoraSource.indexOf("discoveryContext") !== -1,
    "3: Provider metadata carries discoveryContext"
  );
  assert(
    namoraSource.indexOf("buildRefineCandidateSet") !== -1,
    "3: Local provider refine path present"
  );
  assert(
    namoraSource.indexOf("preference-guided-refine") === -1 &&
      fs
        .readFileSync(path.join(ROOT, "discovery-runtime.js"), "utf8")
        .indexOf("preference-guided-refine") !== -1,
    "2: refine reason owned by Discovery Runtime (not Conversation)"
  );
  assert(
    htmlSource.indexOf("discovery-provider-adapter.js") !== -1,
    "boot: provider adapter script loaded"
  );
  // Presentation remains a renderer — no DiscoveryState mutation helpers there.
  assert(
    !/function createInteractivePresentationRuntime[\s\S]*?processEvent\(/.test(
      namoraSource
    ),
    "4: Presentation does not process Discovery events"
  );
}

async function runBrowserChecks() {
  console.log("\n--- Browser experience checks ---\n");
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    console.log("SKIP: playwright module unavailable");
    return;
  }

  let server;
  try {
    server = await startServer();
  } catch (err) {
    console.log(
      "SKIP: local static server unavailable (" +
        (err && err.message ? err.message : "listen failed") +
        ")"
    );
    return;
  }
  const port = server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.log(
      "SKIP: Playwright browser binary unavailable (" +
        (err && err.message ? err.message.split("\n")[0] : "launch failed") +
        ")"
    );
    server.close();
    return;
  }

  const page = await browser.newPage();
  try {
    await page.goto(
      `http://127.0.0.1:${port}/namora.html?layout=desktop&provider=local&debug=1`,
      { waitUntil: "networkidle" }
    );
    await page.waitForFunction(function () {
      return !!(
        window.SceneRuntime &&
        window.SceneRuntime.isReady &&
        window.SceneRuntime.isReady() &&
        window.DiscoveryCoordinator &&
        window.DiscoveryCoordinator.get()
      );
    });

    await page.evaluate(function () {
      window.ResponseProviderRegistry.setActiveProvider("local");
    });

    await page.evaluate(async function () {
      await window.SceneRuntime.getConversationRuntime().submitUserText(
        "Lumi 更现代一点"
      );
    });
    await page.waitForTimeout(1200);

    const snapshot = await page.evaluate(function () {
      const state = window.DiscoveryCoordinator.getState();
      const presentation = window.InteractivePresentationRuntime.getState
        ? window.InteractivePresentationRuntime.getState()
        : null;
      const dialogueEl = document.querySelector(
        "#namoraSpeechBubble .namora-speech-bubble-text, .namora-speech-bubble-text, [data-namora-dialogue]"
      );
      const speech =
        window.SpeechBubbleRuntime && window.SpeechBubbleRuntime.get
          ? window.SpeechBubbleRuntime.get()
          : null;
      const dialogue =
        speech && typeof speech.getDialogue === "function"
          ? speech.getDialogue()
          : dialogueEl
            ? dialogueEl.textContent
            : null;
      const messages = window.ConversationRuntime.get().getMessages();
      const lastAssistant = messages
        .slice()
        .reverse()
        .find(function (m) {
          return m.role === "assistant";
        });
      const current =
        presentation && presentation.currentPresentation
          ? presentation.currentPresentation
          : null;
      const names =
        current &&
        current.type === "name-candidate" &&
        current.payload &&
        Array.isArray(current.payload.candidates)
          ? current.payload.candidates.map(function (c) {
              return c.name;
            })
          : [];
      return {
        phase: state && state.phase,
        anchor: state && state.anchors && state.anchors.length
          ? state.anchors[state.anchors.length - 1].name
          : null,
        preference:
          state && state.preferences && state.preferences.length
            ? state.preferences[state.preferences.length - 1].value
            : null,
        presentationType: current && current.type,
        candidateNames: names,
        assistantContent: lastAssistant ? lastAssistant.content : null,
        dialogue: dialogue
      };
    });

    assert(snapshot.anchor === "Lumi", "5: Discovery anchor is Lumi");
    assert(
      snapshot.preference === "more-modern",
      "5: Discovery preference recorded"
    );
    assert(
      snapshot.phase === "name-refinement",
      "5: Discovery phase is name-refinement"
    );
    assert(
      snapshot.presentationType === "name-candidate",
      "5: Presentation shows name candidates"
    );
    assert(
      snapshot.candidateNames.indexOf("Lumi") === -1 &&
        snapshot.candidateNames.length >= 3,
      "5: refinement set differs from fresh Lumi prototype"
    );
    assert(
      snapshot.assistantContent &&
        snapshot.assistantContent.indexOf("Lumi") !== -1 &&
        snapshot.assistantContent.indexOf("现代") !== -1,
      "5: dialogue acknowledges refinement around Lumi"
    );
  } finally {
    await browser.close();
    server.close();
  }
}

async function run() {
  console.log("=== TASK046 Phase 1 Discovery First Loop Verification ===\n");
  runNodeChecks();
  runSourceChecks();
  await runBrowserChecks();

  console.log("\n=== Summary ===");
  console.log("Passed:", passed);
  console.log("Failed:", failed);
  if (failed > 0) process.exitCode = 1;
}

run().catch(function (err) {
  console.error(err);
  process.exitCode = 1;
});
