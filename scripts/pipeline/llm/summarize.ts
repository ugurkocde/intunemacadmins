import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { SUMMARIZE_MODEL, SUMMARY_MAX_CHARS } from "../config";
import { sleep } from "../fetch/http";
import { truncate } from "../text";
import type { PublishedItem } from "../types";
import { ItemSummary } from "../types";
import type { ClassifiedItem } from "./classify";
import { getClient } from "./client";
import { SUMMARIZE_SYSTEM } from "./prompts";

export interface SummarizeResult {
  published: PublishedItem[];
  failures: number;
}

// Stage 2: per-item summaries for everything that passed the relevance gate.
// Model output is sanitized defensively: URLs and markdown link syntax are
// stripped even though the prompt forbids them, and length is capped.
export async function summarizeItems(
  relevant: ClassifiedItem[],
): Promise<SummarizeResult> {
  const client = getClient();
  const published: PublishedItem[] = [];
  let failures = 0;

  for (const { item, category } of relevant) {
    try {
      const response = await client.messages.parse({
        model: SUMMARIZE_MODEL,
        max_tokens: 1500,
        system: SUMMARIZE_SYSTEM,
        messages: [
          {
            role: "user",
            content: JSON.stringify(
              {
                source: item.source,
                sourceName: item.sourceName,
                title: item.title,
                author: item.author ?? null,
                text: item.content,
              },
              null,
              2,
            ),
          },
        ],
        output_config: { format: zodOutputFormat(ItemSummary) },
      });
      const parsed = response.parsed_output;
      if (!parsed) throw new Error("summary returned no parsed output");
      published.push({
        ...item,
        summary: sanitizeSummary(parsed.summary),
        category: parsed.category ?? category,
        tags: parsed.tags.slice(0, 4).map((t) => t.toLowerCase()),
      });
      await sleep(150);
    } catch (error) {
      failures += 1;
      console.error(
        `  summarize failed for "${item.title}": ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  return { published, failures };
}

export function sanitizeSummary(summary: string): string {
  const cleaned = summary
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // markdown links/images -> their text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ") // single line: newlines would break list rendering
    .trim();
  return truncate(cleaned, SUMMARY_MAX_CHARS);
}
