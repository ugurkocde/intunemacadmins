import { XMLParser } from "fast-xml-parser";
import { stripHtml, toIsoDate } from "../text";

export interface FeedItem {
  title: string;
  url: string;
  publishedAt: string;
  text: string;
  author?: string;
  categories: string[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (name) => ["item", "entry", "link", "category"].includes(name),
});

// Parses RSS 2.0 and Atom feeds into a normalized shape. Intentionally lenient:
// individual malformed entries are skipped, not fatal.
export function parseFeed(xml: string): FeedItem[] {
  const doc = parser.parse(xml);
  if (doc?.rss?.channel) return parseRssChannel(doc.rss.channel);
  if (doc?.feed) return parseAtomFeed(doc.feed);
  if (doc?.["rdf:RDF"]) return parseRssChannel(doc["rdf:RDF"]); // RSS 1.0
  throw new Error("Unrecognized feed format (neither RSS nor Atom)");
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  // Elements forced into arrays by the isArray option (e.g. RSS <link>).
  if (Array.isArray(value)) return value.length > 0 ? asText(value[0]) : "";
  if (typeof value === "object" && "#text" in (value as object)) {
    return asText((value as Record<string, unknown>)["#text"]);
  }
  return "";
}

function parseRssChannel(channel: Record<string, unknown>): FeedItem[] {
  const items = (channel.item as Record<string, unknown>[]) ?? [];
  const result: FeedItem[] = [];
  for (const item of items) {
    const url = asText(item.link).trim();
    const title = stripHtml(asText(item.title));
    const publishedAt = toIsoDate(
      asText(item.pubDate) || asText(item["dc:date"]) || asText(item.date),
    );
    if (!url || !title || !publishedAt) continue;
    const html =
      asText(item["content:encoded"]) || asText(item.description) || "";
    const categories = ((item.category as unknown[]) ?? [])
      .map((c) => asText(c).trim())
      .filter(Boolean);
    result.push({
      title,
      url,
      publishedAt,
      text: stripHtml(html),
      author:
        asText(item["dc:creator"]).trim() || asText(item.author).trim() || undefined,
      categories,
    });
  }
  return result;
}

function parseAtomFeed(feed: Record<string, unknown>): FeedItem[] {
  const entries = (feed.entry as Record<string, unknown>[]) ?? [];
  const result: FeedItem[] = [];
  for (const entry of entries) {
    const links = (entry.link as Record<string, unknown>[]) ?? [];
    const alternate =
      links.find((l) => l["@_rel"] === "alternate" || !l["@_rel"]) ?? links[0];
    const url = asText(alternate?.["@_href"]).trim();
    const title = stripHtml(asText(entry.title));
    const publishedAt = toIsoDate(
      asText(entry.published) || asText(entry.updated),
    );
    if (!url || !title || !publishedAt) continue;
    const html = asText(entry.content) || asText(entry.summary) || "";
    const author = entry.author as Record<string, unknown> | undefined;
    const categories = ((entry.category as Record<string, unknown>[]) ?? [])
      .map((c) => asText(c["@_term"]).trim())
      .filter(Boolean);
    result.push({
      title,
      url,
      publishedAt,
      text: stripHtml(html),
      author: author ? asText(author.name).trim() || undefined : undefined,
      categories,
    });
  }
  return result;
}
