import {
  isoWeekRange,
  isoWeekString,
  quarterOf,
  type IsoWeek,
} from "../state";
import type { SourceType, StateFile, StateItem } from "../types";
import { escapeMdx, mdLink, yamlString } from "./escape";

const SECTION_ORDER: Array<{ source: SourceType; heading: string }> = [
  { source: "tech-community", heading: "Microsoft announcements" },
  { source: "community-blog", heading: "Community blog posts" },
  { source: "reddit", heading: "Reddit highlights" },
];

export interface PulsePage {
  relPath: string; // relative to the Community Pulse content dir
  content: string;
}

// Renders one weekly digest page from state. Returns null when the week has
// no community items (the page is simply not created that week).
export function renderPulseWeek(state: StateFile, week: IsoWeek): PulsePage | null {
  const weekStr = isoWeekString(week);
  const items = Object.values(state.items).filter(
    (item) =>
      item.status === "published" &&
      item.week === weekStr &&
      item.source !== "ms-whats-new",
  );
  const msCount = Object.values(state.items).filter(
    (item) =>
      item.status === "published" &&
      item.week === weekStr &&
      item.source === "ms-whats-new",
  ).length;

  if (items.length === 0 && msCount === 0) return null;

  const range = isoWeekRange(week);
  const rangeFull = formatRange(range.start, range.end);
  const counts = [
    items.length === 1 ? "1 community item" : `${items.length} community items`,
    msCount > 0 ? `${msCount} Intune release-note ${msCount === 1 ? "entry" : "entries"}` : null,
  ]
    .filter(Boolean)
    .join(" and ");

  const lines: string[] = [
    "---",
    `description: ${yamlString(
      `macOS and Intune community highlights for ${rangeFull}: ${counts}.`,
    )}`,
    "generated: true",
    "---",
    "",
    `# ${rangeFull}`,
    "",
    `A roundup of what stood out across the macOS and Intune community for **${rangeFull}** — updates from Microsoft, posts from community blogs, and discussions worth a look. Follow each link for the full story.`,
    "",
  ];

  if (msCount > 0) {
    lines.push(
      `{% hint style="info" %}`,
      `Microsoft published ${msCount} new macOS-relevant release-note ${msCount === 1 ? "entry" : "entries"} this week. See [What's New in Intune](../../home/whats-new.md) for the summaries.`,
      `{% endhint %}`,
      "",
    );
  }

  for (const section of SECTION_ORDER) {
    const sectionItems = items
      .filter((item) => item.source === section.source)
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
    if (sectionItems.length === 0) continue;
    lines.push(`## ${section.heading}`, "");
    for (const item of sectionItems) {
      lines.push(...renderItem(item));
    }
  }

  return {
    relPath: `${quarterOf(week).toLowerCase()}/${weekStr.toLowerCase()}.md`,
    content: lines.join("\n"),
  };
}

// Short human label for a week, used in SUMMARY.md nav entries (e.g. "Jun 8 - 14").
export function pulseWeekLabel(week: IsoWeek): string {
  const range = isoWeekRange(week);
  return formatRange(range.start, range.end, true);
}

function renderItem(item: StateItem): string[] {
  const title = item.title ?? "Untitled";
  const url = item.url ?? "";
  const heading = `### ${mdLink(title, url)}`;
  const metaParts: string[] = [];
  if (item.sourceName) metaParts.push(escapeMdx(item.sourceName));
  if (item.author) metaParts.push(escapeMdx(item.author));
  if (item.publishedAt) metaParts.push(formatDate(new Date(item.publishedAt)));
  if (item.source === "reddit" && item.meta) {
    const score = item.meta.score;
    const comments = item.meta.comments;
    if (typeof score === "number") metaParts.push(`${score} upvotes`);
    if (typeof comments === "number") metaParts.push(`${comments} comments`);
  }
  const lines = [heading, ""];
  if (metaParts.length > 0) {
    lines.push(`<small>${metaParts.join(" · ")}</small>`, "");
  }
  if (item.summary) lines.push(escapeMdx(item.summary), "");
  if (item.tags && item.tags.length > 0) {
    lines.push(`<small>Tags: ${item.tags.map(escapeMdx).join(", ")}</small>`, "");
  }
  return lines;
}

// The section landing page, regenerated each run to point at the latest week.
export function renderPulseIndex(latestWeek: IsoWeek | null): string {
  const lines: string[] = [
    "---",
    `description: ${yamlString(
      "A weekly roundup of macOS and Intune news from Microsoft, community blogs, and Reddit.",
    )}`,
    "generated: true",
    "---",
    "",
    "# Community Pulse",
    "",
    "Each week we round up what's happening across macOS management with Microsoft Intune:",
    "",
    "- **Microsoft announcements** from the Intune blogs on Tech Community",
    "- **Community blog posts** from macOS admins across the community",
    "- **Reddit highlights** from r/Intune and r/macsysadmin",
    "",
    "Every item links back to its original source, so you can always go straight to the full story.",
    "",
  ];
  if (latestWeek) {
    const weekStr = isoWeekString(latestWeek);
    const range = isoWeekRange(latestWeek);
    const label = formatRange(range.start, range.end);
    lines.push(
      `Start with the latest roundup: [${label}](./${quarterOf(latestWeek).toLowerCase()}/${weekStr.toLowerCase()}.md).`,
      "",
    );
  }
  lines.push(
    "## Suggest a blog",
    "",
    "Want your blog featured in the weekly roundup? [Open an issue or pull request](https://github.com/ugurkocde/intunemacadmins) and we'll add it.",
    "",
  );
  return lines.join("\n");
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function monthName(date: Date, short: boolean): string {
  return date.toLocaleDateString("en-US", {
    month: short ? "short" : "long",
    timeZone: "UTC",
  });
}

// Human date range for titles and sidebar labels, e.g. "June 8 - 14, 2026",
// "June 29 - July 5, 2026", or "December 29, 2025 - January 4, 2026".
// short=true drops the year for compact sidebar labels ("Jun 8 - 14").
function formatRange(start: Date, end: Date, short = false): string {
  const sMonth = monthName(start, short);
  const eMonth = monthName(end, short);
  const sDay = start.getUTCDate();
  const eDay = end.getUTCDate();
  const sYear = start.getUTCFullYear();
  const eYear = end.getUTCFullYear();
  if (sYear !== eYear) {
    return `${sMonth} ${sDay}, ${sYear} - ${eMonth} ${eDay}, ${eYear}`;
  }
  const yearSuffix = short ? "" : `, ${sYear}`;
  if (sMonth === eMonth) {
    return `${sMonth} ${sDay} - ${eDay}${yearSuffix}`;
  }
  return `${sMonth} ${sDay} - ${eMonth} ${eDay}${yearSuffix}`;
}
