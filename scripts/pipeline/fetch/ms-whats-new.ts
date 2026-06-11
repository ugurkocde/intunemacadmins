import {
  CONTENT_MAX_CHARS,
  EXCERPT_MAX_CHARS,
  MS_WHATS_NEW_PAGE_URL,
  MS_WHATS_NEW_RAW_URL,
  MS_WHATS_NEW_WINDOW_MONTHS,
} from "../config";
import { hashId } from "../state";
import { mentionsMacWord, normalizeWhitespace, truncate } from "../text";
import type { RawItem } from "../types";
import { fetchText } from "./http";

interface Feature {
  title: string;
  featureId: string | null;
  body: string;
  week: string;
  weekDate: Date;
  release: string | null;
  category: string;
}

// Fetches and parses the official "What's new in Microsoft Intune" markdown
// from MicrosoftDocs/memdocs. Structure: "## Week of <date> (Service release
// <n>)" -> "### <category>" -> "#### <feature title><!-- task id -->".
export async function fetchMsWhatsNew(now: Date): Promise<RawItem[]> {
  const markdown = await fetchText(MS_WHATS_NEW_RAW_URL);
  return parseMsWhatsNew(markdown, now);
}

export function parseMsWhatsNew(markdown: string, now: Date): RawItem[] {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - MS_WHATS_NEW_WINDOW_MONTHS);

  const features = extractFeatures(markdown, cutoff);
  const items: RawItem[] = [];
  for (const feature of features) {
    if (!isMacRelevant(feature)) continue;
    const id = hashId(
      `ms-whats-new:${feature.week}:${feature.featureId ?? slugify(feature.title)}`,
    );
    const body = normalizeWhitespace(feature.body);
    items.push({
      id,
      source: "ms-whats-new",
      sourceName: "Microsoft Learn",
      url: `${MS_WHATS_NEW_PAGE_URL}#${slugify(feature.title)}`,
      title: feature.title,
      publishedAt: feature.weekDate.toISOString(),
      excerpt: truncate(body, EXCERPT_MAX_CHARS),
      content: truncate(body, CONTENT_MAX_CHARS),
      meta: {
        week: feature.week,
        release: feature.release,
        categoryHeading: feature.category,
      },
    });
  }
  return items;
}

function extractFeatures(markdown: string, cutoff: Date): Feature[] {
  const lines = markdown.split("\n");
  const features: Feature[] = [];
  let week: string | null = null;
  let weekDate: Date | null = null;
  let release: string | null = null;
  let category = "";
  let current: { title: string; featureId: string | null; body: string[] } | null =
    null;

  const flush = () => {
    if (current && week && weekDate) {
      features.push({
        title: current.title,
        featureId: current.featureId,
        body: current.body.join("\n").trim(),
        week,
        weekDate,
        release,
        category,
      });
    }
    current = null;
  };

  for (const line of lines) {
    const weekMatch = line.match(
      /^##\s+Week of (.+?)(?:\s*\((?:Service release|service release)\s+(\d+)\))?\s*$/,
    );
    if (weekMatch) {
      flush();
      const parsed = new Date(weekMatch[1].trim());
      if (Number.isNaN(parsed.getTime()) || parsed < cutoff) {
        week = null;
        weekDate = null;
        release = null;
      } else {
        week = `Week of ${weekMatch[1].trim()}`;
        weekDate = parsed;
        release = weekMatch[2] ?? null;
      }
      category = "";
      continue;
    }
    if (/^##\s/.test(line)) {
      // A non-week H2 (e.g. "Notices", "In development") ends week parsing scope.
      flush();
      week = null;
      weekDate = null;
      release = null;
      category = "";
      continue;
    }
    const categoryMatch = line.match(/^###\s+(.+?)\s*$/);
    if (categoryMatch && !categoryMatch[1].startsWith("#")) {
      flush();
      category = categoryMatch[1].trim();
      continue;
    }
    const featureMatch = line.match(/^####\s+(.+?)\s*$/);
    if (featureMatch) {
      flush();
      const raw = featureMatch[1];
      const idMatch = raw.match(/<!--\s*([\w\s.,/-]+?)\s*-->/);
      const title = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
      current = { title, featureId: idMatch ? idMatch[1] : null, body: [] };
      continue;
    }
    if (current) current.body.push(line);
  }
  flush();
  return features;
}

function isMacRelevant(feature: Feature): boolean {
  const haystack = `${feature.title}\n${feature.body}`;
  if (/macos/i.test(haystack)) return true;
  return mentionsMacWord(haystack);
}

// Approximation of MS Learn heading anchors: lowercase, alphanumerics and
// hyphens, spaces to hyphens. A wrong anchor still lands on the right page.
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
