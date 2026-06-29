#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const includeRoots = [
  path.join(root, "site/assets/js"),
  path.join(root, "site/rattrapage_maths_nsi/assets/js")
];
const ignored = new Set(["lucide.min.js"]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

const files = includeRoots
  .flatMap(walk)
  .filter((file) => file.endsWith(".js"))
  .filter((file) => !file.endsWith(".min.js"))
  .filter((file) => !ignored.has(path.basename(file)));

if (files.length === 0) {
  throw new Error("Aucun fichier JavaScript à vérifier.");
}

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
}

console.log(`lint_site_js: ${files.length} fichiers JS vérifiés`);
