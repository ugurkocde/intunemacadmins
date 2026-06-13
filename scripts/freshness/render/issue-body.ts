import type { Finding, FreshnessReport, Severity } from "../types";

const CHECK_LABELS: Record<string, string> = {
  "review-age": "Overdue for review",
  "past-deadline": "Expired date",
  "macos-version": "Outdated macOS recommendation",
  "dead-link": "Broken authoritative link",
  "content-drift": "Differs from current Microsoft/Apple docs",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

// One umbrella issue body. Specific, actionable findings (expired dates, broken
// links, outdated recommendations) lead and get full detail; the review backlog
// (every page past its review window) is summarized in a collapsed list so it
// doesn't bury the signal. Reads as a maintainer checklist, not a dump.
export function renderIssueBody(report: FreshnessReport): string {
  const specific = report.findings.filter((f) => f.check !== "review-age");
  const backlog = report.findings.filter((f) => f.check === "review-age");
  const date = report.generatedAt.slice(0, 10);
  const lines: string[] = [];

  lines.push(
    `Freshness scan of ${report.pagesScanned} documentation pages (${date}).`,
    "",
    `**${specific.length} specific item(s) to check** and **${backlog.length} page(s) overdue for review**.`,
    "",
    "These are flags for review, not confirmed errors. Check each against the current Microsoft/Apple docs, fix what is stale, and set `lastReviewed` on the page when verified (that clears it from this list).",
    "",
  );

  if (specific.length > 0) {
    const counts = countBySeverity(specific);
    lines.push(
      `## Specific findings — ${counts.high} high, ${counts.medium} medium, ${counts.low} low`,
      "",
    );
    const byPage = groupByPage(specific);
    for (const [page, findings] of byPage) {
      lines.push(`### \`${page}\``, "");
      for (const f of findings) {
        const loc = f.location.includes(":")
          ? ` (line ${f.location.split(":")[1]})`
          : "";
        lines.push(
          `- [ ] **${SEVERITY_LABEL[f.severity]} · ${CHECK_LABELS[f.check] ?? f.check}**${loc}: ${f.message}`,
        );
        if (f.evidence) lines.push(`  > ${f.evidence}`);
      }
      lines.push("");
    }
  }

  if (backlog.length > 0) {
    const sorted = [...backlog].sort((a, b) => ageMonths(b) - ageMonths(a));
    lines.push(
      `## Pages overdue for review (${backlog.length})`,
      "",
      "Each page should be re-verified against current Microsoft/Apple docs at least every few months. Work through oldest first; set `lastReviewed` as you go.",
      "",
      "<details><summary>Show all pages</summary>",
      "",
    );
    for (const f of sorted) lines.push(`- [ ] \`${f.location}\` — ${f.message}`);
    lines.push("", "</details>", "");
  }

  if (report.skipped.length > 0) {
    lines.push("---", "", "Checks skipped this run:", "");
    for (const s of report.skipped) lines.push(`- ${s}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function renderEmptyBody(report: FreshnessReport): string {
  return `Freshness scan of ${report.pagesScanned} documentation pages (${report.generatedAt.slice(
    0,
    10,
  )}) found nothing to review: no expired dates, outdated macOS recommendations, broken authoritative links, or pages past their review window.`;
}

function groupByPage(findings: Finding[]): Map<string, Finding[]> {
  const byPage = new Map<string, Finding[]>();
  for (const f of findings) {
    const page = f.location.split(":")[0];
    if (!byPage.has(page)) byPage.set(page, []);
    byPage.get(page)!.push(f);
  }
  return new Map([...byPage.entries()].sort());
}

function ageMonths(f: Finding): number {
  const m = f.message.match(/in (\d+) months/);
  return m ? Number(m[1]) : 0;
}

function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return counts;
}
