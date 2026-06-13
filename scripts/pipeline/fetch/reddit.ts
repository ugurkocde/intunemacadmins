import {
  CONTENT_MAX_CHARS,
  EXCERPT_MAX_CHARS,
  ITEM_WINDOW_DAYS,
  REDDIT_MIN_SCORE,
  REDDIT_RSS_BACKOFF_MS,
  REDDIT_RSS_FEED_GAP_MS,
  REDDIT_RSS_HEADERS,
  REDDIT_RSS_SEARCHES,
  REDDIT_SEARCHES,
  REDDIT_TOKEN_URL,
  USER_AGENT,
} from "../config";
import { canonicalUrl, hashId } from "../state";
import { normalizeWhitespace, truncate } from "../text";
import type { RawItem } from "../types";
import { fetchJson, fetchText, fetchWithRetry, sleep } from "./http";
import { parseFeed } from "./rss";

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

// Credential-free, no-login access to Reddit's public search.rss feeds (Atom).
// Reddit returns 429 to bot/automation User-Agents but serves the public RSS
// fine to a normal browser UA - so we send one here (and only here). No score
// data, so the LLM classifier is the only quality gate; the reused feed parser
// handles the rest. Reddit ends each post body with a "submitted by /u/author
// [link] [comments]" boilerplate, removed below.
export async function fetchRedditViaRss(now: Date): Promise<RawItem[]> {
  const cutoff = new Date(now.getTime() - ITEM_WINDOW_DAYS * 86_400_000);
  const items: RawItem[] = [];
  const seen = new Set<string>();
  const failures: string[] = [];

  for (let f = 0; f < REDDIT_RSS_SEARCHES.length; f++) {
    const search = REDDIT_RSS_SEARCHES[f];
    // Space requests out: Reddit rate-limits bursts even with a browser UA.
    if (f > 0) await sleep(REDDIT_RSS_FEED_GAP_MS);
    try {
      const xml = await fetchText(search.url, {
        headers: REDDIT_RSS_HEADERS,
        retries: REDDIT_RSS_BACKOFF_MS.length,
        backoffMs: REDDIT_RSS_BACKOFF_MS,
      });
      for (const entry of parseFeed(xml)) {
        if (new Date(entry.publishedAt) < cutoff) continue;
        const id = hashId(`url:${canonicalUrl(entry.url)}`);
        if (seen.has(id)) continue;
        seen.add(id);
        const body = entry.text
          .replace(/\s*submitted by\s+\/u\/\S+[\s\S]*$/i, "")
          .trim();
        items.push({
          id,
          source: "reddit",
          sourceName: search.sourceName,
          url: entry.url,
          title: entry.title,
          author: entry.author ? entry.author.replace(/^\//, "") : undefined,
          publishedAt: entry.publishedAt,
          excerpt: truncate(body, EXCERPT_MAX_CHARS),
          content: truncate(body, CONTENT_MAX_CHARS),
          meta: { via: "rss" },
        });
      }
    } catch (error) {
      // Isolate per feed: a 429 on one subreddit must not discard the others.
      failures.push(
        `${search.sourceName}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Only treat the source as failed (-> soft skip) if every feed failed.
  if (items.length === 0 && failures.length === REDDIT_RSS_SEARCHES.length) {
    throw new Error(failures.join("; "));
  }
  if (failures.length > 0) {
    console.error(`  reddit: ${failures.length} feed(s) rate-limited this run: ${failures.join("; ")}`);
  }
  return items;
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
