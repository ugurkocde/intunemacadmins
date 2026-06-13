import type { DocPage, Finding } from "../types";

// macOS marketing name -> major version, for comparison. The 15 -> 26 jump is
// Apple's 2025 switch to year-based numbering; only relative ordering matters
// for "how far behind".
const NAME_TO_MAJOR: Record<string, number> = {
  catalina: 10,
  "big sur": 11,
  monterey: 12,
  ventura: 13,
  sonoma: 14,
  sequoia: 15,
  tahoe: 26,
};

// A recommendation to run/upgrade to a version (advisory, perishable). Kept
// narrow on purpose: only explicit recommendation verbs, so factual floors like
// "necessitates at least macOS 13" are not mistaken for stale advice.
const RECOMMEND_CUE = /\b(recommend|recommended|suggest|best (?:to upgrade|results)|stay current)\b/i;
// Feature-availability / hard requirement context - factual, NOT flagged.
const REQUIREMENT_CUE = /\b(available in|requires?|required|minimum|must be|must run|supported on|necessitates?|and later|and newer|or later|or newer)\b/i;

// Release ordinal, not the marketing number: Apple jumped 15 (Sequoia) to 26
// (Tahoe) in 2025, so "behind-ness" must be measured by position in the release
// sequence, not by subtraction. 10..15 are consecutive; 26+ continue from there.
export function macosOrdinal(major: number): number {
  return major <= 15 ? major - 10 : 6 + (major - 26);
}

// Flags advisory "run macOS X or newer" lines where X is two or more releases
// behind the current one. Requirements like "available in macOS 13 and later"
// are left alone - those are facts about when a feature shipped.
export function checkMacosVersion(
  page: DocPage,
  latestMajor: number,
  now: Date = new Date(),
): Finding[] {
  void now;
  const latestOrdinal = macosOrdinal(latestMajor);
  const findings: Finding[] = [];
  const lines = page.body.split("\n");
  lines.forEach((line, i) => {
    if (!RECOMMEND_CUE.test(line) || REQUIREMENT_CUE.test(line)) return;
    const behind = extractMacosMajors(line).filter(
      (v) => latestOrdinal - macosOrdinal(v) >= 2,
    );
    if (behind.length === 0) return;
    const oldest = behind.sort((a, b) => macosOrdinal(a) - macosOrdinal(b))[0];
    findings.push({
      check: "macos-version",
      severity: "low",
      location: `${page.path}:${page.bodyStartLine + i}`,
      message: `Recommends macOS ${oldest}; the current release is macOS ${latestMajor}. This recommendation may be outdated.`,
      evidence: line.trim().slice(0, 200),
    });
  });
  return findings;
}

export function extractMacosMajors(text: string): number[] {
  const found = new Set<number>();
  // "macOS 14", "macOS 14.x", "macOS 10.15"
  for (const m of text.matchAll(/macos\s+(\d+)(?:\.(\d+))?/gi)) {
    const major = Number(m[1]);
    found.add(major === 10 && m[2] ? 10 : major);
  }
  // "Version 14.0" (often follows a name in parentheses)
  for (const m of text.matchAll(/\bversion\s+(\d+)(?:\.\d+)*/gi)) {
    found.add(Number(m[1]));
  }
  // Marketing names
  const lower = text.toLowerCase();
  for (const [name, major] of Object.entries(NAME_TO_MAJOR)) {
    if (lower.includes(name)) found.add(major);
  }
  return [...found];
}
