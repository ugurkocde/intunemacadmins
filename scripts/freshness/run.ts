// Docs-freshness checker CLI.
//
//   tsx scripts/freshness/run.ts [--no-links]
//
// Scans authored docs for staleness signals (overdue review, expired dates,
// outdated macOS recommendations, broken authoritative links) and writes a
// report to .cache/freshness-report.{json,md}. Detection only - it never edits
// docs. The workflow turns the report into a GitHub issue.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  LATEST_MACOS_FALLBACK,
  REPORT_JSON,
  REPORT_MD,
  SOFA_MACOS_FEED,
  USER_AGENT,
  HTTP_TIMEOUT_MS,
} from "./config";
import { loadDocs } from "./load";
import { renderEmptyBody, renderIssueBody } from "./render/issue-body";
import { parseLatestMacOS, scan } from "./scan";

async function main(): Promise<void> {
  const checkLinks = !process.argv.includes("--no-links");
  const now = new Date();

  const pages = loadDocs();
  const { latestMacOS, macosSkipped } = await resolveLatestMacOS();

  const report = await scan(pages, { now, latestMacOS, checkLinks });
  if (macosSkipped) {
    report.skipped.push(`macOS version feed unreachable; used fallback ${latestMacOS}`);
  }

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
