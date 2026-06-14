// Rewrite stale absolute apex/www links in content/ to relative .md links.
//
//   npx tsx scripts/migrate/fix-stale-links.ts
//
// The converter missed `https://www.intunemacadmins.com/...` links (it only
// stripped the bare-apex prefix), leaving a few internal links pointing at the
// old URLs (which now bounce docs->www->docs via redirects). This maps each back
// to the right content file using the migration manifest and writes a relative
// .md link, so GitBook resolves them directly on the docs subdomain.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");
const MANIFEST = join(ROOT, ".cache/migrate/manifest.json");

type Item = { oldUrl: string; newPath: string };
const items: Item[] = JSON.parse(readFileSync(MANIFEST, "utf8"));
const norm = (s: string) => s.replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();
const byOld = new Map(items.map((i) => [norm(i.oldUrl), i.newPath]));

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === ".gitbook") continue;
      out.push(...walk(p));
    } else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

const LINK = /\]\(\s*https?:\/\/(?:www\.)?intunemacadmins\.com(\/[^)\s]*)\s*\)/g;
let changed = 0;
const unresolved: string[] = [];

for (const file of walk(CONTENT)) {
  const relFile = file.slice(ROOT.length + 1);
  // newPath in the manifest is relative to content/, so compute fromDir the same way.
  const fromDir = posix.dirname(relative(CONTENT, file).split(sep).join("/"));
  let touched = false;
  const out = readFileSync(file, "utf8").replace(LINK, (m, path: string) => {
    const target = byOld.get(norm(path));
    if (!target) {
      unresolved.push(`${relFile}: ${path}`);
      return m;
    }
    let rel = posix.relative(fromDir, target);
    if (!rel.startsWith(".")) rel = `./${rel}`;
    touched = true;
    changed++;
    return `](${rel})`;
  });
  if (touched) writeFileSync(file, out);
}

console.log(`rewrote ${changed} stale apex/www links to relative .md`);
for (const u of unresolved) console.log(`  UNRESOLVED: ${u}`);
