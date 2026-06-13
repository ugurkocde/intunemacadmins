// Acceptance checks for the converted GitBook content tree:
//
//   npx tsx scripts/migrate/verify.ts
//
// Deterministic, offline. Exits non-zero if any check fails. Covers the
// migration acceptance criteria that don't require a running GitBook site.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === ".gitbook") continue;
      out.push(...walk(p));
    } else if (name.endsWith(".md")) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(CONTENT);
const fails: string[] = [];
const ARTIFACTS = [
  /<Aside[\s>]/,
  /<\/Aside>/,
  /<Steps[\s>]/,
  /<Card[\s>]/,
  /<LinkCard[\s>]/,
  /<CardGrid[\s>]/,
  /<YouTube[\s>]/,
  /^import\s/m,
  /^:::/m,
  /\/src\/assets\//,
  /^sidebar:/m,
  /^title:/m,
  /template:\s*splash/,
];

let assetRefs = 0;
let mdLinks = 0;

for (const f of files) {
  const rel = f.slice(ROOT.length + 1);
  const body = readFileSync(f, "utf8");

  for (const re of ARTIFACTS) {
    if (re.test(body)) fails.push(`${rel}: leftover artifact ${re}`);
  }
  // H1 present.
  if (!/^#\s+\S/m.test(body)) fails.push(`${rel}: missing H1`);
  // Balanced hint tags + blank-line spacing.
  const hints = (body.match(/\{%\s*hint\b/g) ?? []).length;
  const endhints = (body.match(/\{%\s*endhint\s*%\}/g) ?? []).length;
  if (hints !== endhints) fails.push(`${rel}: ${hints} hint / ${endhints} endhint (unbalanced)`);
  if (/\{% endhint %\}\n[^\n]/.test(body)) fails.push(`${rel}: {% endhint %} not followed by blank line`);

  // Asset references resolve on disk.
  const assets = [
    ...[...body.matchAll(/\]\(([^)]*\.gitbook\/assets\/[^)\s]+)\)/g)].map((m) => m[1]),
    ...[...body.matchAll(/src="([^"]*\.gitbook\/assets\/[^"]+)"/g)].map((m) => m[1]),
  ];
  for (const a of assets) {
    assetRefs++;
    if (!existsSync(resolve(dirname(f), a.split(/[?#]/)[0]))) fails.push(`${rel}: broken asset ${a}`);
  }
  // Internal .md links resolve on disk.
  const links = [...body.matchAll(/\]\((\.\.?\/[^)\s]+\.md)\)/g)].map((m) => m[1]);
  for (const l of links) {
    mdLinks++;
    if (!existsSync(resolve(dirname(f), l))) fails.push(`${rel}: broken internal link ${l}`);
  }
}

// SUMMARY.md references every non-homepage page exactly once.
const summary = readFileSync(join(CONTENT, "SUMMARY.md"), "utf8");
const referenced = new Set([...summary.matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => m[1]));
for (const f of files) {
  const rel = f.slice(CONTENT.length + 1);
  if (rel === "README.md" || rel === "SUMMARY.md") continue;
  if (!referenced.has(rel)) fails.push(`SUMMARY.md: missing ${rel}`);
}

console.log(`pages: ${files.length} | asset refs: ${assetRefs} | internal links: ${mdLinks}`);
console.log(`SUMMARY references: ${referenced.size}`);
if (fails.length) {
  console.log(`\nFAIL (${fails.length}):`);
  for (const x of fails) console.log(`  - ${x}`);
  process.exit(1);
}
console.log("\nALL CHECKS PASSED");
