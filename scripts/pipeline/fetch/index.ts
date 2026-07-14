import type { RawItem, SourceError, StateFile } from "../types";
import { fetchMsDefenderMacReleases } from "./ms-defender-macos";
import { fetchMsIntuneNotices } from "./ms-intune-notices";
import { fetchMsWhatsNew } from "./ms-whats-new";

export interface FetchResult {
  items: RawItem[];
  errors: SourceError[];
  skipped: string[];
}

// Fetches official, public sources with deterministic macOS filtering. A source
// failure is reported, never fatal.
// Items already in state (published or rejected) are dropped here so the
// LLM stage only ever sees genuinely new items.
export async function fetchAllSources(
  state: StateFile,
  now: Date,
): Promise<FetchResult> {
  const items: RawItem[] = [];
  const errors: SourceError[] = [];
  const skipped: string[] = [];
  const sources = [
    { name: "ms-whats-new", fetch: () => fetchMsWhatsNew(now) },
    { name: "ms-intune-notices", fetch: () => fetchMsIntuneNotices(now) },
    { name: "ms-defender-macos", fetch: () => fetchMsDefenderMacReleases(now) },
  ] as const;
  const results = await Promise.allSettled(sources.map((source) => source.fetch()));
  for (const [index, result] of results.entries()) {
    const source = sources[index];
    if (result.status === "fulfilled") {
      items.push(...result.value);
    } else {
      errors.push({ source: source.name, error: message(result.reason) });
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
