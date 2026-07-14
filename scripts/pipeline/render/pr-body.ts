import type { RunReport } from "../types";

const SOURCE_LABELS: Record<string, string> = {
  "ms-whats-new": "Intune release notes (Microsoft Learn)",
};

// PR body for the weekly content PR. Plain markdown, no AI attribution.
export function renderPrBody(report: RunReport): string {
  const lines: string[] = [
    "Automated update from the Microsoft Intune release notes.",
    "",
    `- Items fetched: ${report.fetched} (${report.newItems} new)`,
    `- Passed relevance filter: ${report.classifiedRelevant}`,
    `- Filtered out: ${report.classifiedRejected}`,
    "",
  ];

  if (report.published.length > 0) {
    lines.push("## New items in this update", "");
    const bySource = new Map<string, typeof report.published>();
    for (const item of report.published) {
      if (!bySource.has(item.source)) bySource.set(item.source, []);
      bySource.get(item.source)!.push(item);
    }
    for (const [source, items] of bySource) {
      lines.push(`### ${SOURCE_LABELS[source] ?? source} (${items.length})`, "");
      for (const item of items) {
        lines.push(`- [${item.title.replace(/[[\]]/g, "")}](${item.url})`);
      }
      lines.push("");
    }
  } else {
    lines.push("No new items passed the filters this week.", "");
  }

  if (report.contentUpdates.length > 0) {
    lines.push("## Documentation integrated", "");
    for (const update of report.contentUpdates) {
      const verb = update.action === "update-existing" ? "Updated" : "Created";
      lines.push(`- ${verb} \`${update.path}\`: ${update.title}`);
    }
    lines.push("");
  }

  if (report.integrationSkipped.length > 0) {
    lines.push("## Items kept on What's New only", "");
    for (const skipped of report.integrationSkipped) lines.push(`- ${skipped}`);
    lines.push("");
  }

  if (report.skippedSources.length > 0) {
    lines.push("## Skipped sources", "");
    for (const skipped of report.skippedSources) lines.push(`- ${skipped}`);
    lines.push("");
  }

  if (report.sourceErrors.length > 0) {
    lines.push("## Source errors (content from these sources may be missing)", "");
    for (const error of report.sourceErrors) {
      lines.push(`- **${error.source}**: ${error.error}`);
    }
    lines.push("");
  }

  if (report.llmFailures > 0) {
    lines.push(
      `${report.llmFailures} item(s) failed LLM processing and will be retried on the next run.`,
      "",
    );
  }

  lines.push(
    "---",
    "",
    "Review checklist:",
    "",
    "- [ ] Summaries are accurate and neutral",
    "- [ ] No irrelevant or low-quality items slipped through",
    "- [ ] Vercel preview renders correctly",
  );

  return lines.join("\n");
}
