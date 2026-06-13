import { checkPastDeadlines } from "./checks/dates";
import { checkDeadLinks, type Fetcher } from "./checks/links";
import { checkMacosVersion } from "./checks/macos-version";
import { checkReviewAge } from "./checks/review-age";
import { gitLastModified } from "./load";
import type { DocPage, Finding, FreshnessReport } from "./types";

export interface ScanOptions {
  now: Date;
  latestMacOS: number;
  checkLinks: boolean;
  fetcher?: Fetcher;
  // Injectable for tests; defaults to git in production.
  gitDateResolver?: (path: string) => string | null;
}

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 } as const;

export async function scan(
  pages: DocPage[],
  options: ScanOptions,
): Promise<FreshnessReport> {
  const resolveGit = options.gitDateResolver ?? gitLastModified;
  const findings = [];
  const skipped: string[] = [];

  for (const page of pages) {
    findings.push(...checkReviewAge(page, resolveGit(page.path), options.now));
    findings.push(...checkPastDeadlines(page, options.now));
    findings.push(...checkMacosVersion(page, options.latestMacOS, options.now));
  }

  if (options.checkLinks) {
    const { findings: linkFindings } = await checkDeadLinks(
      pages,
      options.fetcher,
    );
    findings.push(...linkFindings);
  } else {
    skipped.push("dead-link (link check disabled)");
  }

  return {
    generatedAt: options.now.toISOString(),
    pagesScanned: pages.length,
    findings: sortFindings(findings),
    skipped,
  };
}

// High severity first, then by location, for stable, scannable output.
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.location.localeCompare(b.location),
  );
}

// Extracts the current macOS major from the SOFA macos_data_feed.json payload.
export function parseLatestMacOS(feed: unknown): number | null {
  const versions = (feed as { OSVersions?: Array<{ OSVersion?: string }> })
    ?.OSVersions;
  if (!Array.isArray(versions)) return null;
  let max = 0;
  for (const v of versions) {
    for (const m of String(v?.OSVersion ?? "").matchAll(/\b(\d{2})\b/g)) {
      const n = Number(m[1]);
      if (n >= 10) max = Math.max(max, n);
    }
  }
  return max || null;
}
