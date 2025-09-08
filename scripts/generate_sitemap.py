#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path
from xml.sax.saxutils import escape

# Generate a simple sitemap.xml from files under site/
REPO_ROOT = Path(__file__).resolve().parents[1]
SITE = REPO_ROOT / "site"
OUT = SITE / "sitemap.xml"

EXCLUDE_DIRS = {"assets"}
EXCLUDE_FILES = {"404.html", "sw.js", "manifest.webmanifest", "robots.txt", "sitemap.xml"}

urls: list[str] = ["/"]

for p in SITE.rglob("*.html"):
    rel = p.relative_to(SITE).as_posix()
    parts = rel.split("/")
    if parts[0] in EXCLUDE_DIRS:  # skip assets
        continue
    if parts[-1] in EXCLUDE_FILES:
        continue
    urls.append("/" + rel)

xml = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
]
for u in sorted(set(urls)):
    xml.append(f"  <url><loc>{escape(u)}</loc></url>")
xml.append("</urlset>")

OUT.write_text("\n".join(xml), encoding="utf-8")
print(f"Wrote {OUT}")

