// MDX injection defense: every piece of fetched or model-generated text that
// lands in a generated page goes through escapeMdx, URLs only ever come from
// the fetch layer and go through safeUrl, and frontmatter strings are JSON
// (valid YAML) via yamlString.

const CHAR_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "{": "&#123;",
  "}": "&#125;",
  "*": "\\*",
  "_": "\\_",
  "[": "\\[",
  "]": "\\]",
  "`": "\\`",
  "~": "\\~",
  "\\": "\\\\",
  "|": "\\|",
};

// Single pass so already-escaped output is never double-escaped by accident.
export function escapeMdx(text: string): string {
  let out = "";
  for (const ch of text) {
    out += CHAR_MAP[ch] ?? ch;
  }
  return out;
}

export function yamlString(value: string): string {
  return JSON.stringify(value);
}

// Only http(s) URLs are allowed; characters that would break out of a
// markdown link target are percent-encoded.
export function safeUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  // encodeURIComponent leaves ( ) untouched, so percent-encode explicitly;
  // unencoded parens and angle brackets break out of markdown link targets.
  return parsed
    .toString()
    .replace(/[()<> ]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}

export function mdLink(label: string, url: string): string {
  const safe = safeUrl(url);
  if (!safe) return escapeMdx(label);
  return `[${escapeMdx(label)}](${safe})`;
}
