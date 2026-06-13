// Plain-text helpers shared by the fetch layer.

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

// Good-enough HTML-to-text for feed bodies: drops script/style blocks, turns
// block boundaries into newlines, strips remaining tags, decodes entities.
export function stripHtml(html: string): string {
  const withoutBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const withBreaks = withoutBlocks
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote|pre)>/gi, "\n")
    .replace(/<(br|hr)\s*\/?>/gi, "\n");
  const text = withBreaks.replace(/<[^>]+>/g, " ");
  return normalizeWhitespace(decodeEntities(text));
}

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + "…";
}

export function matchesKeywords(text: string, keywords: string[]): boolean {
  const haystack = text.toLowerCase();
  return keywords.some((k) => haystack.includes(k));
}

// "Mac" as a word (case-sensitive) without matching "MAC address" style
// all-caps usage; combined with the lowercase keyword list by callers.
export function mentionsMacWord(text: string): boolean {
  return /\bMacs?\b/.test(text);
}

export function toIsoDate(value: string | number | Date): string | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
