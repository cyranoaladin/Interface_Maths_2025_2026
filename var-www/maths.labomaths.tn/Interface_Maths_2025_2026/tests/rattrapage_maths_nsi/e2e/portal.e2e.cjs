"use strict";

const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const TARGET_URL = process.env.TARGET_URL || "http://127.0.0.1:8877/";

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
  let browser;
  try {
    browser = await chromium.launch(browserLaunchOptions());
    const page = await browser.newPage();
    const externalRequests = [];
    const pageErrors = [];
    const consoleErrors = [];
    const failedResponses = [];

    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith(TARGET_URL) && !isAllowedBrowserUrl(url)) {
        externalRequests.push(url);
      }
    });
    page.on("response", (response) => {
      const url = response.url();
      if (url.startsWith(TARGET_URL) && response.status() >= 400) {
        failedResponses.push(`${response.status()} ${url}`);
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const viewports = [
      { name: "mobile", width: 390, height: 844 },
      { name: "tabletPortrait", width: 768, height: 1024 },
      { name: "tabletLandscape", width: 1024, height: 768 },
      { name: "laptop", width: 1366, height: 768 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(TARGET_URL, { waitUntil: "networkidle" });
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        navToggleVisible: getComputedStyle(document.querySelector(".nav-toggle")).display !== "none"
      }));
      assert.ok(metrics.scrollWidth <= metrics.innerWidth + 1, `aucun overflow horizontal en ${viewport.name}`);
      if (viewport.width < 980) {
        assert.equal(metrics.navToggleVisible, true, `menu compact visible en ${viewport.name}`);
        await page.getByRole("button", { name: "Menu" }).click();
        await expectNavOpen(page);
        await page.getByRole("link", { name: "Guides PDF" }).click();
        await expectNavClosed(page);
      }
    }

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(TARGET_URL, { waitUntil: "networkidle" });

    for (const name of ["Accueil", "Auto-bilan", "Guides PDF", "Sujets Maths", "Sujets NSI", "Simulation orale", "Planning express"]) {
      const link = page.locator("#main-nav").getByRole("link", { name, exact: true });
      const href = await link.getAttribute("href");
      assert.ok(href && href.startsWith("#"), `lien ancré attendu pour ${name}`);
      await link.click();
      await page.waitForFunction((selector) => {
        const section = document.querySelector(selector);
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      }, href);
      assert.equal(await page.locator(href).isVisible(), true, `section visible après clic: ${name}`);
      assert.ok(await page.locator(`${href} h1, ${href} h2`).count() > 0, `titre de section présent: ${name}`);
    }

    await page.getByRole("button", { name: /Lire dans la page/i }).first().click();
    await page.waitForSelector('#pdf-frame[src*="guide_rattrapage_maths.pdf"]');
    assert.match(await page.locator("#pdf-title").textContent(), /Mathématiques/);
    assert.match(await page.locator("#pdf-download").getAttribute("href"), /guide_rattrapage_maths\.pdf$/);
    assert.match(await page.locator("#pdf-open").getAttribute("target"), /_blank/);
    await page.getByRole("button", { name: "Fermer" }).click();
    assert.equal(await page.locator(".pdf-viewer").isHidden(), true, "fermeture lecteur PDF");

    await page.getByRole("button", { name: "Reprendre : Guide oral - EDS Mathématiques" }).click();
    await page.waitForSelector('#pdf-frame[src*="guide_rattrapage_maths.pdf"]');

    await page.locator("#main-nav").getByRole("link", { name: "Sujets Maths", exact: true }).click();
    await page.locator("#maths-subjects").getByRole("button", { name: /Lire dans la page/i }).first().click();
    await page.waitForSelector('#pdf-frame[src*="sujets_blancs_maths_16_exercices.pdf"]');

    await page.locator("#main-nav").getByRole("link", { name: "Sujets NSI", exact: true }).click();
    const expectedFilters = ["Tous", "Priorité 1", "SQL", "Structures", "Arbres", "Graphes", "POO", "Récursivité", "Routage"];
    for (const filter of expectedFilters) {
      await page.getByRole("button", { name: filter }).click();
      const count = await page.locator("#nsi-subjects article").count();
      assert.ok(count > 0, `filtre ${filter} affiche des cartes`);
    }

    await page.getByRole("button", { name: "SQL" }).click();
    await page.locator("#nsi-subjects article").first().getByRole("button", { name: /Lire dans la page/i }).click();
    await page.waitForSelector('#pdf-frame[src*="BDD_sujet1.pdf"]');

    await page.locator("#main-nav").getByRole("link", { name: "Simulation orale", exact: true }).click();
    await page.getByRole("button", { name: /^Démarrer$/ }).first().click();
    await page.waitForFunction(() => /^19:5[89]$/.test(document.querySelector("#prep-timer")?.textContent?.trim() || ""));
    const prepTimer = (await page.locator("#prep-timer").textContent()).trim();
    assert.match(prepTimer, /^19:5[89]$/, "minuteur préparation lancé une seule fois");
    await page.getByRole("button", { name: "Réinitialiser" }).first().click();
    assert.equal((await page.locator("#prep-timer").textContent()).trim(), "20:00", "minuteur préparation réinitialisé");

    const blockedPage = await browser.newPage();
    const blockedErrors = [];
    blockedPage.on("pageerror", (error) => blockedErrors.push(error.message));
    await blockedPage.addInitScript(() => {
      for (const method of ["getItem", "setItem", "removeItem"]) {
        Object.defineProperty(Storage.prototype, method, {
          configurable: true,
          value() { throw new DOMException("storage blocked", "SecurityError"); }
        });
      }
    });
    await blockedPage.goto(TARGET_URL, { waitUntil: "networkidle" });
    await blockedPage.getByRole("button", { name: /Lire dans la page/i }).first().click();
    await blockedPage.waitForSelector('#pdf-frame[src*="guide_rattrapage_maths.pdf"]');
    assert.deepEqual(blockedErrors, [], "portail fonctionnel si localStorage est bloqué");
    await blockedPage.close();

    const allLinks = await page.locator("a[href]").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    for (const href of allLinks) {
      assert.ok(!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("file://"), `lien relatif attendu: ${href}`);
    }

    assert.deepEqual(externalRequests, [], "aucune requête externe");
    assert.deepEqual(pageErrors, [], "aucune erreur page");
    assert.deepEqual(consoleErrors, [], "aucune erreur console");
    assert.deepEqual(failedResponses, [], "aucune ressource interne en erreur");

    console.log("portal.e2e.js: OK");
  } finally {
    if (browser) await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function expectNavOpen(page) {
  assert.equal(await page.locator("#main-nav").evaluate((nav) => nav.classList.contains("is-open")), true, "menu ouvert");
}

async function expectNavClosed(page) {
  assert.equal(await page.locator("#main-nav").evaluate((nav) => nav.classList.contains("is-open")), false, "menu fermé après navigation");
}
