import { chromium } from "playwright";

const BASE = "http://localhost:3456/namora.html?layout=desktop&provider=local&debug=1";

async function measure(page) {
  return page.evaluate(() => {
    const group = document.getElementById("namoraPresentationGroup");
    const rect = group ? group.getBoundingClientRect() : null;
    const style = group ? getComputedStyle(group) : null;
    return {
      policy: document.body.className,
      rect: rect
        ? {
            top: Math.round(rect.top * 10) / 10,
            left: Math.round(rect.left * 10) / 10,
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10
          }
        : null,
      computedTransform: style ? style.transform : null,
      inlineTransform: group ? group.style.transform : null,
      cssVar: getComputedStyle(document.documentElement)
        .getPropertyValue("--namora-desktop-presentation-offset-y")
        .trim()
    };
  });
}

async function showCards(page) {
  await page.evaluate(async () => {
    window.ResponseProviderRegistry.setActiveProvider("local");
    window.LocalResponseProvider.simulateChoicePresentationOnce();
    await window.SceneRuntime.getConversationRuntime().submitUserText("测试");
  });
  await page.waitForTimeout(900);
}

const browser = await chromium.launch({ headless: true });

async function desktopCase() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await showCards(page);

  const runtimeApplied = await measure(page);

  const zeroTop = await page.evaluate(() => {
    const group = document.getElementById("namoraPresentationGroup");
    group.style.transform = "";
    return Math.round(group.getBoundingClientRect().top * 10) / 10;
  });

  const offsetTop = await page.evaluate(() => {
    const group = document.getElementById("namoraPresentationGroup");
    group.style.transform = "translateY(-64px)";
    return Math.round(group.getBoundingClientRect().top * 10) / 10;
  });

  // Re-apply through resolver ownership path.
  await page.evaluate(() => {
    window.ResponsiveLayoutResolver.resolveAndApply();
  });
  const reapplied = await measure(page);

  await page.close();
  return {
    runtimeApplied,
    zeroTop,
    offsetTop,
    delta: Math.round((zeroTop - offsetTop) * 10) / 10,
    reapplied
  };
}

async function mobileCase() {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  await page.goto(
    "http://localhost:3456/namora.html?layout=mobile&provider=local",
    { waitUntil: "networkidle" }
  );
  await page.waitForTimeout(2500);
  await showCards(page);
  const mobile = await measure(page);
  await page.close();
  return mobile;
}

const desktop = await desktopCase();
const mobile = await mobileCase();
await browser.close();

const pass =
  desktop.runtimeApplied.inlineTransform === "translateY(-64px)" &&
  desktop.reapplied.inlineTransform === "translateY(-64px)" &&
  desktop.delta === 64 &&
  desktop.runtimeApplied.rect.top === desktop.offsetTop &&
  desktop.zeroTop - desktop.runtimeApplied.rect.top === 64 &&
  (mobile.inlineTransform === "" || mobile.computedTransform === "none");

console.log(JSON.stringify({ desktop, mobile, pass }, null, 2));
