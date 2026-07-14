import {
  MS_DEFENDER_RELEASES_PAGE_URL,
  MS_WHATS_NEW_PAGE_URL,
  WHATS_NEW_RELEASE_GROUPS,
} from "../config";
import type { StateFile, StateItem } from "../types";
import { escapeMdx, mdLink, yamlString } from "./escape";

// Renders the macOS management updates page from state. Pure function of
// state, so reruns without new items produce byte-identical output.
export function renderWhatsNew(state: StateFile): string {
  const releasedIntune = Object.values(state.items).filter(
    (item): item is StateItem & { meta: Record<string, unknown> } =>
      item.status === "published" &&
      item.source === "ms-whats-new" &&
      Boolean(item.meta?.week),
  );
  const notices = publishedBySource(state, "ms-intune-notices");
  const defender = publishedBySource(state, "ms-defender-macos");

  const byWeek = new Map<string, typeof releasedIntune>();
  for (const entry of releasedIntune) {
    const week = String(entry.meta.week);
    if (!byWeek.has(week)) byWeek.set(week, []);
    byWeek.get(week)!.push(entry);
  }

  const weeks = [...byWeek.keys()]
    .sort((a, b) => weekDate(b) - weekDate(a))
    .slice(0, WHATS_NEW_RELEASE_GROUPS);

  const lines: string[] = [
    "---",
    `description: ${yamlString(
      "The released Microsoft changes and important notices that matter for macOS management, with links to the authoritative sources.",
    )}`,
    "generated: true",
    "---",
    "",
    "# What's New for macOS Management",
    "",
    `We track [released Microsoft Intune changes](${MS_WHATS_NEW_PAGE_URL}), important macOS notices, and substantive Microsoft Defender for Endpoint releases. Each entry links to the authoritative Microsoft source.`,
    "",
  ];

  renderSourceSection(
    lines,
    "Important macOS notices",
    "Actionable support, enrollment, and service changes that macOS administrators should prepare for.",
    notices,
  );
  renderSourceSection(
    lines,
    "Microsoft Defender for Endpoint for macOS",
    "Substantive security, management, and compatibility changes. Routine build-only updates are excluded.",
    defender,
  );

  if (weeks.length > 0) {
    lines.push("## Released Microsoft Intune updates", "");
  }

  if (weeks.length === 0 && notices.length === 0 && defender.length === 0) {
    lines.push(
      "No macOS-relevant updates to show here just yet. Check back soon.",
      "",
    );
  }

  for (const week of weeks) {
    const weekEntries = byWeek.get(week)!;
    const release = weekEntries.find((e) => e.meta.release)?.meta.release;
    const heading = release ? `${week} (Service release ${release})` : week;
    lines.push(`## ${escapeMdx(heading)}`, "");

    const byCategory = new Map<string, typeof weekEntries>();
    for (const entry of weekEntries) {
      const category = String(entry.meta.categoryHeading ?? "Other");
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category)!.push(entry);
    }

    for (const category of [...byCategory.keys()].sort()) {
      lines.push(`### ${escapeMdx(category)}`, "");
      for (const entry of byCategory.get(category)!) {
        const title = entry.title ?? "Untitled";
        const summary = entry.summary ?? "";
        const link = entry.url ? ` ${mdLink("Details", entry.url)}` : "";
        lines.push(`- **${escapeMdx(title)}** — ${escapeMdx(summary)}${link}`);
      }
      lines.push("");
    }
  }

  lines.push(
    "---",
    "",
    `Full source histories: [Microsoft Intune archive](https://learn.microsoft.com/en-us/intune/whats-new-archive) and [Microsoft Defender for Endpoint releases](${MS_DEFENDER_RELEASES_PAGE_URL}).`,
    "",
  );

  return lines.join("\n");
}

function publishedBySource(
  state: StateFile,
  source: "ms-intune-notices" | "ms-defender-macos",
): StateItem[] {
  return Object.values(state.items)
    .filter((item) => item.status === "published" && item.source === source)
    .sort((a, b) => itemTime(b) - itemTime(a));
}

function renderSourceSection(
  lines: string[],
  heading: string,
  intro: string,
  entries: StateItem[],
): void {
  if (entries.length === 0) return;
  lines.push(`## ${escapeMdx(heading)}`, "", intro, "");
  for (const entry of entries) {
    const title = entry.title ?? "Untitled";
    const summary = entry.summary ?? "";
    const link = entry.url ? ` ${mdLink("Details", entry.url)}` : "";
    lines.push(`- **${escapeMdx(title)}** — ${escapeMdx(summary)}${link}`);
  }
  lines.push("");
}

function itemTime(item: StateItem): number {
  const parsed = new Date(item.publishedAt ?? item.firstSeen);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function weekDate(week: string): number {
  const d = new Date(week.replace(/^Week of /, ""));
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}
