// Content pipeline CLI.
//
//   tsx scripts/pipeline/run.ts <stage> [flags]
//
// Stages: all (default) | fetch | llm | render
// Flags:
//   --dry-run        write generated content to .cache/preview instead of src/
//   --max-items=<n>  cap new items processed this run (cost guard for testing)
//
// Stage artifacts land in .cache/ so stages can be run and inspected separately.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  CACHE_DIR,
  LLM_FAILURE_ABORT_RATIO,
  PREVIEW_DIR,
  STATE_FILE,
  WHATS_NEW_FILE,
} from "./config";
import { fetchAllSources, type FetchResult } from "./fetch/index";
import {
  applyContentPlans,
  planContentUpdates,
  type ContentPlan,
} from "./integrate/content";
import { classifyItems } from "./llm/classify";
import { hasApiKey } from "./llm/client";
import { summarizeItems } from "./llm/summarize";
import { renderPrBody } from "./render/pr-body";
import { renderWhatsNew } from "./render/whats-new";
import {
  isoWeekOf,
  isoWeekString,
  loadState,
  pruneState,
  saveState,
} from "./state";
import type { PublishedItem, RawItem, RunReport } from "./types";

interface CliOptions {
  stage: "all" | "fetch" | "llm" | "render";
  dryRun: boolean;
  maxItems: number | null;
}

interface FetchArtifact {
  fetchedTotal: number;
  result: FetchResult;
}

interface LlmArtifact {
  published: PublishedItem[];
  rejectedIds: string[];
  llmFailures: number;
  classifiedRelevant: number;
  classifiedRejected: number;
  contentPlans: ContentPlan[];
  integrationSkipped: string[];
}

const RAW_ITEMS_FILE = join(CACHE_DIR, "raw-items.json");
const PROCESSED_FILE = join(CACHE_DIR, "processed-items.json");

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const now = new Date();

  if (options.stage === "all" || options.stage === "fetch") {
    await stageFetch(options, now);
  }
  if (options.stage === "all" || options.stage === "llm") {
    await stageLlm(options);
  }
  if (options.stage === "all" || options.stage === "render") {
    stageRender(options, now);
  }
}

async function stageFetch(options: CliOptions, now: Date): Promise<void> {
  console.log("[fetch] source=ms-whats-new");
  const state = loadState();
  const result = await fetchAllSources(state, now);
  const fetchedTotal = result.items.length;
  if (options.maxItems !== null && result.items.length > options.maxItems) {
    console.log(`[fetch] capping ${result.items.length} new items to ${options.maxItems} (--max-items)`);
    result.items = result.items.slice(0, options.maxItems);
  }
  for (const error of result.errors) {
    console.error(`[fetch] source error: ${error.source}: ${error.error}`);
  }
  for (const skipped of result.skipped) {
    console.log(`[fetch] skipped: ${skipped}`);
  }
  writeJson(RAW_ITEMS_FILE, { fetchedTotal, result } satisfies FetchArtifact);
  console.log(`[fetch] ${result.items.length} new items (state has ${Object.keys(state.items).length} known)`);
}

async function stageLlm(options: CliOptions): Promise<void> {
  const artifact = readJson<FetchArtifact>(RAW_ITEMS_FILE);
  const items: RawItem[] = artifact.result.items;
  console.log(`[llm] processing ${items.length} items`);

  let output: LlmArtifact;
  if (items.length === 0) {
    output = {
      published: [],
      rejectedIds: [],
      llmFailures: 0,
      classifiedRelevant: 0,
      classifiedRejected: 0,
      contentPlans: [],
      integrationSkipped: [],
    };
  } else if (!hasApiKey()) {
    if (!options.dryRun) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Run with --dry-run to exercise fetch/render without LLM calls.",
      );
    }
    console.log("[llm] DRY RUN without API key: passing items through with excerpt placeholders");
    output = {
      published: items.map((item) => ({
        ...item,
        summary: `(dry run, no LLM) ${item.excerpt.replace(/\s+/g, " ")}`,
        category: "discussion" as const,
        tags: [],
      })),
      rejectedIds: [],
      llmFailures: 0,
      classifiedRelevant: items.length,
      classifiedRejected: 0,
      contentPlans: [],
      integrationSkipped: ["Documentation routing skipped because the dry run has no API key"],
    };
  } else {
    const { classified, failures: classifyFailures } = await classifyItems(items);
    const relevant = classified.filter((c) => c.relevant);
    const rejected = classified.filter((c) => !c.relevant);
    console.log(
      `[llm] classified: ${relevant.length} relevant, ${rejected.length} rejected, ${classifyFailures} failed`,
    );
    const { published, failures: summarizeFailures } = await summarizeItems(relevant);
    const llmFailures = classifyFailures + summarizeFailures;
    if (items.length > 0 && llmFailures / items.length > LLM_FAILURE_ABORT_RATIO) {
      throw new Error(
        `LLM failure ratio ${llmFailures}/${items.length} exceeds ${LLM_FAILURE_ABORT_RATIO}; aborting before touching state`,
      );
    }
    output = {
      published,
      rejectedIds: rejected.map((r) => r.item.id),
      llmFailures,
      classifiedRelevant: relevant.length,
      classifiedRejected: rejected.length,
      contentPlans: [],
      integrationSkipped: [],
    };
  }

  if (output.published.length > 0 && hasApiKey()) {
    const integration = await planContentUpdates(output.published);
    output.contentPlans = integration.plans;
    output.integrationSkipped = integration.skipped;
  }

  writeJson(PROCESSED_FILE, output);
  console.log(`[llm] ${output.published.length} items summarized for publication`);
}

function stageRender(options: CliOptions, now: Date): void {
  const fetchArtifact = readJson<FetchArtifact>(RAW_ITEMS_FILE);
  const llmArtifact = readJson<LlmArtifact>(PROCESSED_FILE);
  const week = isoWeekOf(now);
  const weekStr = isoWeekString(week);

  // Update state: published items keep their display fields, rejected items
  // only the id (enough for dedup). Failures stay absent and retry next run.
  let state = loadState();
  for (const item of llmArtifact.published) {
    state.items[item.id] = {
      status: "published",
      firstSeen: now.toISOString(),
      week: weekStr,
      source: item.source,
      sourceName: item.sourceName,
      url: item.url,
      title: item.title,
      author: item.author,
      publishedAt: item.publishedAt,
      summary: item.summary,
      category: item.category,
      tags: item.tags,
      meta: item.meta,
    };
  }
  for (const id of llmArtifact.rejectedIds) {
    state.items[id] = { status: "rejected", firstSeen: now.toISOString() };
  }
  state = pruneState(state, now);

  // Output roots: real content tree, or .cache/preview for dry runs.
  const root = options.dryRun ? PREVIEW_DIR : ".";
  const stateOut = options.dryRun ? join(PREVIEW_DIR, "pipeline-state.json") : STATE_FILE;
  const whatsNewOut = join(root, WHATS_NEW_FILE);

  saveState(state, stateOut);
  writeFile(whatsNewOut, renderWhatsNew(state));
  const integration = applyContentPlans(
    llmArtifact.contentPlans ?? [],
    root,
    now,
  );

  const report: RunReport = {
    startedAt: now.toISOString(),
    dryRun: options.dryRun,
    fetched: fetchArtifact.fetchedTotal,
    newItems: fetchArtifact.result.items.length,
    classifiedRelevant: llmArtifact.classifiedRelevant,
    classifiedRejected: llmArtifact.classifiedRejected,
    published: llmArtifact.published.map((item) => ({
      source: item.source,
      sourceName: item.sourceName,
      title: item.title,
      url: item.url,
    })),
    sourceErrors: fetchArtifact.result.errors,
    skippedSources: fetchArtifact.result.skipped,
    llmFailures: llmArtifact.llmFailures,
    contentUpdates: integration.updates,
    integrationSkipped: [
      ...(llmArtifact.integrationSkipped ?? []),
      ...integration.skipped,
    ],
  };
  writeJson(join(CACHE_DIR, "run-report.json"), report);
  writeFile(join(CACHE_DIR, "pr-body.md"), renderPrBody(report));

  console.log(
    `[render] done (${options.dryRun ? "dry run -> " + PREVIEW_DIR : "wrote content tree"}): ` +
      `${llmArtifact.published.length} published, ${llmArtifact.rejectedIds.length} rejected, week ${weekStr}`,
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { stage: "all", dryRun: false, maxItems: null };
  for (const arg of argv) {
    if (arg === "all" || arg === "fetch" || arg === "llm" || arg === "render") {
      options.stage = arg;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg.startsWith("--max-items=")) {
      options.maxItems = Number(arg.slice("--max-items=".length));
      if (!Number.isInteger(options.maxItems) || options.maxItems < 0) {
        throw new Error(`Invalid --max-items value: ${arg}`);
      }
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function readJson<T>(path: string): T {
  if (!existsSync(path)) {
    throw new Error(`${path} not found - run the earlier pipeline stage first`);
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown): void {
  writeFile(path, JSON.stringify(value, null, 2) + "\n");
}

function writeFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.endsWith("\n") ? content : content + "\n", "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
