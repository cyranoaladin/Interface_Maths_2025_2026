"use strict";

const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const TARGET_URL = (process.env.TARGET_URL || "http://127.0.0.1:8877/") + "auto-bilan/";

function browserLaunchOptions() {
  const options = { headless: true };
  if (process.env.PLAYWRIGHT_CHROME_CHANNEL) {
    options.channel = process.env.PLAYWRIGHT_CHROME_CHANNEL;
  }
  return options;
}

function isAllowedBrowserUrl(url) {
  return url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("chrome:") || url.startsWith("chrome-extension:");
}

(async () => {
  const browser = await chromium.launch(browserLaunchOptions());
  const page = await browser.newPage();
  const externalRequests = [];
  const pageErrors = [];
  const consoleErrors = [];
  const failedResponses = [];

  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith(TARGET_URL.replace(/auto-bilan\/$/, "")) && !isAllowedBrowserUrl(url)) {
      externalRequests.push(url);
    }
  });
  page.on("response", (response) => {
    const url = response.url();
    if (url.startsWith(TARGET_URL) && response.status() >= 400) failedResponses.push(`${response.status()} ${url}`);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "tabletPortrait", width: 768, height: 1024 },
    { name: "tabletLandscape", width: 1024, height: 768 },
    { name: "laptop", width: 1366, height: 768 }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    assert.ok(metrics.scrollWidth <= metrics.innerWidth + 1, `aucun overflow horizontal auto-bilan ${viewport.name}`);
  }

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
  assert.match(await page.title(), /Auto-bilan/);

  const pageState = await page.evaluate(() => ({
    hasStorageKey: document.documentElement.innerHTML.includes("safa_auto_bilan_v1"),
    mathStyles: document.querySelectorAll(".math-style").length,
    mathStyleText: Array.from(document.querySelectorAll(".math-style")).map((node) => node.textContent || "").join(" | "),
    codeBlocks: document.querySelectorAll("pre code, code").length,
    codeText: Array.from(document.querySelectorAll("pre code, code")).map((node) => node.textContent || "").join("\n"),
    copyButtons: Array.from(document.querySelectorAll("button")).filter((button) => /Copier/i.test(button.textContent || "")).length,
    hasBinomialFormula: /P\(X\s*=\s*k\)|C\(n,k\)|binom/i.test(Array.from(document.querySelectorAll(".math-style")).map((node) => node.textContent || "").join(" | ")),
    hasDomainRule: /ln\(u\)|u\s*>\s*0/i.test(Array.from(document.querySelectorAll(".math-style")).map((node) => node.textContent || "").join(" | ")),
    hasPython: /def\s+\w+\(|return\s+/i.test(Array.from(document.querySelectorAll("pre code, code")).map((node) => node.textContent || "").join("\n")),
    hasBuildSummary: document.documentElement.innerHTML.includes("buildSummary"),
    hasRenderScoreBlock: document.documentElement.innerHTML.includes("renderScoreBlock"),
    hasNoRenderSummaryCall: !/renderSummary\(/.test(document.documentElement.innerHTML),
    hasNoInlineHandlers: !/\son[a-z]+\s*=/.test(document.documentElement.innerHTML)
  }));
  assert.equal(pageState.hasStorageKey, true, "clé localStorage conservée");
  assert.ok(pageState.mathStyles >= 1, "formules en style mathématique présentes");
  assert.ok(pageState.codeBlocks >= 1, "blocs de code présents");
  assert.ok(pageState.copyButtons >= 1, "boutons Copier présents");
  assert.equal(pageState.hasBinomialFormula, true, "formule binomiale présente");
  assert.equal(pageState.hasDomainRule, true, "règle de domaine logarithme présente");
  assert.equal(pageState.hasPython, true, "programme Python présent");
  assert.equal(pageState.hasBuildSummary, true, "buildSummary présent");
  assert.equal(pageState.hasRenderScoreBlock, true, "renderScoreBlock présent");
  assert.equal(pageState.hasNoRenderSummaryCall, true, "aucun renderSummary inexistant appelé");
  assert.equal(pageState.hasNoInlineHandlers, true, "aucun handler inline");

  await clickTab(page, /Diagnostic Maths/i);
  await answerAllVisibleRadios(page);
  await clickIfExists(page, /Corriger le quiz Maths/i);

  await clickTab(page, /Diagnostic NSI/i);
  await answerAllVisibleRadios(page);
  await clickIfExists(page, /Corriger le quiz NSI/i);

  await clickTab(page, /Oral blanc/i);
  await clickIfExists(page, /Démarrer/i);
  await page.waitForTimeout(1100);
  const timerText = await page.evaluate(() => document.body.innerText.match(/\b\d{1,2}:\d{2}\b/)?.[0] || "");
  assert.match(timerText, /\d{1,2}:\d{2}/, "minuteur visible");

  await clickTab(page, /Bilan final/i);
  const summaryLength = await page.evaluate(() => {
    const textarea = document.querySelector("textarea");
    return textarea ? textarea.value.length : 0;
  });
  assert.ok(summaryLength > 200, "résumé final généré");

  await clickIfExists(page, /Copier/i);
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  assert.ok(pdf.length > 1000, "impression PDF générée");

  const storage = await page.evaluate(() => localStorage.getItem("safa_auto_bilan_v1"));
  assert.ok(storage && storage.length > 10, "progression sauvegardée dans localStorage");

  assert.deepEqual(externalRequests, [], "aucune requête externe");
  assert.deepEqual(pageErrors, [], "aucune erreur page");
  assert.deepEqual(consoleErrors, [], "aucune erreur console");
  assert.deepEqual(failedResponses, [], "aucune ressource interne en erreur");

  await browser.close();
  console.log("auto-bilan.e2e.js: OK");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function clickTab(page, name) {
  const tab = page.getByRole("tab", { name });
  if (await tab.count()) {
    await tab.first().click();
    return;
  }
  const link = page.getByRole("button", { name });
  if (await link.count()) await link.first().click();
}

async function clickIfExists(page, name) {
  const button = page.getByRole("button", { name });
  if (await button.count()) await button.first().click();
}

async function answerAllVisibleRadios(page) {
  await page.evaluate(() => {
    const seen = new Set();
    Array.from(document.querySelectorAll('input[type="radio"]'))
      .filter((input) => input.offsetParent !== null)
      .forEach((input) => {
        if (!seen.has(input.name)) {
          input.checked = true;
          input.dispatchEvent(new Event("change", { bubbles: true }));
          seen.add(input.name);
        }
      });
  });
}
