import {
  CONTENT_MAX_CHARS,
  EXCERPT_MAX_CHARS,
  ITEM_WINDOW_DAYS,
  REDDIT_MIN_SCORE,
  REDDIT_SEARCHES,
  REDDIT_TOKEN_URL,
  USER_AGENT,
} from "../config";
import { canonicalUrl, hashId } from "../state";
import { normalizeWhitespace, truncate } from "../text";
import type { RawItem } from "../types";
import { fetchJson, fetchWithRetry } from "./http";

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    permalink: string;
    created_utc: number;
    score: number;
    num_comments: number;
    link_flair_text: string | null;
    stickied: boolean;
    over_18: boolean;
  };
}

export function hasRedditCredentials(): boolean {
  return Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  const basic = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`,
  ).toString("base64");
  const response = await fetchWithRetry(REDDIT_TOKEN_URL, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
  });
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Reddit token response missing access_token");
  return data.access_token;
}

// Reddit search via the OAuth API (script app, client_credentials grant).
// Quality gate: minimum score, no stickies, no NSFW, recency window.
export async function fetchReddit(now: Date): Promise<RawItem[]> {
  const token = await getAccessToken();
  const cutoff = now.getTime() / 1000 - ITEM_WINDOW_DAYS * 86_400;
  const items: RawItem[] = [];
  const seen = new Set<string>();
  for (const search of REDDIT_SEARCHES) {
    const data = await fetchJson<{ data?: { children?: RedditPost[] } }>(
      search.url,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": USER_AGENT,
        },
      },
    );
    for (const post of data.data?.children ?? []) {
      const p = post.data;
      if (p.created_utc < cutoff) continue;
      if (p.score < REDDIT_MIN_SCORE) continue;
      if (p.stickied || p.over_18) continue;
      const url = `https://www.reddit.com${p.permalink}`;
      const id = hashId(`url:${canonicalUrl(url)}`);
      if (seen.has(id)) continue;
      seen.add(id);
      const body = normalizeWhitespace(p.selftext ?? "");
      items.push({
        id,
        source: "reddit",
        sourceName: search.sourceName,
        url,
        title: p.title,
        author: p.author ? `u/${p.author}` : undefined,
        publishedAt: new Date(p.created_utc * 1000).toISOString(),
        excerpt: truncate(body, EXCERPT_MAX_CHARS),
        content: truncate(body, CONTENT_MAX_CHARS),
        meta: {
          score: p.score,
          comments: p.num_comments,
          flair: p.link_flair_text,
        },
      });
    }
  }
  return items;
}
