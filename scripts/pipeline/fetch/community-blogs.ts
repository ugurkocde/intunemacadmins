import { readFileSync } from "node:fs";
import {
  CONTENT_MAX_CHARS,
  EXCERPT_MAX_CHARS,
  ITEM_WINDOW_DAYS,
  MACOS_KEYWORDS,
  SOURCES_FILE,
} from "../config";
import { canonicalUrl, hashId } from "../state";
import { matchesKeywords, mentionsMacWord, truncate } from "../text";
import type { RawItem, SourceError } from "../types";
import { fetchText } from "./http";
import { parseFeed } from "./rss";

interface BlogSource {
  name: string;
  url: string;
  enabled: boolean;
}

export function loadBlogSources(path: string = SOURCES_FILE): BlogSource[] {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as { blogs: BlogSource[] };
  return parsed.blogs.filter((b) => b.enabled);
}

// Community blogs from config/sources.json. One failing feed must not take
// down the others, so errors are collected per blog.
export async function fetchCommunityBlogs(
  now: Date,
): Promise<{ items: RawItem[]; errors: SourceError[] }> {
  const cutoff = new Date(now.getTime() - ITEM_WINDOW_DAYS * 86_400_000);
  const items: RawItem[] = [];
  const errors: SourceError[] = [];
  for (const blog of loadBlogSources()) {
    try {
      const xml = await fetchText(blog.url);
      for (const entry of parseFeed(xml)) {
        if (new Date(entry.publishedAt) < cutoff) continue;
        const haystack = `${entry.title}\n${entry.categories.join("\n")}\n${entry.text}`;
        if (!matchesKeywords(haystack, MACOS_KEYWORDS) && !mentionsMacWord(haystack)) {
          continue;
        }
        items.push({
          id: hashId(`url:${canonicalUrl(entry.url)}`),
          source: "community-blog",
          sourceName: blog.name,
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
        source: `blog:${blog.name}`,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { items, errors };
}
