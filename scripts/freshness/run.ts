// Docs-freshness checker CLI.
//
//   tsx scripts/freshness/run.ts [--no-links] [--no-drift] [--apply-edits]
//                                [--drift-page=<substr> ...]
//
// Scans authored docs for staleness signals (overdue review, expired dates,
// outdated macOS recommendations, broken authoritative links) and, for pages
// that declare `sources`, compares them against the current Microsoft/Apple
// docs (drift). Findings go to .cache/freshness-report.{json,md} (the issue).
//
// With --apply-edits, drift the model expressed as a verbatim text replacement
// is applied to the page files and summarized in .cache/edits-pr-body.md (the
// PR). Drift that isn't a clean replacement stays a flag in the report. The
// workflow validates and auto-merges independently verified edits.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  docPath,
  prependChangelogEntries,
  type ChangelogEntry,
} from "../changelog";
import {
  EDITS_JSON,
  EDITS_PR_BODY,
  HTTP_TIMEOUT_MS,
  LATEST_MACOS_FALLBACK,
  REPORT_JSON,
  REPORT_MD,
  SOFA_MACOS_FEED,
  USER_AGENT,
} from "./config";
import { applyEdits } from "./edit/apply";
import { checkDrift } from "./drift/drift";
import { loadDocs } from "./load";
import { renderEditsPrBody } from "./render/edits-pr-body";
import { renderEmptyBody, renderIssueBody } from "./render/issue-body";
import { parseLatestMacOS, scan, sortFindings } from "./scan";

async function main(): Promise<void> {
  const checkLinks = !process.argv.includes("--no-links");
  const now = new Date();

  const pages = loadDocs();
  const { latestMacOS, macosSkipped } = await resolveLatestMacOS();

  const report = await scan(pages, { now, latestMacOS, checkLinks });
  if (macosSkipped) {
    report.skipped.push(`macOS version feed unreachable; used fallback ${latestMacOS}`);
  }

  await runDrift(pages, report, now);
  report.findings = sortFindings(report.findings);

  writeFile(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");
  const body =
    report.findings.length === 0
      ? renderEmptyBody(report)
      : renderIssueBody(report);
  writeFile(REPORT_MD, body + "\n");

  const bySeverity = report.findings.reduce(
    (acc, f) => ((acc[f.severity] = (acc[f.severity] ?? 0) + 1), acc),
    {} as Record<string, number>,
  );
  console.log(
    `[freshness] scanned ${pages.length} pages, latest macOS ${latestMacOS}: ` +
      `${report.findings.length} findings (${bySeverity.high ?? 0} high, ${bySeverity.medium ?? 0} medium, ${bySeverity.low ?? 0} low)`,
  );
  for (const s of report.skipped) console.log(`[freshness] skipped: ${s}`);
}

async function runDrift(
  pages: Awaited<ReturnType<typeof loadDocs>>,
  report: Awaited<ReturnType<typeof scan>>,
  now: Date,
): Promise<void> {
  const sourced = pages.filter(
    (p) => Array.isArray(p.frontmatter.sources) && p.frontmatter.sources.length > 0,
  ).length;
  if (process.argv.includes("--no-drift") || sourced === 0) return;

  if (!process.env.ANTHROPIC_API_KEY) {
    report.skipped.push(
      `content-drift: ANTHROPIC_API_KEY not set (${sourced} sourced page(s) not checked)`,
    );
    return;
  }

  // Optional targeting: --drift-page=<substr> (repeatable) limits drift to
  // matching pages, for cheap re-checks of specific docs.
  const driftPageArgs = process.argv
    .filter((a) => a.startsWith("--drift-page="))
    .map((a) => a.slice("--drift-page=".length))
    .filter(Boolean);
  const pageFilter = driftPageArgs.length
    ? (path: string) => driftPageArgs.some((s) => path.includes(s))
    : undefined;

  // Imported lazily so the deterministic checks never require the SDK/key.
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ maxRetries: 3 });
  const result = await checkDrift(pages, { client: client as never, pageFilter });
  report.findings.push(...result.findings); // drift that isn't a clean edit
  report.skipped.push(...result.skipped);

  if (!process.argv.includes("--apply-edits")) {
    // Detection-only: surface the would-be edits as flags too.
    for (const c of result.editCandidates) {
      report.findings.push({
        check: "content-drift",
        severity: c.severity,
        location: c.path,
        message: `${c.discrepancy} (vs ${c.source})`,
        evidence: c.oldText.slice(0, 200),
      });
    }
    console.log(
      `[freshness] drift: ${result.findings.length} flag(s), ${result.editCandidates.length} editable (not applied; use --apply-edits)`,
    );
    return;
  }

  const { files, applied, rejected } = applyEdits(pages, result.editCandidates);
  for (const [path, content] of files) writeFile(path, content);
  report.findings.push(...rejected); // edits that couldn't be applied -> issue
  if (applied.length > 0) {
    writeFile(EDITS_PR_BODY, renderEditsPrBody(applied) + "\n");
    writeFile(EDITS_JSON, JSON.stringify(applied, null, 2) + "\n");
    const byPath = new Map<string, typeof applied>();
    for (const edit of applied) {
      const list = byPath.get(edit.path) ?? [];
      list.push(edit);
      byPath.set(edit.path, list);
    }
    const pageByPath = new Map(pages.map((page) => [page.path, page]));
    const entries: ChangelogEntry[] = [...byPath].map(([path, edits]) => {
      const page = pageByPath.get(path);
      const title = page ? docTitle(page.path, page.title, page.body) : fallbackTitle(path);
      return {
        id: `freshness:${path}:${edits.map((edit) => `${edit.source}:${edit.oldText}:${edit.newText}`).join("|")}`,
        kind: "Documentation correction",
        title: `Corrected ${title}`,
        summary: [...new Set(edits.map((edit) => edit.discrepancy))].join(" "),
        pages: [{ label: title, url: docPath(path) }],
        sources: [...new Set(edits.map((edit) => edit.source))].map((source) => ({
          label: sourceLabel(source),
          url: source,
        })),
      };
    });
    prependChangelogEntries(entries, now);
  }
  console.log(
    `[freshness] drift: ${result.findings.length} flag(s); edits applied ${applied.length}, rejected ${rejected.length} across ${files.size} file(s)`,
  );
}

function docTitle(path: string, frontmatterTitle: string, body: string): string {
  if (frontmatterTitle !== path) return frontmatterTitle;
  return body.match(/^#\s+(.+)$/m)?.[1].trim() ?? fallbackTitle(path);
}

function fallbackTitle(path: string): string {
  return path.split("/").at(-1)?.replace(/\.mdx?$/, "").replace(/-/g, " ") ?? path;
}

function sourceLabel(source: string): string {
  try {
    const host = new URL(source).hostname;
    if (host === "learn.microsoft.com") return "Microsoft Learn";
    if (host === "apple.com" || host.endsWith(".apple.com")) return "Apple documentation";
    return host;
  } catch {
    return "Authoritative source";
  }
}

async function resolveLatestMacOS(): Promise<{
  latestMacOS: number;
  macosSkipped: boolean;
}> {
  try {
    const res = await fetch(SOFA_MACOS_FEED, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = parseLatestMacOS(await res.json());
    if (parsed) return { latestMacOS: parsed, macosSkipped: false };
  } catch {
    // fall through to fallback
  }
  return { latestMacOS: LATEST_MACOS_FALLBACK, macosSkipped: true };
}

function writeFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
