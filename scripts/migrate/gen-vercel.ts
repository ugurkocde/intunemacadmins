// Generate vercel.json for the apex: a static landing in site/ plus permanent
// (301) redirects from every legacy doc URL to its real GitBook page.
//
//   npx tsx scripts/migrate/apex-redirects.ts   # build + verify the map first
//   npx tsx scripts/migrate/gen-vercel.ts
//
// trailingSlash:true makes the indexed (trailing-slash) URLs match in one hop.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REDIRECTS = join(ROOT, ".cache/migrate/apex-redirects.json");
const OUT = join(ROOT, "vercel.json");

const pairs: { source: string; destination: string }[] = JSON.parse(
  readFileSync(REDIRECTS, "utf8"),
);

const config = {
  $schema: "https://openapi.vercel.sh/vercel.json",
  framework: null,
  installCommand: "echo 'static landing, no install'",
  buildCommand: "echo 'static landing, no build'",
  outputDirectory: "site",
  trailingSlash: true,
  redirects: pairs.map((p) => ({
    source: p.source,
    destination: p.destination,
    permanent: true,
  })),
};

writeFileSync(OUT, JSON.stringify(config, null, 2) + "\n");
console.log(`vercel.json written: ${config.redirects.length} permanent redirects + static site/`);
