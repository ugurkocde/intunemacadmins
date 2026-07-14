import { z } from "zod";

export const SourceType = z.enum([
  "ms-whats-new",
  "ms-intune-notices",
  "ms-defender-macos",
]);
export type SourceType = z.infer<typeof SourceType>;

// Normalized item produced by the fetch layer. The only place URLs ever come
// from; the LLM layer never outputs URLs.
export const RawItem = z.object({
  id: z.string(),
  source: SourceType,
  sourceName: z.string(),
  url: z.string(),
  title: z.string(),
  author: z.string().optional(),
  publishedAt: z.string(),
  excerpt: z.string(),
  content: z.string(),
  meta: z.record(z.string(), z.unknown()).default({}),
});
export type RawItem = z.infer<typeof RawItem>;

export const Category = z.enum([
  "announcement",
  "configuration",
  "security",
  "app-management",
  "enrollment",
  "troubleshooting",
  "discussion",
  "tooling",
]);
export type Category = z.infer<typeof Category>;

// LLM stage 1 output: relevance classification for a batch of items.
// Items are addressed by batch index; the model never echoes IDs or URLs.
export const ClassificationBatch = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      relevant: z.boolean(),
      confidence: z.enum(["high", "medium", "low"]),
      category: Category,
    }),
  ),
});
export type ClassificationBatch = z.infer<typeof ClassificationBatch>;

// LLM stage 2 output: summary for a single item. No URL field by design.
export const ItemSummary = z.object({
  summary: z.string(),
  category: Category,
  tags: z.array(z.string()).max(4),
});
export type ItemSummary = z.infer<typeof ItemSummary>;

// A fully processed item ready for rendering and state persistence.
export const PublishedItem = RawItem.extend({
  summary: z.string(),
  category: Category,
  tags: z.array(z.string()),
});
export type PublishedItem = z.infer<typeof PublishedItem>;

export const StateItem = z.object({
  status: z.enum(["published", "rejected"]),
  firstSeen: z.string(),
  // The following fields are present for published items only.
  week: z.string().optional(),
  source: SourceType.optional(),
  sourceName: z.string().optional(),
  url: z.string().optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type StateItem = z.infer<typeof StateItem>;

export const StateFile = z.object({
  version: z.literal(1),
  items: z.record(z.string(), StateItem),
});
export type StateFile = z.infer<typeof StateFile>;

export interface SourceError {
  source: string;
  error: string;
}

// Written to .cache/run-report.json for the workflow summary and PR body.
export interface RunReport {
  startedAt: string;
  dryRun: boolean;
  fetched: number;
  newItems: number;
  classifiedRelevant: number;
  classifiedRejected: number;
  published: Array<{
    source: SourceType;
    sourceName: string;
    title: string;
    url: string;
  }>;
  sourceErrors: SourceError[];
  skippedSources: string[];
  llmFailures: number;
  contentUpdates: Array<{
    action: "update-existing" | "create-page";
    path: string;
    title: string;
  }>;
  integrationSkipped: string[];
}
