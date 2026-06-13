import type { AppliedEdit, DocPage, EditCandidate, Finding } from "../types";

export interface ApplyResult {
  // New full file content per edited page (frontmatter + edited body), keyed by path.
  files: Map<string, string>;
  applied: AppliedEdit[];
  // Edits that could not be safely applied (oldText not found, or not unique).
  // Returned as flag findings so nothing is silently dropped.
  rejected: Finding[];
}

// Applies model-drafted edits as exact, unique-match string replacements on the
// page BODY only (frontmatter is never touched). An edit is applied only if its
// oldText occurs exactly once in the current body - otherwise it's rejected and
// surfaced as a flag, never force-applied. Multiple edits to one page are applied
// in sequence against the evolving body.
export function applyEdits(
  pages: DocPage[],
  candidates: EditCandidate[],
): ApplyResult {
  const byPath = new Map<string, DocPage>(pages.map((p) => [p.path, p]));
  const bodies = new Map<string, string>(); // working body per path
  const applied: AppliedEdit[] = [];
  const rejected: Finding[] = [];

  for (const c of candidates) {
    const page = byPath.get(c.path);
    if (!page) {
      rejected.push(rejectedFinding(c, "page not found"));
      continue;
    }
    const body = bodies.get(c.path) ?? page.body;
    const occurrences = countOccurrences(body, c.oldText);
    if (occurrences !== 1) {
      rejected.push(
        rejectedFinding(
          c,
          occurrences === 0
            ? "drafted text not found verbatim in the page"
            : `drafted text appears ${occurrences} times (not unique)`,
        ),
      );
      continue;
    }
    bodies.set(c.path, body.replace(c.oldText, c.newText));
    applied.push({
      path: c.path,
      severity: c.severity,
      oldText: c.oldText,
      newText: c.newText,
      discrepancy: c.discrepancy,
      source: c.source,
      sourceQuote: c.sourceQuote,
    });
  }

  const files = new Map<string, string>();
  for (const [path, body] of bodies) {
    const page = byPath.get(path)!;
    files.set(path, page.frontmatterRaw + body);
  }
  return { files, applied, rejected };
}

// Non-overlapping literal occurrence count.
function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    count += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return count;
}

function rejectedFinding(c: EditCandidate, why: string): Finding {
  return {
    check: "content-drift",
    severity: c.severity,
    location: c.path,
    message: `${c.discrepancy} (vs ${c.source}) — drafted fix could not be auto-applied (${why}); review manually.`,
    evidence: c.oldText.slice(0, 200),
  };
}
