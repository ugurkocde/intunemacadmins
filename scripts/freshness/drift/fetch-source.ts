import { stripHtml, truncate } from "../../pipeline/text";
import { HTTP_TIMEOUT_MS, USER_AGENT } from "../config";
import { SOURCE_TEXT_MAX_CHARS } from "./config";

export interface SourceText {
  url: string;
  text: string;
}

// Fetches a source over plain HTTPS (CI-safe, no MCP). Microsoft Learn and
// Apple docs are server-rendered, so the article lives in the initial HTML;
// we extract <main> and strip to text. A .json source (e.g. OpenIntuneBaseline)
// is returned as compact JSON for the model to diff against.
export async function fetchSourceText(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SourceText> {
  const res = await fetchImpl(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  const isJson =
    /\.json($|\?)/i.test(url) ||
    (res.headers.get("content-type") ?? "").includes("application/json");

  if (isJson) {
    const json = await res.json();
    return { url, text: truncate(JSON.stringify(json), SOURCE_TEXT_MAX_CHARS) };
  }

  const html = await res.text();
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const text = stripHtml(main ? main[1] : html);
  return { url, text: truncate(text, SOURCE_TEXT_MAX_CHARS) };
}
