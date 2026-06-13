import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { truncate } from "../../pipeline/text";
import type { DocPage, Finding } from "../types";
import {
  DRIFT_MAX_TOKENS,
  DRIFT_MODEL,
  MAX_DRIFT_PAGES,
  PAGE_BODY_MAX_CHARS,
} from "./config";
import { fetchSourceText } from "./fetch-source";
import { DRIFT_SYSTEM } from "./prompts";

export const DriftFindings = z.object({
  findings: z
    .array(
      z.object({
        severity: z.enum(["high", "medium", "low"]),
        claim: z.string(), // the page's now-questionable statement
        discrepancy: z.string(), // what the current source says instead
      }),
    )
    .max(10),
});

// Minimal shape of the Anthropic client method we use, so the checker can be
// driven with a fake in the self-test without importing the SDK there.
export interface DriftClient {
  messages: {
    parse: (args: unknown) => Promise<{
      parsed_output: z.infer<typeof DriftFindings> | null;
    }>;
  };
}

export interface DriftDeps {
  client: DriftClient;
  fetchImpl?: typeof fetch;
  model?: string;
}

export interface DriftResult {
  findings: Finding[];
  skipped: string[];
  pagesChecked: number;
}

// Compares each page that declares `sources` against its current upstream docs.
// One model call per source; a fetch or model failure skips that source (logged)
// rather than failing the run. Detection only - never edits the page.
export async function checkDrift(
  pages: DocPage[],
  deps: DriftDeps,
): Promise<DriftResult> {
  const sourced = pages.filter(
    (p) => Array.isArray(p.frontmatter.sources) && p.frontmatter.sources.length > 0,
  );
  const skipped: string[] = [];
  const findings: Finding[] = [];

  const toCheck = sourced.slice(0, MAX_DRIFT_PAGES);
  if (sourced.length > toCheck.length) {
    skipped.push(
      `content-drift: ${sourced.length - toCheck.length} sourced page(s) over the ${MAX_DRIFT_PAGES}-page cap not checked this run`,
    );
  }

  for (const page of toCheck) {
    const sources = page.frontmatter.sources as string[];
    for (const url of sources) {
      try {
        const source = await fetchSourceText(url, deps.fetchImpl);
        const parsed = await callModel(deps, page, source.text, url);
        for (const f of parsed.findings) {
          findings.push({
            check: "content-drift",
            severity: f.severity,
            location: page.path,
            message: `${f.discrepancy} (vs ${url})`,
            evidence: f.claim,
          });
        }
      } catch (error) {
        skipped.push(
          `content-drift: ${page.path} vs ${url} (${error instanceof Error ? error.message : String(error)})`,
        );
      }
    }
  }

  return { findings, skipped, pagesChecked: toCheck.length };
}

async function callModel(
  deps: DriftDeps,
  page: DocPage,
  sourceText: string,
  url: string,
): Promise<z.infer<typeof DriftFindings>> {
  const content = [
    `PAGE TITLE: ${page.title}`,
    "",
    "PAGE CONTENT (community doc, may be stale):",
    truncate(page.body, PAGE_BODY_MAX_CHARS),
    "",
    `CURRENT OFFICIAL SOURCE (${url}):`,
    sourceText,
  ].join("\n");

  const response = await deps.client.messages.parse({
    model: deps.model ?? DRIFT_MODEL,
    max_tokens: DRIFT_MAX_TOKENS,
    system: DRIFT_SYSTEM,
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(DriftFindings) },
  });
  if (!response.parsed_output) throw new Error("drift returned no parsed output");
  return response.parsed_output;
}
