import type { AppliedEdit } from "../types";

const SEVERITY_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

// PR body for drafted page corrections. Every edit shows the exact before/after
// and the upstream source it's grounded in, so review is a fact-check against
// the cited doc - not a re-read of the whole page.
export function renderEditsPrBody(applied: AppliedEdit[]): string {
  const lines: string[] = [
    "Drafted corrections to existing pages where their content had drifted from the current Microsoft/Apple documentation.",
    "",
    `**${applied.length} edit(s) across ${new Set(applied.map((e) => e.path)).size} page(s).**`,
    "",
    "Each edit is a minimal, verbatim text replacement grounded in the cited source. Review each against its source link, then merge. **Set `lastReviewed` on a page once you've verified it** (that also clears it from the freshness backlog).",
    "",
  ];

  const byPage = new Map<string, AppliedEdit[]>();
  for (const e of applied) {
    if (!byPage.has(e.path)) byPage.set(e.path, []);
    byPage.get(e.path)!.push(e);
  }

  for (const [page, edits] of [...byPage.entries()].sort()) {
    lines.push(`### \`${page}\``, "");
    for (const e of edits) {
      lines.push(`- **${SEVERITY_LABEL[e.severity] ?? e.severity}** — ${e.discrepancy}`);
      lines.push(`  - Source: ${e.source}`);
      lines.push("  - Before:");
      lines.push("    ```");
      lines.push(...e.oldText.split("\n").map((l) => "    " + l));
      lines.push("    ```");
      lines.push("  - After:");
      lines.push("    ```");
      lines.push(...e.newText.split("\n").map((l) => "    " + l));
      lines.push("    ```");
    }
    lines.push("");
  }

  lines.push(
    "---",
    "",
    "These edits were drafted from the live upstream docs and are unmerged for your review. Reject any you disagree with by editing the file in this PR.",
  );
  return lines.join("\n");
}
