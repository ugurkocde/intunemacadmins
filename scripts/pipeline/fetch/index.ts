import type { RawItem, SourceError, StateFile } from "../types";
import { fetchCommunityBlogs } from "./community-blogs";
import { fetchMsWhatsNew } from "./ms-whats-new";
import { fetchReddit, fetchRedditViaRss, hasRedditCredentials } from "./reddit";
import { fetchTechCommunity } from "./tech-community";

export interface FetchResult {
  items: RawItem[];
  errors: SourceError[];
  skipped: string[];
}

type SourceFilter = "all" | "ms-whats-new" | "tech-community" | "community-blog" | "reddit";

// Runs all enabled fetchers; a failing source is reported, never fatal.
// Items already in state (published or rejected) are dropped here so the
// LLM stage only ever sees genuinely new items.
export async function fetchAllSources(
  state: StateFile,
  now: Date,
  sourceFilter: SourceFilter = "all",
): Promise<FetchResult> {
  const items: RawItem[] = [];
  const errors: SourceError[] = [];
  const skipped: string[] = [];
  const want = (s: SourceFilter) => sourceFilter === "all" || sourceFilter === s;

  if (want("ms-whats-new")) {
    try {
      items.push(...(await fetchMsWhatsNew(now)));
    } catch (error) {
      errors.push({ source: "ms-whats-new", error: message(error) });
    }
  }
  if (want("tech-community")) {
    const result = await fetchTechCommunity(now);
    items.push(...result.items);
    errors.push(...result.errors);
  }
  if (want("community-blog")) {
    const result = await fetchCommunityBlogs(now);
    items.push(...result.items);
    errors.push(...result.errors);
  }
  if (want("reddit")) {
    if (hasRedditCredentials()) {
      try {
        items.push(...(await fetchReddit(now)));
      } catch (error) {
        errors.push({ source: "reddit", error: message(error) });
      }
    } else {
      // Credential-free RSS mode. Reddit blocks many datacenter IPs, so a
      // failure here is expected in some environments and soft-skips instead
      // of raising a source error (no actionable issue to file).
      try {
        items.push(...(await fetchRedditViaRss(now)));
      } catch (error) {
        skipped.push(
          `reddit (public RSS unavailable from this network: ${message(error)}; ` +
            "configure REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET for the reliable OAuth mode)",
        );
      }
    }
  }

  // Dedup within the run (same URL can appear via two feeds) and against state.
  const seen = new Set<string>();
  const fresh = items.filter((item) => {
    if (seen.has(item.id) || state.items[item.id]) return false;
    seen.add(item.id);
    return true;
  });

  return { items: fresh, errors, skipped };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
