import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CLASSIFY_BATCH_SIZE, CLASSIFY_MODEL } from "../config";
import type { Category, RawItem } from "../types";
import { ClassificationBatch } from "../types";
import { getClient } from "./client";
import { CLASSIFY_SYSTEM } from "./prompts";

export interface ClassifiedItem {
  item: RawItem;
  relevant: boolean;
  confidence: "high" | "medium" | "low";
  category: Category;
}

export interface ClassifyResult {
  classified: ClassifiedItem[];
  failures: number;
}

// Stage 1: cheap batch relevance gate. Items are addressed by index inside
// each batch; a batch that errors or omits items counts those as failures,
// which leaves them out of state so the next run retries them.
export async function classifyItems(items: RawItem[]): Promise<ClassifyResult> {
  const client = getClient();
  const classified: ClassifiedItem[] = [];
  let failures = 0;

  for (let start = 0; start < items.length; start += CLASSIFY_BATCH_SIZE) {
    const batch = items.slice(start, start + CLASSIFY_BATCH_SIZE);
    const payload = batch.map((item, index) => ({
      index,
      source: item.source,
      title: item.title,
      excerpt: item.excerpt,
    }));
    try {
      const response = await client.messages.parse({
        model: CLASSIFY_MODEL,
        max_tokens: 4000,
        system: CLASSIFY_SYSTEM,
        messages: [
          {
            role: "user",
            content: `Classify these ${batch.length} items:\n\n${JSON.stringify(payload, null, 2)}`,
          },
        ],
        output_config: { format: zodOutputFormat(ClassificationBatch) },
      });
      const parsed = response.parsed_output;
      if (!parsed) throw new Error("classification returned no parsed output");
      const byIndex = new Map(parsed.results.map((r) => [r.index, r]));
      batch.forEach((item, index) => {
        const result = byIndex.get(index);
        if (!result) {
          failures += 1;
          return;
        }
        classified.push({
          item,
          relevant: result.relevant,
          confidence: result.confidence,
          category: result.category,
        });
      });
    } catch (error) {
      failures += batch.length;
      console.error(
        `  classify batch ${start / CLASSIFY_BATCH_SIZE + 1} failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  return { classified, failures };
}
