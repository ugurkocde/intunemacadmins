import {
  CONTENT_MAX_CHARS,
  EXCERPT_MAX_CHARS,
  ITEM_WINDOW_DAYS,
  MACOS_KEYWORDS,
  TECH_COMMUNITY_FEEDS,
} from "../config";
import { canonicalUrl, hashId } from "../state";
import { matchesKeywords, mentionsMacWord, truncate } from "../text";
import type { RawItem, SourceError } from "../types";
import { fetchText } from "./http";
import { parseFeed } from "./rss";

// Microsoft Tech Community Intune boards via their Khoros RSS bridge.
// The feed carries the full post HTML, so no per-post page fetch is needed.
// Each board is isolated: one failing feed must not silence the other.
export async function fetchTechCommunity(
  now: Date,
): Promise<{ items: RawItem[]; errors: SourceError[] }> {
  const cutoff = new Date(now.getTime() - ITEM_WINDOW_DAYS * 86_400_000);
  const items: RawItem[] = [];
  const errors: SourceError[] = [];
  for (const feed of TECH_COMMUNITY_FEEDS) {
    try {
      const xml = await fetchText(feed.url);
      for (const entry of parseFeed(xml)) {
        if (new Date(entry.publishedAt) < cutoff) continue;
        const haystack = `${entry.title}\n${entry.text}`;
        if (!matchesKeywords(haystack, MACOS_KEYWORDS) && !mentionsMacWord(haystack)) {
          continue;
        }
        items.push({
          id: hashId(`url:${canonicalUrl(entry.url)}`),
          source: "tech-community",
          sourceName: feed.name,
          url: entry.url,
          title: entry.title,
          author: entry.author,
          publishedAt: entry.publishedAt,
          excerpt: truncate(entry.text, EXCERPT_MAX_CHARS),
          content: truncate(entry.text, CONTENT_MAX_CHARS),
          meta: { categories: entry.categories },
        });
      }
    } catch (error) {
      errors.push({
        source: `tech-community:${feed.name}`,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { items, errors };
}
