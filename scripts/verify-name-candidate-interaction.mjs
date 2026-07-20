import { chromium } from "playwright";

const BASE =
  "http://localhost:3456/namora.html?layout=desktop&provider=local&debug=1";

async function bootNameCandidates(page) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    window.ResponseProviderRegistry.setActiveProvider("local");
    window.LocalResponseProvider.simulateNameCandidatesOnce();
    await window.SceneRuntime.getConversationRuntime().submitUserText("测试名字候选");
  });
  await page.waitForTimeout(900);
}

async function readState(page) {
  return page.evaluate(() => {
    const presentation = window.InteractivePresentationRuntime.getState();
    const nameState = window.NameCandidateInteractionRuntime.getState();
    const inputText = window.InputRuntime.getText();
    const draft = window.InputRuntime.getNameAnchorDraft();
    const constraints = window.NameCandidateInteractionRuntime.getConstraintState();
    const group = document.getElementById("namoraPresentationGroup");
    const groupRect = group ? group.getBoundingClientRect() : null;
    const outsideCard = document.querySelector(
      '.namora-name-candidate-card--outside[data-name-candidate-id="name-miu"]'
    );
    const tooltip = document.getElementById("namoraNameCandidateTooltip");
    return {
      presentationType: presentation?.currentPresentation?.type || null,
      presentationVisible: !!presentation?.currentPresentation,
      candidateCount: nameState?.candidates?.length || 0,
      selectedCandidateId: nameState?.nameSelectionState?.selectedCandidateId,
      draftAnchor: nameState?.nameSelectionState?.draftAnchor,
      inputText,
      inputDraft: draft,
      activeDirections: (constraints?.activeDirections || []).map((d) => d.id),
      excludedDirections: (constraints?.excludedDirections || []).map((d) => d.id),
      outsideBadgeText: outsideCard
        ? outsideCard.querySelector(".namora-name-candidate-card__badge")?.textContent
        : null,
      outsideSourceText: outsideCard
        ? outsideCard.querySelector(".namora-name-candidate-card__source")?.textContent
        : null,
      presentationTop: groupRect ? Math.round(groupRect.top) : null,
      presentationTransform: group ? group.style.transform : "",
      tooltipHidden: tooltip ? tooltip.hidden : true,
      messageCount: window.ConversationRuntime.get().getMessages().length
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const results = {};
const errors = [];

await bootNameCandidates(page);
results.A_render = await readState(page);
const baselineMessageCount = results.A_render.messageCount;

const lumi = page.locator('[data-name-candidate-id="name-lumi"]');
await lumi.hover();
await page.waitForTimeout(150);
results.A_tooltip = await page.evaluate(() => {
  const tip = document.getElementById("namoraNameCandidateTooltip");
  return {
    hidden: tip ? tip.hidden : true,
    text: tip ? tip.textContent : ""
  };
});

await lumi.click();
await page.waitForTimeout(200);
results.B_clickLumi = await readState(page);

const luma = page.locator('[data-name-candidate-id="name-luma"]');
await luma.click();
await page.waitForTimeout(200);
results.C_clickLuma = await readState(page);

const miu = page.locator('[data-name-candidate-id="name-miu"]');
await miu.hover();
await page.waitForTimeout(150);
results.D_outsideTooltip = await page.evaluate(() => {
  const tip = document.getElementById("namoraNameCandidateTooltip");
  return {
    hidden: tip ? tip.hidden : true,
    text: tip ? tip.textContent : ""
  };
});

await miu.click();
await page.waitForTimeout(200);
results.E_clickMiu = await readState(page);

await page.locator('[data-name-candidate-id="name-luno"]').focus();
await page.waitForTimeout(150);
results.F_focus = await page.evaluate(() => {
  const tip = document.getElementById("namoraNameCandidateTooltip");
  return { hidden: tip ? tip.hidden : true, text: tip ? tip.textContent : "" };
});
await page.keyboard.press("Enter");
await page.waitForTimeout(200);
results.F_keyboardSelect = await readState(page);

function assert(name, ok, detail) {
  if (!ok) errors.push({ name, detail });
}

assert("A normal candidates", results.A_render.candidateCount >= 3, results.A_render);
assert(
  "A presentation visible",
  results.A_render.presentationType === "name-candidate",
  results.A_render
);
assert(
  "A tooltip normal",
  !results.A_tooltip.hidden && results.A_tooltip.text.includes("选择这个名字"),
  results.A_tooltip
);
assert(
  "B lumi selected",
  results.B_clickLumi.selectedCandidateId === "name-lumi" &&
    results.B_clickLumi.inputText === "Lumi",
  results.B_clickLumi
);
assert(
  "B no auto submit",
  results.B_clickLumi.messageCount === baselineMessageCount,
  results.B_clickLumi
);
assert(
  "C luma replaces lumi",
  results.C_clickLuma.selectedCandidateId === "name-luma" &&
    results.C_clickLuma.inputText === "Luma",
  results.C_clickLuma
);
assert(
  "D outside badge",
  results.A_render.outsideBadgeText === "约束外探索",
  results.A_render
);
assert(
  "D outside source",
  (results.A_render.outsideSourceText || "").includes("简约"),
  results.A_render
);
assert(
  "D outside tooltip",
  !results.D_outsideTooltip.hidden &&
    results.D_outsideTooltip.text.includes("约束外探索"),
  results.D_outsideTooltip
);
assert(
  "E miu outside origin",
  results.E_clickMiu.draftAnchor?.origin === "outside-constraint" &&
    results.E_clickMiu.draftAnchor?.sourceDirectionId === "minimal",
  results.E_clickMiu
);
assert(
  "E minimal stays excluded",
  results.E_clickMiu.excludedDirections.includes("minimal"),
  results.E_clickMiu
);
assert(
  "E no auto submit after miu",
  results.E_clickMiu.messageCount === baselineMessageCount,
  results.E_clickMiu
);
assert(
  "F keyboard select",
  results.F_keyboardSelect.selectedCandidateId === "name-luno",
  results.F_keyboardSelect
);
assert(
  "G presentation offset runtime-owned",
  results.E_clickMiu.presentationTransform === "translateY(-64px)",
  results.E_clickMiu
);

await browser.close();

const pass = errors.length === 0;
console.log(JSON.stringify({ pass, errors, results }, null, 2));
process.exit(pass ? 0 : 1);
