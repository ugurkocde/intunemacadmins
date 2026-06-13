// Build the apex -> docs 301 redirect map for SEO preservation.
//
//   npx tsx scripts/migrate/apex-redirects.ts
//
// The 84 legacy URLs are indexed on the apex (intunemacadmins.com/<old-slug>/).
// The docs now live on GitBook at docs.intunemacadmins.com/<group-slug>/<leaf>.
// This maps each legacy apex path to its real GitBook URL (fetched live and
// verified against the published sitemap), writing the pairs for vercel.json.

import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const ROOT = process.cwd();
const MANIFEST = join(ROOT, ".cache/migrate/manifest.json");
const OUT = join(ROOT, ".cache/migrate/apex-redirects.json");
const DOCS = "https://docs.intunemacadmins.com";

// Section directory -> SUMMARY.md group heading (GitBook derives the URL prefix
// from the slugified heading, not the file path).
const SECTION_GROUP: Record<string, string> = {
  Home: "Home",
  Community: "Community",
  "Community Pulse": "Community Pulse",
  "Frequently Asked Questions": "Frequently Asked Questions",
  baselinesettings: "Baseline Settings for Intune",
  Troubleshooting: "Troubleshooting Guides",
  Snippets: "Snippets",
  "Intune Getting Started Guide": "Intune Getting Started Guide",
  "Complete Guide Macos Deployment": "Complete Guide macOS Deployment",
  "Await Final Configuration": "Await Final Configuration",
  "Platform Single Sign-On": "Platform Single Sign-On (PSSO)",
  "Declarative Device Management": "Declarative Device Management (DDM)",
  "Custom Attributes": "Custom Attributes",
  FileVault: "FileVault",
  "OneDrive Known Folder Move (KFM)": "OneDrive Known Folder Move (KFM)",
  "Updating Microsoft Apps": "Updating Microsoft Apps",
  "Deploy Files": "Deploy Files on a Mac",
};

function gitbookSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Item = {
  section: string;
  isIndex: boolean;
  isHomepage: boolean;
  oldUrl: string; // legacy apex path, trailing slash
  newPath: string; // content/ file path
};

async function main(): Promise<void> {
  const items: Item[] = JSON.parse(readFileSync(MANIFEST, "utf8"));

  // Live GitBook URLs (ground truth).
  const xml = await (await fetch(`${DOCS}/sitemap-pages.xml`)).text();
  const live = new Set(
    [...xml.matchAll(/https:\/\/docs\.intunemacadmins\.com([^<]*)/g)].map((m) =>
      m[1].replace(/\/$/, ""),
    ),
  );

  const redirects: { source: string; destination: string }[] = [];
  const unmatched: string[] = [];

  for (const it of items) {
    if (it.isHomepage) continue; // apex "/" serves the landing page, no redirect

    const groupSlug = gitbookSlug(SECTION_GROUP[it.section] ?? it.section);
    // GitBook prefixes URLs with the slugified group heading, but a section's
    // landing (README) gets the slug of the section's own name, not the heading
    // (which may carry a suffix like "(PSSO)" or "Guides").
    const leaf = it.isIndex ? gitbookSlug(it.section) : basename(it.newPath).replace(/\.md$/, "");
    // GitBook URL = unique live path under the group ending in the file's leaf.
    const candidates = [...live].filter(
      (p) => p.startsWith(`/${groupSlug}/`) && p.endsWith(`/${leaf}`),
    );

    const source = it.oldUrl; // indexed form keeps the trailing slash (trailingSlash: true)
    if (candidates.length === 1) {
      redirects.push({ source, destination: `${DOCS}${candidates[0]}` });
    } else {
      unmatched.push(`${it.oldUrl}  (group=${groupSlug} leaf=${leaf} -> ${candidates.length} matches)`);
    }
  }

  redirects.sort((a, b) => a.source.localeCompare(b.source));
  writeFileSync(OUT, JSON.stringify(redirects, null, 2));

  console.log(`legacy pages: ${items.length} | redirects built: ${redirects.length}`);
  console.log(`unmatched: ${unmatched.length}`);
  for (const u of unmatched) console.log(`  - ${u}`);
  console.log(`\nwrote ${OUT}`);
}

main();
