#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "../../..");
const site = path.join(root, "site/rattrapage_maths_nsi");
const publicExt = new Set([".html", ".css", ".js", ".svg"]);
let assertions = 0;

function ok(condition, message) {
  assertions += 1;
  assert.ok(condition, message);
}

function equal(actual, expected, message) {
  assertions += 1;
  assert.equal(actual, expected, message);
}

function match(value, regex, message) {
  assertions += 1;
  assert.match(value, regex, message);
}

function notMatch(value, regex, message) {
  assertions += 1;
  assert.doesNotMatch(value, regex, message);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

execFileSync("node", ["--check", path.join(site, "assets/js/resources.js")], { stdio: "pipe" });
execFileSync("node", ["--check", path.join(site, "assets/js/app.js")], { stdio: "pipe" });

globalThis.window = globalThis;
require(path.join(site, "assets/js/resources.js"));
const data = globalThis.RATTRAPAGE_RESOURCES;
const allResources = [...data.guides, ...data.mathsSubjects, ...data.nsiSubjects];

equal(data.guides.length, 2, "deux guides PDF sont référencés");
equal(data.mathsSubjects.length, 1, "un livret Maths est référencé");
equal(data.nsiSubjects.length, 25, "25 sujets NSI sont référencés");
equal(new Set(allResources.map((item) => item.id)).size, allResources.length, "les identifiants de ressources sont uniques");
equal(new Set(data.nsiSubjects.map((item) => item.path)).size, data.nsiSubjects.length, "les chemins NSI sont uniques");

for (const resource of allResources) {
  ok(!/^(https?:)?\/\//.test(resource.path), `chemin relatif attendu: ${resource.path}`);
  ok(!resource.path.includes(".."), `pas de remontée de chemin: ${resource.path}`);
  const absolute = path.join(site, resource.path);
  ok(fs.existsSync(absolute), `fichier référencé présent: ${resource.path}`);
  ok(fs.statSync(absolute).size > 1000, `fichier non vide: ${resource.path}`);
}

const themes = new Set(data.nsiSubjects.map((item) => item.theme));
[
  "Bases de données",
  "Structures linéaires",
  "Arbres",
  "Graphes",
  "Programmation objet",
  "Programmation / récursivité",
  "Protocoles de routage"
].forEach((theme) => ok(themes.has(theme), `thème NSI présent: ${theme}`));

["Tous", "Priorité 1", "SQL", "Structures", "Arbres", "Graphes", "POO", "Récursivité", "Routage"]
  .forEach((filter) => ok(data.filters.includes(filter), `filtre présent: ${filter}`));

const index = read("site/rattrapage_maths_nsi/index.html");
const auto = read("site/rattrapage_maths_nsi/auto-bilan/index.html");
const css = read("site/rattrapage_maths_nsi/assets/css/style.css");
const app = read("site/rattrapage_maths_nsi/assets/js/app.js");
const resources = read("site/rattrapage_maths_nsi/assets/js/resources.js");
const publicText = walk(site)
  .filter((file) => publicExt.has(path.extname(file)))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const publicTextNoSvg = walk(site)
  .filter((file) => [".html", ".css", ".js"].includes(path.extname(file)))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

match(index, /noindex,nofollow,noarchive/, "meta robots présent");
notMatch(publicTextNoSvg, /https?:\/\/|file:\/\/|\/mnt\/data|C:\\/i, "aucun lien externe ou local absolu dans HTML/CSS/JS");
notMatch(publicText, /\son[a-z]+\s*=/i, "aucun handler inline");
notMatch(publicText, /analytics|gtag|googletagmanager|cdn/i, "aucun tracker ou CDN");
const sensitivePattern = new RegExp([
  String.fromCharCode(77, 65, 65, 84, 79, 85, 71),
  String.fromCharCode(115, 97, 110, 116, 233),
  String.fromCharCode(109, 97, 108, 97, 100, 105, 101),
  String.fromCharCode(102, 114, 97, 103, 105, 108, 105, 116, 233),
  String.fromCharCode(102, 114, 97, 103, 105, 108, 105, 116, 101)
].join("|"), "i");
notMatch(publicText, sensitivePattern, "aucune donnée sensible ciblée");
notMatch(publicText, /objectif\s+[0-9]/i, "aucun objectif chiffré public");

[
  "#accueil",
  "#auto-bilan",
  "#guides",
  "#sujets-maths",
  "#sujets-nsi",
  "#simulation",
  "#planning"
].forEach((anchor) => ok(index.includes(`href="${anchor}"`) && index.includes(`id="${anchor.slice(1)}"`), `ancre de navigation valide: ${anchor}`));

[
  "pdf-title",
  "pdf-download",
  "pdf-open",
  "pdf-close",
  "pdf-frame",
  "resume-last",
  "prep-timer",
  "talk-timer"
].forEach((id) => ok(index.includes(`id="${id}"`), `composant UI présent: ${id}`));

match(css, /@media\s*\(max-width:\s*980px\)/, "CSS responsive tablette/mobile présent");
match(css, /@media\s+print/, "CSS impression présent");
match(css, /min-height:\s*44px/, "cibles tactiles 44 px présentes");
match(app, /localStorage\.setItem/, "mémorisation du dernier PDF présente");
match(app, /addEventListener/, "événements non inline présents");
match(resources, /RATTRAPAGE_RESOURCES/, "données de ressources présentes");

match(auto, /safa_auto_bilan_v1/, "clé localStorage de l’auto-bilan conservée");
match(auto, /class="math-style"|class='math-style'/, "style mathématique hors ligne présent");
match(auto, /<pre><code|<code/, "blocs de code présents");
match(auto, /Copier/, "boutons de copie présents");
match(auto, /P\(X\s*=\s*k\)|binom|\\binom|C\(n,k\)/i, "formule binomiale présente");
match(auto, /u\s*>\s*0|ln\(u\)/i, "condition de domaine logarithme présente");
match(auto, /def\s+\w+\(|return\s+/i, "programme Python présent");
match(auto, /renderScoreBlock/, "rendu des scores présent");
match(auto, /buildSummary/, "résumé final présent");
notMatch(auto, /renderSummary\(/, "aucun appel à renderSummary inexistant");
notMatch(auto, /onclick=|onchange=/i, "auto-bilan sans gestionnaires inline");

const pdfCount = walk(path.join(site, "docs")).filter((file) => file.endsWith(".pdf")).length;
equal(pdfCount, 28, "28 PDF livrés : 2 guides, 1 Maths, 25 NSI");

console.log(`static.test.js: ${assertions} assertions OK`);
