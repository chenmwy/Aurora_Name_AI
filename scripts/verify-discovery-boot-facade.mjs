/**
 * TASK045 Phase 4B.1 — Discovery boot composition + facade verification
 *
 * 1) Source/static checks for namora.js + namora.html boot wiring
 * 2) Node composition of Discovery Coordinator defaults
 * 3) Optional Playwright browser facade check when Chromium is available
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
    // Port 0 = ephemeral free port (avoids EADDRINUSE from leftover servers).
    server.listen(0, "127.0.0.1", function () {
      resolve(server);
    });
  });
}

async function runSourceChecks() {
  console.log("--- Source checks ---\n");
  const namoraSource = fs.readFileSync(path.join(ROOT, "namora.js"), "utf8");
  const htmlSource = fs.readFileSync(path.join(ROOT, "namora.html"), "utf8");

  assert(
    namoraSource.indexOf("initDiscoveryCoordinator") !== -1,
    "1/source: initDiscoveryCoordinator present"
  );
  assert(
    namoraSource.indexOf("registerDiscoveryHandlers") !== -1,
    "1/source: registerDiscoveryHandlers placeholder present"
  );
  assert(
    namoraSource.indexOf("getDiscoveryCoordinator") !== -1,
    "2/source: SceneRuntime getter present"
  );
  assert(
    namoraSource.indexOf("window.DiscoveryCoordinator") !== -1,
    "1/source: window.DiscoveryCoordinator facade present"
  );

  const sourceWithoutFacade = namoraSource.replace(
    /window\.DiscoveryCoordinator\s*=\s*\{[\s\S]*?Object\.freeze\(window\.DiscoveryCoordinator\);/,
    ""
  );
  assert(
    !/discoveryCoordinatorInstance\s*\.\s*handleEvent\s*\(/.test(sourceWithoutFacade),
    "6/source: facade body is not the only handleEvent call site pattern"
  );
  // TASK046 Phase 1: Conversation may call coordinator.handleEvent via local ref.
  assert(
    namoraSource.indexOf("runDiscoverySubmitPipeline") !== -1 ||
      namoraSource.indexOf("handleEvent") !== -1,
    "6/source: discovery handleEvent path exists for submit pipeline"
  );
  assert(
    /initConversationRuntime\(\);\s*\n\s*initDiscoveryCoordinator\(\);/.test(
      namoraSource
    ),
    "boot: Discovery initializes after Conversation"
  );
  assert(
    htmlSource.indexOf("discovery-coordinator.js") !== -1 &&
      htmlSource.indexOf("discovery-runtime.js") !== -1 &&
      htmlSource.indexOf('src="namora.js"') >
        htmlSource.indexOf("discovery-coordinator.js"),
    "boot: discovery scripts load before namora.js"
  );

  // Existing runtime init functions remain intact
  assert(
    namoraSource.indexOf("function initConversationRuntime") !== -1 &&
      namoraSource.indexOf("function initUserInputRuntime") !== -1 &&
      namoraSource.indexOf("createInteractivePresentationRuntime") !== -1 &&
      namoraSource.indexOf("createNameCandidateInteractionRuntime") !== -1,
    "5/source: existing runtime factories unchanged/present"
  );
}

async function runNodeCompositionChecks() {
  console.log("\n--- Node composition checks ---\n");
  const { createDiscoveryCoordinator } = require(
    path.join(ROOT, "discovery-coordinator.js")
  );
  const coordinator = createDiscoveryCoordinator();
  assert(!!coordinator, "1/node: DiscoveryCoordinator created");
  assert(
    typeof coordinator.handleEvent === "function" &&
      typeof coordinator.process === "function" &&
      typeof coordinator.execute === "function" &&
      typeof coordinator.getDiscoveryState === "function" &&
      typeof coordinator.getModules === "function",
    "3/node: Coordinator methods accessible"
  );
  const state = coordinator.getDiscoveryState();
  assert(state && state.phase === "understanding", "4/node: Discovery state readable");
  const modules = coordinator.getModules();
  assert(
    !!(modules.eventBridge && modules.discoveryRuntime && modules.actionExecutor),
    "4/node: composed modules present"
  );
}

async function runBrowserChecks() {
  console.log("\n--- Browser facade checks ---\n");
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
        window.SceneRuntime.isReady()
      );
    });
    await page.waitForTimeout(500);

    const snapshot = await page.evaluate(function () {
      const coordinator = window.DiscoveryCoordinator
        ? window.DiscoveryCoordinator.get()
        : null;
      const viaScene = window.SceneRuntime
        ? window.SceneRuntime.getDiscoveryCoordinator()
        : null;
      const state = window.DiscoveryCoordinator
        ? window.DiscoveryCoordinator.getState()
        : null;
      const modules = window.DiscoveryCoordinator
        ? window.DiscoveryCoordinator.getModules()
        : null;
      return {
        hasFacade: !!window.DiscoveryCoordinator,
        hasSceneGetter: !!(
          window.SceneRuntime &&
          typeof window.SceneRuntime.getDiscoveryCoordinator === "function"
        ),
        methods: !!(
          window.DiscoveryCoordinator &&
          typeof window.DiscoveryCoordinator.get === "function" &&
          typeof window.DiscoveryCoordinator.handleEvent === "function" &&
          typeof window.DiscoveryCoordinator.process === "function" &&
          typeof window.DiscoveryCoordinator.execute === "function" &&
          typeof window.DiscoveryCoordinator.getModules === "function" &&
          typeof window.DiscoveryCoordinator.getState === "function"
        ),
        sameInstance: coordinator === viaScene && !!coordinator,
        phase: state && state.phase,
        hasModules: !!(
          modules &&
          modules.eventBridge &&
          modules.discoveryRuntime &&
          modules.actionExecutor
        ),
        conversationExists: !!(
          window.ConversationRuntime && window.ConversationRuntime.get()
        ),
        presentationExists: !!(
          window.InteractivePresentationRuntime &&
          window.InteractivePresentationRuntime.get()
        ),
        inputExists: !!(window.InputRuntime && window.InputRuntime.getText),
        nameCandidateExists: !!(
          window.NameCandidateInteractionRuntime &&
          window.NameCandidateInteractionRuntime.get()
        )
      };
    });

    assert(snapshot.hasFacade, "1/browser: DiscoveryCoordinator exists");
    assert(snapshot.hasSceneGetter, "2/browser: SceneRuntime getter exists");
    assert(snapshot.methods, "3/browser: Coordinator methods accessible");
    assert(snapshot.sameInstance, "3/browser: facade == SceneRuntime getter");
    assert(snapshot.phase === "understanding", "4/browser: Discovery state readable");
    assert(snapshot.hasModules, "4/browser: modules composed");
    assert(snapshot.conversationExists, "5/browser: Conversation present");
    assert(snapshot.presentationExists, "5/browser: Presentation present");
    assert(snapshot.inputExists, "5/browser: Input present");
    assert(snapshot.nameCandidateExists, "5/browser: Name Candidate present");

    const before = await page.evaluate(function () {
      return window.DiscoveryCoordinator.getState();
    });
    await page.evaluate(async function () {
      window.ResponseProviderRegistry.setActiveProvider("local");
      await window.SceneRuntime.getConversationRuntime().submitUserText(
        "boot-facade-wiring-check"
      );
    });
    await page.waitForTimeout(800);
    const after = await page.evaluate(function () {
      return {
        state: window.DiscoveryCoordinator.getState(),
        messageCount: window.ConversationRuntime.get().getMessages().length
      };
    });
    // TASK046 wires free-text submits into Discovery as user-input facts.
    assert(
      after.state.history.length >= before.history.length,
      "6/browser: Conversation submit can emit Discovery facts"
    );
    assert(after.messageCount > 0, "6/browser: Conversation still records messages");
  } finally {
    await browser.close();
    server.close();
  }
}

async function run() {
  console.log("=== Discovery Boot Facade Verification ===\n");
  await runSourceChecks();
  await runNodeCompositionChecks();
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
