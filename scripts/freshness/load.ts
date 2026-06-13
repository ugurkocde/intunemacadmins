import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { DOCS_DIR, EXCLUDED_PATHS } from "./config";
import type { DocPage } from "./types";

const REPO_ROOT = process.cwd();

// Recursively collect .md/.mdx files under DOCS_DIR, skipping excluded trees.
export function loadDocs(docsDir: string = DOCS_DIR): DocPage[] {
  const pages: DocPage[] = [];
  for (const absPath of walk(join(REPO_ROOT, docsDir))) {
    const relPath = relative(REPO_ROOT, absPath);
    if (isExcluded(relPath)) continue;
    const raw = readFileSync(absPath, "utf8");
    pages.push(parseDoc(relPath, raw));
  }
  return pages.sort((a, b) => a.path.localeCompare(b.path));
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      yield full;
    }
  }
}

function isExcluded(relPath: string): boolean {
  return EXCLUDED_PATHS.some(
    (ex) => relPath === ex || relPath.startsWith(ex + "/"),
  );
}

// Split frontmatter from body and record where the body starts so finding line
// numbers map back to the original file. Exported for the self-test.
export function parseDoc(relPath: string, raw: string): DocPage {
  // Strip a leading UTF-8 BOM (some pages have one) before matching frontmatter;
  // otherwise the `^---` anchor fails and the page's frontmatter is lost.
  const deBommed = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const normalized = deBommed.replace(/\r\n?/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  let frontmatter: Record<string, unknown> = {};
  let body = normalized;
  let bodyStartLine = 1;
  if (match) {
    try {
      frontmatter = (parseYaml(match[1]) as Record<string, unknown>) ?? {};
    } catch {
      frontmatter = {};
    }
    body = normalized.slice(match[0].length);
    // Lines consumed by the frontmatter block (including both --- fences).
    bodyStartLine = match[0].split("\n").length;
  }
  const title =
    typeof frontmatter.title === "string" ? frontmatter.title : relPath;
  return { path: relPath, frontmatter, title, body, bodyStartLine };
}

// Last commit date for a file (ISO), used as the review-date fallback when a
// page has no explicit lastReviewed. Null when git is unavailable or the file
// is untracked (e.g. brand new).
export function gitLastModified(relPath: string): string | null {
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", relPath],
      { cwd: REPO_ROOT, encoding: "utf8" },
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}
