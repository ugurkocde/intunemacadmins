import {
  CONTENT_MAX_CHARS,
  EXCERPT_MAX_CHARS,
  MS_DEFENDER_RELEASES_PAGE_URL,
  MS_DEFENDER_RELEASES_RAW_URL,
  MS_DEFENDER_WINDOW_MONTHS,
} from "../config";
import { hashId } from "../state";
import { normalizeWhitespace, truncate } from "../text";
import type { RawItem } from "../types";
import { fetchText } from "./http";
import { slugify } from "./ms-whats-new";

interface MacRelease {
  heading: string;
  build: string;
  releasedAt: Date;
  updates: string;
}

export async function fetchMsDefenderMacReleases(now: Date): Promise<RawItem[]> {
  const markdown = await fetchText(MS_DEFENDER_RELEASES_RAW_URL);
  return parseMsDefenderMacReleases(markdown, now);
}

export function parseMsDefenderMacReleases(markdown: string, now: Date): RawItem[] {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - MS_DEFENDER_WINDOW_MONTHS);

  return extractMacReleases(markdown)
    .filter((release) => release.releasedAt >= cutoff && isSubstantive(release.updates))
    .map((release) => {
      const updates = normalizeMarkdownTable(release.updates);
      return {
        id: hashId(`ms-defender-macos:${release.heading}:${updates}`),
        source: "ms-defender-macos" as const,
        sourceName: "Microsoft Defender for Endpoint release notes",
        url: `${MS_DEFENDER_RELEASES_PAGE_URL}#${slugify(release.heading)}`,
        title: `Microsoft Defender for Endpoint ${release.build} for macOS`,
        publishedAt: release.releasedAt.toISOString(),
        excerpt: truncate(updates, EXCERPT_MAX_CHARS),
        content: truncate(updates, CONTENT_MAX_CHARS),
        meta: { platform: "macOS", build: release.build },
      };
    });
}

function extractMacReleases(markdown: string): MacRelease[] {
  const start = markdown.indexOf("## macOS releases");
  if (start < 0) return [];
  const end = markdown.indexOf("## macOS known issues", start);
  const scope = markdown.slice(start, end < 0 ? markdown.length : end);
  const matches = [...scope.matchAll(/^###\s+(macOS\s*\|\s*.+?)\s*$/gm)];
  const releases: MacRelease[] = [];

  for (const [index, match] of matches.entries()) {
    const heading = match[1].trim();
    const sectionStart = (match.index ?? 0) + match[0].length;
    const sectionEnd = matches[index + 1]?.index ?? scope.length;
    const section = scope.slice(sectionStart, sectionEnd);
    const updates = section.match(
      /^####\s+Enhancements and features\s*$([\s\S]*?)(?=^#{2,4}\s|(?![\s\S]))/m,
    )?.[1];
    const releasedAt = parseReleaseMonth(heading);
    const build = heading.split("|").at(-1)?.replace(/^\s*(?:Platform:\s*)?/, "").trim();
    if (updates && releasedAt && build) {
      releases.push({ heading, build, releasedAt, updates: updates.trim() });
    }
  }
  return releases;
}

function parseReleaseMonth(heading: string): Date | null {
  const match = heading.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)[ -](\d{4})\b/i,
  );
  if (!match) return null;
  const parsed = new Date(`${match[1]} 1, ${match[2]} 00:00:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSubstantive(markdown: string): boolean {
  const value = normalizeMarkdownTable(markdown)
    .toLowerCase()
    .replace(/[.!]/g, "")
    .trim();
  return ![
    "bug fixes",
    "general: bug fixes",
    "bug and performance fixes",
    "general: bug and performance fixes",
    "performance improvement and bug fixes",
    "general: performance improvement and bug fixes",
    "security and critical updates",
    "general: security and critical updates",
  ].includes(value);
}

function normalizeMarkdownTable(markdown: string): string {
  const rows = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^\|?\s*[-:]+(?:\s*\|\s*[-:]+)+\s*\|?$/.test(line));
  if (rows.length >= 2 && /feature area/i.test(rows[0]) && /update summary/i.test(rows[0])) {
    rows.shift();
  }
  return normalizeWhitespace(
    rows
      .map((line) => {
        if (!line.startsWith("|")) return line;
        const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
        return cells.length > 1 ? `${cells[0]}: ${cells.slice(1).join(" ")}` : cells[0];
      })
      .join("\n")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
  );
}
