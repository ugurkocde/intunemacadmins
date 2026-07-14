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

// Drop entries older than the retention window; release notes never resurface
// items that old.
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
