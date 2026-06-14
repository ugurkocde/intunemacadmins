// One-shot Astro/Starlight -> GitBook content converter.
//
//   npx tsx scripts/migrate/convert.ts
//
// Reads src/content/docs/**/*.{md,mdx} (left untouched) and writes a clean
// GitBook content tree under content/. Idempotent: clears and rewrites content/
// (except content/.gitbook/assets which is re-copied) on every run.
//
// Output:
//   content/**.md                 converted pages (clean lowercase-hyphen slugs)
//   content/.gitbook/assets/**     copied image/download assets
//   .cache/migrate/manifest.json   per-file mapping (old url, new path, flags)
//   .cache/migrate/redirects.json  [{ from: oldUrl, to: newUrl }] for .gitbook.yaml
//   console report                 counts + complex/review/unresolved lists
//
// Homepage (root index.mdx) and any file with rich <Card>/custom components are
// CLASSIFIED COMPLEX and SKIPPED here -- they are hand-authored separately.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative, sep } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const ROOT = process.cwd();
const SRC_DOCS = join(ROOT, "src/content/docs");
const OUT = join(ROOT, "content");
const ASSETS_SRC = join(ROOT, "public/src/assets");
const PUBLIC = join(ROOT, "public");
const GITBOOK_ASSETS = join(OUT, ".gitbook/assets");
const CACHE = join(ROOT, ".cache/migrate");
// Hand-authored pages (homepage, rich-card pages) mirroring their content/ path.
const MANUAL = join(ROOT, "scripts/migrate/manual");

// Frontmatter keys GitBook ignores but the freshness checker still reads, plus
// description (the one key GitBook honors). Everything else is dropped.
const RETAINED_KEYS = ["description", "sources", "lastReviewed", "author", "generated"];

type Entry = {
  srcPath: string;
  relFromDocs: string; // e.g. "Platform Single Sign-On/What_Is_PSSO.mdx"
  isIndex: boolean;
  isHomepage: boolean;
  oldUrl: string; // Starlight live URL, normalized no trailing slash, lowercase
  oldUrlSlash: string; // with trailing slash, for redirect source
  newRelPath: string; // posix, relative to content/, e.g. "platform-single-sign-on/what-is-psso.md"
  newUrl: string; // "/platform-single-sign-on/what-is-psso"
  data: Record<string, unknown>;
  body: string;
  complex: boolean;
  complexReason?: string;
  review: string[];
};

// ---- slug helpers -------------------------------------------------------

// Clean GitBook-style slug: lowercase, strip apostrophes/parens, any run of
// non-alphanumerics -> single hyphen, trim hyphens.
function cleanSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Starlight's live-URL slug (verified against the production sitemap):
// lowercase, strip apostrophes/parens, spaces -> hyphen, collapse hyphens;
// underscores are PRESERVED. Used to reproduce CURRENT URLs for redirects.
function starlightSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(name)) out.push(p);
  }
  return out;
}

// ---- frontmatter --------------------------------------------------------

function splitFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const normalized = raw.replace(/\r\n?/g, "\n");
  // Require the closing `---` to be its own line (followed by newline or EOF),
  // so a `\n---` inside a YAML value can't prematurely end the frontmatter.
  const m = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!m) return { data: {}, body: normalized };
  let data: Record<string, unknown> = {};
  try {
    data = (parseYaml(m[1]) as Record<string, unknown>) ?? {};
  } catch {
    data = {};
  }
  return { data, body: normalized.slice(m[0].length) };
}

function emitFrontmatter(data: Record<string, unknown>): string {
  const lines: string[] = ["---"];
  // description first, always quoted to survive GitBook's YAML import.
  if (data.description != null) {
    lines.push(`description: ${JSON.stringify(String(data.description))}`);
  }
  const rest: Record<string, unknown> = {};
  for (const k of RETAINED_KEYS) {
    if (k === "description") continue;
    if (data[k] == null) continue;
    if (k === "lastReviewed") {
      const d = data[k];
      const iso = d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
      rest[k] = iso;
    } else {
      rest[k] = data[k];
    }
  }
  if (Object.keys(rest).length) {
    lines.push(stringifyYaml(rest).trimEnd());
  }
  lines.push("---");
  return lines.join("\n");
}

// ---- body transforms ----------------------------------------------------

// A stray mid-body frontmatter fence (the Configure_MacOS_Platform_SSO case) is
// a concatenation corruption: a second copy of the document was appended after
// it. Truncate from the fence to EOF — the trailing content duplicates what
// precedes it (verified: the kept first half is the more complete copy).
function stripStrayFrontmatter(body: string, log: (s: string) => void): string {
  const m = /(^|\n)---\n[ \t]*[\w-]+:[\s\S]*?\n---\n/.exec(body);
  if (m) {
    const firstLine = m[0].split("\n").find((l) => /^[ \t]*[\w-]+:/.test(l)) ?? "";
    log(`truncated at stray frontmatter / duplicate half (${firstLine.trim()})`);
    return `${body.slice(0, m.index).replace(/\s+$/, "")}\n`;
  }
  return body;
}

function stripImports(body: string): string {
  return body.replace(/^import\s+[\s\S]*?;[ \t]*$/gm, "");
}

const ASIDE_STYLE: Record<string, string> = {
  note: "info",
  tip: "success",
  caution: "warning",
  danger: "danger",
};

function convertAsides(body: string): string {
  body = body.replace(/<Aside\b([^>]*)>/g, (_m, attrs: string) => {
    const type = /type="([^"]+)"/.exec(attrs)?.[1] ?? "note";
    const title = /title="([^"]+)"/.exec(attrs)?.[1];
    const style = ASIDE_STYLE[type] ?? "info";
    const open = `{% hint style="${style}" %}`;
    return title ? `${open}\n**${title}**\n` : open;
  });
  body = body.replace(/<\/Aside>/g, "{% endhint %}");
  // `:::note` / `:::tip` ... `:::` directive form.
  body = body.replace(/^:::(note|tip|caution|danger)\s*$/gm, (_m, t: string) => {
    return `{% hint style="${ASIDE_STYLE[t] ?? "info"}" %}`;
  });
  body = body.replace(/^:::\s*$/gm, "{% endhint %}");
  return body;
}

function convertYouTube(body: string): string {
  return body.replace(/<YouTube\s+id="([^"]+)"\s*\/>/g, (_m, id: string) => {
    return `{% embed url="https://www.youtube.com/watch?v=${id}" %}`;
  });
}

// Flat HTML lists/headings (only present inside import.mdx's asides) -> markdown.
// Inline <a>/<strong> are left intact (GitBook renders inline HTML).
function htmlListsToMarkdown(body: string): string {
  body = body.replace(/<h3>([\s\S]*?)<\/h3>/g, (_m, t: string) => `**${t.trim()}**\n`);
  body = body.replace(/<li>([\s\S]*?)<\/li>/g, (_m, t: string) => `- ${t.trim()}`);
  body = body.replace(/^[ \t]*<\/?(ul|ol)>[ \t]*$/gm, "");
  return body;
}

// Strip per-line leading indentation inside {% hint %} blocks so converted list
// items / headings don't get swallowed as markdown code blocks (4-space rule).
function dedentHints(body: string): string {
  const lines = body.split("\n");
  let inHint = false;
  return lines
    .map((line) => {
      if (/^\s*\{%\s*hint\b/.test(line)) {
        inHint = true;
        return line.trim();
      }
      if (/^\s*\{%\s*endhint\s*%\}/.test(line)) {
        inHint = false;
        return line.trim();
      }
      return inHint ? line.replace(/^[ \t]+/, "") : line;
    })
    .join("\n");
}

function stripStepsWrappers(body: string): string {
  return body.replace(/^[ \t]*<\/?Steps>[ \t]*$/gm, "");
}

// ---- main ---------------------------------------------------------------

function isHomepageFile(relFromDocs: string, data: Record<string, unknown>): boolean {
  return relFromDocs === "index.mdx" || relFromDocs === "index.md" || data.template === "splash";
}

function classifyComplex(body: string, isHome: boolean): string | undefined {
  if (isHome) return "homepage (splash/hero/custom components)";
  if (/<Card[\s>]/.test(body)) return "rich <Card> grid";
  if (/from\s+["']\.\.\/\.\.\/components\//.test(body) || /<(GithubStar|Sponsors)\b/.test(body))
    return "custom Astro component";
  return undefined;
}

function buildEntries(): Entry[] {
  const files = walk(SRC_DOCS).sort();
  const entries: Entry[] = [];
  for (const srcPath of files) {
    const relFromDocs = relative(SRC_DOCS, srcPath).split(sep).join("/");
    const raw = readFileSync(srcPath, "utf8");
    const { data, body } = splitFrontmatter(raw);

    const segs = relFromDocs.split("/");
    const fileName = segs.pop()!;
    const base = fileName.replace(/\.mdx?$/, "");
    const isIndex = base.toLowerCase() === "index";
    const isHomepage = isHomepageFile(relFromDocs, data);

    // OLD url (Starlight): lowercase, spaces->hyphen, keep _ and ().
    const oldSegs = segs.map(starlightSlug);
    const oldFile = isIndex ? "" : starlightSlug(base);
    const oldPath = [...oldSegs, oldFile].filter(Boolean).join("/");
    const oldUrlSlash = oldPath ? `/${oldPath}/` : "/";
    const oldUrl = oldPath ? `/${oldPath}` : "/";

    // NEW path/url (clean): lowercase-hyphen, parens stripped; index -> README.md.
    const newSegs = segs.map(cleanSlug);
    const newFile = isIndex ? "README.md" : `${cleanSlug(base)}.md`;
    const newRelPath = [...newSegs, newFile].filter(Boolean).join("/");
    const newDir = newSegs.join("/");
    const newUrl = isIndex
      ? newDir
        ? `/${newDir}`
        : "/"
      : `/${[...newSegs, cleanSlug(base)].join("/")}`;

    const complexReason = classifyComplex(body, isHomepage);
    entries.push({
      srcPath,
      relFromDocs,
      isIndex,
      isHomepage,
      oldUrl: oldUrl.toLowerCase(),
      oldUrlSlash,
      newRelPath,
      newUrl,
      data,
      body,
      complex: Boolean(complexReason),
      complexReason,
      review: [],
    });
  }
  return entries;
}

function rewriteInternalLinks(
  entry: Entry,
  byOldUrl: Map<string, Entry>,
  warn: (s: string) => void,
): void {
  const fromDir = posix.dirname(entry.newRelPath);
  const SETTINGS_ALIAS = "/baselinesettings";
  // Pre-existing broken source links -> their real target (live-URL form).
  const ALIASES: Record<string, string> = {
    "/home/howtocontribute": "/home/how_to_contribute",
  };

  function resolve(href: string): string | null {
    let h = href.trim();
    h = h.replace(/^https?:\/\/(?:www\.)?intunemacadmins\.com/i, "");
    if (!h.startsWith("/")) return null; // external or relative
    if (h.startsWith("/src/assets/")) return null; // image, handled elsewhere
    const hashIdx = h.indexOf("#");
    const fragment = hashIdx >= 0 ? h.slice(hashIdx) : ""; // preserve #anchor
    h = h.split(/[?#]/)[0];
    let norm = h.replace(/\/+$/, "").toLowerCase() || "/";
    if (ALIASES[norm]) norm = ALIASES[norm];
    // Known bug: settingsoverview links point at a non-existent /settingsoverview base.
    if (norm.startsWith("/settingsoverview/")) {
      norm = SETTINGS_ALIAS + norm.slice("/settingsoverview".length);
    }
    const target = byOldUrl.get(norm);
    if (!target) {
      warn(`${entry.relFromDocs}: unresolved internal link "${href}"`);
      return null;
    }
    let rel = posix.relative(fromDir, target.newRelPath);
    if (!rel.startsWith(".")) rel = `./${rel}`;
    return rel + fragment;
  }

  // Markdown links: ](/path) or ](/path "title")
  entry.body = entry.body.replace(/\]\((\/[^)\s]*)(\s+"[^"]*")?\)/g, (m, href: string, title) => {
    const rel = resolve(href);
    return rel ? `](${rel}${title ?? ""})` : m;
  });
  // HTML href="/path"
  entry.body = entry.body.replace(/href="(\/[^"]*)"/g, (m, href: string) => {
    const rel = resolve(href);
    return rel ? `href="${rel}"` : m;
  });
}

function rewriteImages(entry: Entry): void {
  const fromDir = join(OUT, posix.dirname(entry.newRelPath));
  let relAssets = relative(fromDir, GITBOOK_ASSETS).split(sep).join("/");
  if (!relAssets.startsWith(".")) relAssets = `./${relAssets}`;
  // /src/assets/X -> <relAssets>/X  (markdown ](...) incl. stray inner spaces, and html src="...")
  entry.body = entry.body.replace(/\]\(\s*\/src\/assets\/([^)\s]+)\s*\)/g, `](${relAssets}/$1)`);
  entry.body = entry.body.replace(/src="\/src\/assets\/([^"]+)"/g, `src="${relAssets}/$1"`);
}

function convertLinkCardGrids(entry: Entry): void {
  // Replace each self-closing <LinkCard ... /> with a markdown list item.
  entry.body = entry.body.replace(/[ \t]*<LinkCard\b([\s\S]*?)\/>/g, (_m, attrs: string) => {
    const title = /title="([^"]*)"/.exec(attrs)?.[1] ?? "";
    const desc = /description="([^"]*)"/.exec(attrs)?.[1] ?? "";
    const href = /href="([^"]*)"/.exec(attrs)?.[1] ?? "";
    const link = `[**${title}**](${href})`;
    return desc ? `- ${link} — ${desc}` : `- ${link}`;
  });
  // Drop CardGrid wrappers (with or without props like `stagger`).
  entry.body = entry.body.replace(/^[ \t]*<\/?CardGrid\b[^>]*>[ \t]*$/gm, "");
}

function injectH1(entry: Entry): void {
  let body = entry.body.replace(/^\s+/, "");
  const hasH1 = /^#\s+\S/m.test(body.split("\n").slice(0, 3).join("\n")) || /^#\s+\S/m.test(body);
  if (!hasH1 && entry.data.title) {
    body = `# ${String(entry.data.title)}\n\n${body}`;
  }
  // GitBook block tags must be blank-line separated to render.
  body = body.replace(/([^\n])\n(\{% hint )/g, "$1\n\n$2");
  body = body.replace(/(\{% endhint %\})\n([^\n])/g, "$1\n\n$2");
  // Collapse 3+ blank lines.
  entry.body = body.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function transform(entry: Entry, byOldUrl: Map<string, Entry>, warn: (s: string) => void): void {
  const log = (s: string) => entry.review.push(s);
  let body = entry.body;
  body = stripStrayFrontmatter(body, log);
  body = stripImports(body);
  body = stripStepsWrappers(body);
  if (/<ul\b|<ol\b|<h[1-6]\b|<table\b/i.test(body) && /<Aside\b/.test(entry.body)) {
    entry.review.push("aside contains block HTML — eyeball hint rendering");
  }
  body = convertAsides(body);
  body = htmlListsToMarkdown(body);
  body = dedentHints(body);
  body = convertYouTube(body);
  entry.body = body;
  convertLinkCardGrids(entry);
  rewriteInternalLinks(entry, byOldUrl, warn);
  rewriteImages(entry);
  injectH1(entry);
}

function main(): void {
  // Reset output tree.
  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  mkdirSync(CACHE, { recursive: true });

  const entries = buildEntries();
  const byOldUrl = new Map<string, Entry>();
  for (const e of entries) {
    if (byOldUrl.has(e.oldUrl)) {
      console.warn(`DUPLICATE old url ${e.oldUrl}: ${e.relFromDocs}`);
    }
    byOldUrl.set(e.oldUrl, e);
  }

  // Copy assets.
  mkdirSync(GITBOOK_ASSETS, { recursive: true });
  if (existsSync(ASSETS_SRC)) cpSync(ASSETS_SRC, GITBOOK_ASSETS, { recursive: true });
  // Homepage avatars / logos that live at public/ root.
  for (const f of readdirSync(PUBLIC)) {
    if (/\.(webp|jpg|jpeg|png|svg)$/i.test(f) && statSync(join(PUBLIC, f)).isFile()) {
      cpSync(join(PUBLIC, f), join(GITBOOK_ASSETS, f));
    }
  }

  // Hand-authored pages that replace auto-conversion (path mirrors content/).
  const manualFiles = existsSync(MANUAL) ? walk(MANUAL) : [];
  const manualRel = new Set(manualFiles.map((f) => relative(MANUAL, f).split(sep).join("/")));

  const warnings: string[] = [];
  const warn = (s: string) => warnings.push(s);

  let written = 0;
  const skipped: Entry[] = [];
  const reviewFiles: { file: string; notes: string[] }[] = [];

  for (const e of entries) {
    if (e.complex) {
      skipped.push(e);
      continue;
    }
    if (manualRel.has(e.newRelPath)) continue; // replaced by a hand-authored page
    transform(e, byOldUrl, warn);
    const out = `${emitFrontmatter(e.data)}\n\n${e.body.trimStart()}`;
    const dest = join(OUT, e.newRelPath);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, out.endsWith("\n") ? out : `${out}\n`);
    written++;
    if (e.review.length) reviewFiles.push({ file: e.newRelPath, notes: e.review });
  }

  // Copy hand-authored pages in last so re-runs never destroy them.
  for (const f of manualFiles) {
    const rel = relative(MANUAL, f).split(sep).join("/");
    const dest = join(OUT, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(f, dest);
  }

  // Manifest + redirects.
  const manifest = entries.map((e) => {
    const sb = (e.data.sidebar ?? {}) as { label?: string; order?: number };
    return {
      src: e.relFromDocs,
      section: e.relFromDocs.split("/")[0],
      isIndex: e.isIndex,
      isHomepage: e.isHomepage,
      title: e.data.title != null ? String(e.data.title) : null,
      label: sb.label ?? null,
      order: typeof sb.order === "number" ? sb.order : null,
      oldUrl: e.oldUrlSlash,
      newPath: e.newRelPath,
      newUrl: e.newUrl,
      complex: e.complex,
      complexReason: e.complexReason ?? null,
    };
  });
  writeFileSync(join(CACHE, "manifest.json"), JSON.stringify(manifest, null, 2));
  const redirects = entries.map((e) => ({ from: e.oldUrlSlash, to: e.newUrl }));
  writeFileSync(join(CACHE, "redirects.json"), JSON.stringify(redirects, null, 2));

  // Report.
  console.log(`\n=== convert report ===`);
  console.log(`source files: ${entries.length}`);
  console.log(`auto-written: ${written}`);
  console.log(`manual pages copied: ${manualFiles.length}`);
  const totalOut = written + manualFiles.length;
  console.log(`total in content/: ${totalOut}  ${totalOut === entries.length ? "OK" : "MISSING!"}`);
  console.log(`\nskipped (complex, need hand-author): ${skipped.length}`);
  for (const e of skipped) {
    const have = manualRel.has(e.newRelPath) ? "manual OK" : "MISSING MANUAL";
    console.log(`  - ${e.relFromDocs}  [${e.complexReason}] -> ${e.newRelPath}  [${have}]`);
  }
  console.log(`\nreview flags: ${reviewFiles.length}`);
  for (const r of reviewFiles) console.log(`  - ${r.file}: ${r.notes.join("; ")}`);
  console.log(`\nunresolved internal links: ${warnings.length}`);
  for (const w of warnings) console.log(`  - ${w}`);
  console.log(`\nmanifest + redirects -> ${relative(ROOT, CACHE)}/`);
}

main();
