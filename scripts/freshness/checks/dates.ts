import type { DocPage, Finding } from "../types";

// Deadline phrasing that implies a date should be in the future. We only flag
// past dates in this context, so changelog entries and "published in 2024"
// prose don't trip the check.
const DEADLINE_CUE = /\b(by|until|before|no later than|deadline|expires?(?: on)?|valid until|as of)\b/i;

// Date formats seen in the corpus: MM/DD/YYYY, YYYY-MM-DD, "Month DD, YYYY".
const DATE_PATTERNS: Array<{ re: RegExp; parse: (m: RegExpExecArray) => Date | null }> = [
  {
    re: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
    parse: (m) => makeDate(+m[3], +m[1] - 1, +m[2]),
  },
  {
    re: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    parse: (m) => makeDate(+m[1], +m[2] - 1, +m[3]),
  },
  {
    re: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
    parse: (m) => makeDate(+m[3], MONTHS.indexOf(m[1].toLowerCase()), +m[2]),
  },
];

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// Flags dates that are stated as a future deadline but are now in the past, e.g.
// "These settings will update your device by 07/06/2024" - a claim that has
// silently expired.
export function checkPastDeadlines(page: DocPage, now: Date): Finding[] {
  const findings: Finding[] = [];
  const lines = page.body.split("\n");
  lines.forEach((line, i) => {
    if (!DEADLINE_CUE.test(line)) return;
    for (const { re, parse } of DATE_PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        const date = parse(m);
        if (!date || date >= now) continue;
        findings.push({
          check: "past-deadline",
          severity: "medium",
          location: `${page.path}:${page.bodyStartLine + i}`,
          message: `Mentions a deadline date (${m[0]}) that is now in the past; the statement may no longer be accurate.`,
          evidence: line.trim().slice(0, 200),
        });
      }
    }
  });
  return findings;
}

function makeDate(year: number, monthIndex: number, day: number): Date | null {
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, monthIndex, day));
  return Number.isNaN(d.getTime()) ? null : d;
}
