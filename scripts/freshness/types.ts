export type Severity = "high" | "medium" | "low";

export type CheckId =
  | "review-age"
  | "past-deadline"
  | "macos-version"
  | "dead-link"
  | "content-drift";

export interface Finding {
  check: CheckId;
  severity: Severity;
  // Path relative to repo root, with optional :line suffix for click-through.
  location: string;
  message: string;
  // Verbatim snippet from the page (already trimmed) so the issue is actionable
  // without opening the file. Omitted for whole-page findings like review-age.
  evidence?: string;
}

export interface DocPage {
  // Path relative to repo root.
  path: string;
  frontmatter: Record<string, unknown>;
  title: string;
  body: string;
  // 1-based line number in the original file where the body starts, so finding
  // line numbers map back to the real file.
  bodyStartLine: number;
  // Verbatim frontmatter block (including both --- fences and trailing newline),
  // so an edited file can be rewritten as frontmatterRaw + edited body without
  // re-serializing (and mangling) the frontmatter. Empty if no frontmatter.
  frontmatterRaw: string;
}

// A model-proposed correction to a page: replace an exact verbatim snippet with
// a corrected one, grounded in the current upstream source.
export interface EditCandidate {
  path: string;
  severity: Severity;
  oldText: string; // exact verbatim substring of the page body to replace
  newText: string; // corrected replacement
  discrepancy: string; // what the current source says (for the PR body)
  source: string; // upstream URL the correction is grounded in
  sourceQuote: string; // exact sentence(s) from the source that justify the edit
}

// An edit that was actually applied to a file.
export interface AppliedEdit {
  path: string;
  severity: Severity;
  oldText: string;
  newText: string;
  discrepancy: string;
  source: string;
  sourceQuote: string;
}

export interface FreshnessReport {
  generatedAt: string;
  pagesScanned: number;
  findings: Finding[];
  // Checks that could not run (e.g. network unavailable for link/version).
  skipped: string[];
}
