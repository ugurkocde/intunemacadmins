import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const CHANGELOG_FILE = "content/changelog.md";
export const CHANGELOG_MARKER = "<!-- changelog:entries -->";

export interface ChangelogLink {
  label: string;
  url: string;
}

export interface ChangelogEntry {
  id: string;
  kind: "Content update" | "Documentation correction" | "Site update";
  title: string;
  summary: string;
  pages: ChangelogLink[];
  sources: ChangelogLink[];
}

export function prependChangelogEntries(
  entries: ChangelogEntry[],
  now: Date,
  outputRoot = ".",
): number {
  const source = readFileSync(CHANGELOG_FILE, "utf8");
  const { content, inserted } = insertChangelogEntries(source, entries, now);
  if (inserted === 0) return 0;

  const output = outputRoot === "." ? CHANGELOG_FILE : join(outputRoot, CHANGELOG_FILE);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, content, "utf8");
  return inserted;
}

export function insertChangelogEntries(
  source: string,
  entries: ChangelogEntry[],
  now: Date,
): { content: string; inserted: number } {
  if (!source.includes(CHANGELOG_MARKER)) {
    throw new Error(`${CHANGELOG_FILE} is missing ${CHANGELOG_MARKER}`);
  }

  const seen = new Set<string>();
  const fresh = entries.filter((entry) => {
    const comment = entryComment(entry.id);
    if (seen.has(comment) || source.includes(comment)) return false;
    seen.add(comment);
    return true;
  });
  if (fresh.length === 0) return { content: source, inserted: 0 };

  const dateHeading = `## ${formatDate(now)}`;
  const rendered = fresh.map(renderEntry).join("\n\n---\n\n");
  const markerAt = source.indexOf(CHANGELOG_MARKER);
  const markerEnd = markerAt + CHANGELOG_MARKER.length;
  const remainder = source.slice(markerEnd);
  const sameDatePrefix = `\n\n${dateHeading}\n`;

  let updated: string;
  if (remainder.startsWith(sameDatePrefix)) {
    const headingEnd = markerEnd + sameDatePrefix.length;
    updated = `${source.slice(0, headingEnd)}\n${rendered}\n\n---${source.slice(headingEnd)}`;
  } else {
    updated = `${source.slice(0, markerEnd)}\n\n${dateHeading}\n\n${rendered}\n\n${remainder.replace(/^\s*/, "")}`;
  }

  return { content: `${updated.trimEnd()}\n`, inserted: fresh.length };
}

export function changelogEntryId(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function docPath(path: string): string {
  return path.replace(/^\.\//, "").replace(/^content\//, "");
}

function renderEntry(entry: ChangelogEntry): string {
  const pages = uniqueLinks(entry.pages).map(renderLink).join(", ");
  const sourceLinks = uniqueLinks(entry.sources);
  const sources = sourceLinks.map(renderLink).join(", ");
  return [
    entryComment(entry.id),
    `### ${inlineText(entry.title)}`,
    "",
    `**${entry.kind}** · ${entry.kind === "Site update" ? "Maintainer published" : "Automatically published"}`,
    "",
    inlineText(entry.summary),
    "",
    `- **Published to:** ${pages}`,
    `- **Source${sourceLinks.length === 1 ? "" : "s"}:** ${sources}`,
  ].join("\n");
}

function renderLink(link: ChangelogLink): string {
  return `[${inlineText(link.label)}](${link.url})`;
}

function uniqueLinks(links: ChangelogLink[]): ChangelogLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
}

function entryComment(id: string): string {
  return `<!-- changelog-entry:${changelogEntryId(id)} -->`;
}

function inlineText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/([`*_[\]<>])/g, "\\$1");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
