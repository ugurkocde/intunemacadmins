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
}

export interface FreshnessReport {
  generatedAt: string;
  pagesScanned: number;
  findings: Finding[];
  // Checks that could not run (e.g. network unavailable for link/version).
  skipped: string[];
}
