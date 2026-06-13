// Generate the repo-root .gitbook.yaml from the converter manifest:
//
//   npx tsx scripts/migrate/gitbook-config.ts
//
// Emits Git Sync config (root/readme/summary) plus a redirect for every legacy
// Starlight URL whose slug changed (underscore/paren/case). Self-redirects
// (old == new, only a trailing-slash difference GitBook canonicalizes) are
// skipped. Output is verified against the live sitemap separately.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MANIFEST = join(ROOT, ".cache/migrate/manifest.json");
const OUT = join(ROOT, ".gitbook.yaml");

type Item = { oldUrl: string; newUrl: string; newPath: string; isHomepage: boolean };
const items: Item[] = JSON.parse(readFileSync(MANIFEST, "utf8"));

const strip = (s: string) => s.replace(/^\/+/, "").replace(/\/+$/, "");

const redirects: [string, string][] = [];
for (const i of items) {
  const from = strip(i.oldUrl); // legacy path, no slashes
  const toUrl = strip(i.newUrl);
  if (!from) continue; // root
  if (from === toUrl) continue; // unchanged slug -> GitBook canonicalizes
  redirects.push([from, i.newPath]);
}
redirects.sort((a, b) => a[0].localeCompare(b[0]));

const lines: string[] = [
  "root: ./content/",
  "",
  "structure:",
  "  readme: README.md",
  "  summary: SUMMARY.md",
  "",
  "redirects:",
  ...redirects.map(([from, to]) => `  ${from}: ${to}`),
  "",
];

writeFileSync(OUT, lines.join("\n"));
console.log(`.gitbook.yaml written with ${redirects.length} redirects`);
