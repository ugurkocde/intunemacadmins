import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { STATE_FILE, STATE_RETENTION_MONTHS } from "./config";
import { StateFile } from "./types";

export function loadState(path: string = STATE_FILE): StateFile {
  if (!existsSync(path)) return { version: 1, items: {} };
  return StateFile.parse(JSON.parse(readFileSync(path, "utf8")));
}

// Stable serialization (sorted keys at every level) so reruns produce
// byte-identical files and PR diffs stay reviewable.
export function saveState(state: StateFile, path: string = STATE_FILE): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stableStringify(state) + "\n", "utf8");
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value), null, 2);
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

// Drop entries older than the retention window; feeds never resurface items
// that old, and past weekly pages are committed files that are never re-rendered.
export function pruneState(state: StateFile, now: Date): StateFile {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - STATE_RETENTION_MONTHS);
  const items: StateFile["items"] = {};
  for (const [id, item] of Object.entries(state.items)) {
    if (new Date(item.firstSeen) >= cutoff) items[id] = item;
  }
  return { version: 1, items };
}

export function hashId(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "source",
]);

export function canonicalUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";
    for (const param of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(param.toLowerCase())) url.searchParams.delete(param);
    }
    let result = url.toString();
    if (result.endsWith("/")) result = result.slice(0, -1);
    return result;
  } catch {
    return raw;
  }
}

export interface IsoWeek {
  year: number;
  week: number;
}

// ISO 8601 week numbering (week 1 contains the first Thursday of the year).
export function isoWeekOf(date: Date): IsoWeek {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + 4 - dayNumber);
  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: isoYear, week };
}

export function isoWeekString(w: IsoWeek): string {
  return `${w.year}-W${String(w.week).padStart(2, "0")}`;
}

export function quarterOf(w: IsoWeek): string {
  return `${w.year}-Q${Math.min(4, Math.ceil(w.week / 13))}`;
}

// Monday and Sunday (UTC) of a given ISO week, for page descriptions/labels.
export function isoWeekRange(w: IsoWeek): { start: Date; end: Date } {
  const jan4 = new Date(Date.UTC(w.year, 0, 4));
  const jan4Day = jan4.getUTCDay() === 0 ? 7 : jan4.getUTCDay();
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + (w.week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}
