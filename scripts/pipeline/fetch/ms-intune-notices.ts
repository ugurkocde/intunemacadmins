import {
  CONTENT_MAX_CHARS,
  EXCERPT_MAX_CHARS,
  MS_INTUNE_NOTICES_RAW_URL,
  MS_WHATS_NEW_PAGE_URL,
} from "../config";
import { hashId } from "../state";
import { normalizeWhitespace, truncate } from "../text";
import type { RawItem } from "../types";
import { fetchText } from "./http";
import { slugify } from "./ms-whats-new";

interface Notice {
  title: string;
  body: string;
}

export async function fetchMsIntuneNotices(now: Date): Promise<RawItem[]> {
  const markdown = await fetchText(MS_INTUNE_NOTICES_RAW_URL);
  return parseMsIntuneNotices(markdown, now);
}

export function parseMsIntuneNotices(markdown: string, now: Date): RawItem[] {
  const publishedAt = parseFrontmatterDate(markdown) ?? now;
  return extractNotices(markdown)
    .filter((notice) => /\bmacOS\b/i.test(`${notice.title}\n${notice.body}`))
    .map((notice) => {
      const body = normalizeWhitespace(notice.body);
      return {
        id: hashId(`ms-intune-notices:${notice.title}:${body}`),
        source: "ms-intune-notices" as const,
        sourceName: "Microsoft Intune important notices",
        url: `${MS_WHATS_NEW_PAGE_URL}#${slugify(notice.title)}`,
        title: notice.title,
        publishedAt: publishedAt.toISOString(),
        excerpt: truncate(body, EXCERPT_MAX_CHARS),
        content: truncate(body, CONTENT_MAX_CHARS),
        meta: { notice: true, platform: "macOS" },
      };
    });
}

function extractNotices(markdown: string): Notice[] {
  const matches = [...markdown.matchAll(/^###\s+(.+?)\s*$/gm)];
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    return { title: match[1].trim(), body: markdown.slice(start, end).trim() };
  });
}

function parseFrontmatterDate(markdown: string): Date | null {
  const value = markdown.match(/^ms\.date:\s*(.+?)\s*$/m)?.[1];
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
