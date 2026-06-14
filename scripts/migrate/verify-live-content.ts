// Verify every sitemap URL serves the CORRECT content, not just a 200.
//
//   npx tsx scripts/migrate/verify-live-content.ts
//
// For each content/ source file: compute its live GitBook URL, fetch it, and
// confirm (a) direct 200 (no redirect/404), (b) the live body actually contains
// the source page's distinctive prose (word overlap), (c) canonical is
// self-referential, (d) the URL is in the published sitemap. Also checks the
// apex landing. Generic "Overview" page titles are reported as a soft note.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");
const DOCS = "https://docs.intunemacadmins.com";
const WWW = "https://www.intunemacadmins.com";

// Keyed by the CLEANED content directory name -> the SUMMARY group heading
// (GitBook slugs the heading for the URL prefix).
const SECTION_GROUP: Record<string, string> = {
  home: "Home",
  community: "Community",
  "community-pulse": "Community Pulse",
  "frequently-asked-questions": "Frequently Asked Questions",
  baselinesettings: "Baseline Settings for Intune",
  troubleshooting: "Troubleshooting Guides",
  snippets: "Snippets",
  "intune-getting-started-guide": "Intune Getting Started Guide",
  "complete-guide-macos-deployment": "Complete Guide macOS Deployment",
  "await-final-configuration": "Await Final Configuration",
  "platform-single-sign-on": "Platform Single Sign-On (PSSO)",
  "declarative-device-management": "Declarative Device Management (DDM)",
  "custom-attributes": "Custom Attributes",
  filevault: "FileVault",
  "onedrive-known-folder-move-kfm": "OneDrive Known Folder Move (KFM)",
  "updating-microsoft-apps": "Updating Microsoft Apps",
  "deploy-files": "Deploy Files on a Mac",
};
const slug = (s: string) =>
  s.toLowerCase().replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const stripTags = (h: string) =>
  h.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (n === ".gitbook") continue;
      out.push(...walk(p));
    } else if (n.endsWith(".md")) out.push(p);
  }
  return out;
}

function sourceProse(file: string): string {
  const body = readFileSync(file, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "");
  const lines: string[] = [];
  for (const line of body.split("\n").map((l) => l.trim())) {
    if (!line || /^[#\-*!>|]/.test(line) || line.startsWith("{%") || line.startsWith("<") || line.startsWith("```") || /^\d+\./.test(line)) continue;
    lines.push(line.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/<[^>]+>/g, ""));
    if (lines.join(" ").length > 200) break;
  }
  return lines.join(" ");
}

function liveUrl(rel: string): string {
  if (rel === "README.md") return `${DOCS}/`;
  const segs = rel.split("/");
  const fileName = segs.pop()!;
  const section = segs[0];
  const group = slug(SECTION_GROUP[section] ?? section);
  const isIndex = basename(fileName, ".md").toLowerCase() === "readme";
  const leaf = isIndex ? slug(section) : slug(basename(fileName, ".md"));
  if (section === "baselinesettings" && !isIndex && !["import", "contribute", "settingsoverview"].includes(leaf)) {
    return `${DOCS}/${group}/settingsoverview/${leaf}`;
  }
  return `${DOCS}/${group}/${leaf}`;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const res: R[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      res[idx] = await fn(items[idx]);
    }
  }));
  return res;
}

async function main(): Promise<void> {
  const sm = await (await fetch(`${DOCS}/sitemap-pages.xml`)).text();
  const sitemap = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/\/$/, "") || `${DOCS}/`));

  const files = walk(CONTENT)
    .map((f) => relative(CONTENT, f).split(sep).join("/"))
    .filter((f) => f !== "SUMMARY.md");
  console.log(`verifying ${files.length} pages against live content...`);

  const problems: string[] = [];
  const notes: string[] = [];

  await mapLimit(files, 8, async (rel) => {
    const url = liveUrl(rel);
    const key = url.replace(/\/$/, "") || url;
    if (!sitemap.has(key)) problems.push(`${rel} -> ${url}: NOT IN SITEMAP`);

    let res: Response;
    try {
      res = await fetch(url, { redirect: "manual" });
    } catch {
      problems.push(`${rel} -> ${url}: FETCH FAILED`);
      return;
    }
    if (res.status !== 200) {
      problems.push(`${rel} -> ${url}: status ${res.status} (not a direct 200)`);
      return;
    }
    const html = await res.text();
    const title = (html.match(/<meta property="og:title" content="([^"]*)"/) ?? [, ""])[1];
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) ?? [, ""])[1];
    const text = norm(stripTags(html));

    // (b) distinctive source prose present in the live body (word overlap)
    const words = [...new Set(norm(sourceProse(join(CONTENT, rel))).split(" ").filter((w) => w.length > 3))].slice(0, 14);
    if (words.length >= 4) {
      const hit = words.filter((w) => text.includes(w)).length / words.length;
      if (hit < 0.7) problems.push(`${rel} -> ${url}: BODY mismatch (only ${Math.round(hit * 100)}% of source words present)`);
    }
    // (c) self-referential canonical
    if (canonical && canonical.replace(/\/$/, "") !== url.replace(/\/$/, "")) {
      problems.push(`${rel} -> ${url}: CANONICAL ${canonical}`);
    }
    // soft note: generic title
    if (/^overview$/i.test(title)) notes.push(`${url}  (title "Overview" — generic for SEO)`);
  });

  const landing = await (await fetch(`${WWW}/`, { redirect: "manual" })).text();
  const landingOk = landing.includes("Read the Documentation") && landing.includes("IntuneMacAdmins");

  console.log(`\n=== RESULT ===`);
  console.log(`pages: ${files.length} | clean: ${files.length - problems.length} | problems: ${problems.length} | notes: ${notes.length}`);
  console.log(`apex landing serves correct content: ${landingOk ? "yes" : "NO"}`);
  if (problems.length) {
    console.log(`\n-- PROBLEMS --`);
    for (const p of problems.sort()) console.log(`  ${p}`);
  }
  if (notes.length) {
    console.log(`\n-- NOTES (generic titles; not broken) --`);
    for (const n of notes.sort()) console.log(`  ${n}`);
  }
  if (!problems.length && landingOk) console.log("\nAll sitemap URLs serve the correct content (200 + body verified).");
}

main();
