import type { RawItem, SourceError, StateFile } from "../types";
import { fetchMsWhatsNew } from "./ms-whats-new";

export interface FetchResult {
  items: RawItem[];
  errors: SourceError[];
  skipped: string[];
}

// Fetches the official Intune release notes. A source failure is reported, never fatal.
// Items already in state (published or rejected) are dropped here so the
// LLM stage only ever sees genuinely new items.
export async function fetchAllSources(
  state: StateFile,
  now: Date,
): Promise<FetchResult> {
  const items: RawItem[] = [];
  const errors: SourceError[] = [];
  const skipped: string[] = [];
  try {
    items.push(...(await fetchMsWhatsNew(now)));
  } catch (error) {
    errors.push({ source: "ms-whats-new", error: message(error) });
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
