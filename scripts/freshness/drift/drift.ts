import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { truncate } from "../../pipeline/text";
import type { DocPage, EditCandidate, Finding } from "../types";
import {
  DRIFT_MAX_TOKENS,
  DRIFT_MODEL,
  MAX_DRIFT_PAGES,
  PAGE_BODY_MAX_CHARS,
} from "./config";
import { fetchSourceText } from "./fetch-source";
import { DRIFT_SYSTEM } from "./prompts";

// Phrases that signal the model emitted a non-finding: an absence/omission.
const OMISSION_RE =
  /\b(not specified|not stated|not mentioned|does not (state|mention|specify|list|contradict)|doesn'?t (state|mention|specify|list|contradict)|page omits|not present in the page|isn'?t mentioned|no contradiction|not a contradiction|matches the (current )?source|aligns with the (current )?source)\b/i;

// True when the discrepancy text is the model declaring the page actually fine
// rather than describing a contradiction. The model phrases this many ways
// ("consistent", "actually consistent - omit", "not a contradiction"), so we
// catch the markers directly while preserving genuine "not consistent"
// contradictions and the "inconsistent" wording.
export function isNonContradiction(discrepancy: string): boolean {
  const t = discrepancy.toLowerCase();
  if (/\bomit\b/.test(t)) return true; // model telling itself to drop it
  if (/\bconsistent\b/.test(t) && !/\b(not consistent|inconsistent)\b/.test(t)) return true;
  return OMISSION_RE.test(discrepancy);
}

export const DriftFindings = z.object({
  findings: z
    .array(
      z.object({
        severity: z.enum(["high", "medium", "low"]),
        claim: z.string(), // the page's now-questionable statement
        discrepancy: z.string(), // what the current source says instead
        // For a clean, localized fix: the EXACT verbatim snippet from the page
        // to replace, and its correction. Empty strings when the fix isn't a
        // simple text replacement (then it's reported as a flag, not an edit).
        oldText: z.string(),
        newText: z.string(),
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
  // Optional path predicate to limit which sourced pages are checked (used by
  // the --drift-page targeting flag for cheap re-checks of specific pages).
  pageFilter?: (path: string) => boolean;
}

export interface DriftResult {
  // Drift that is reported as a flag only (issue) - either not a clean text fix,
  // or the page text needed for an edit wasn't provided.
  findings: Finding[];
  // Drift the model expressed as a verbatim old->new text replacement (PR).
  editCandidates: EditCandidate[];
  skipped: string[];
  pagesChecked: number;
}

// Compares each page that declares `sources` against its current upstream docs.
// One model call per source; a fetch or model failure skips that source (logged)
// rather than failing the run. Detection only - never edits the page here.
export async function checkDrift(
  pages: DocPage[],
  deps: DriftDeps,
): Promise<DriftResult> {
  const sourced = pages
    .filter(
      (p) => Array.isArray(p.frontmatter.sources) && p.frontmatter.sources.length > 0,
    )
    .filter((p) => !deps.pageFilter || deps.pageFilter(p.path));
  const skipped: string[] = [];
  const findings: Finding[] = [];
  const editCandidates: EditCandidate[] = [];

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
          const claim = (f.claim ?? "").trim();
          const discrepancy = (f.discrepancy ?? "").trim();
          if (claim.length < 5 || discrepancy.length < 20) continue;
          if (isNonContradiction(discrepancy)) continue;
          const oldText = f.oldText ?? "";
          const newText = f.newText ?? "";
          if (oldText.trim().length > 0 && newText.trim().length > 0 && oldText !== newText) {
            editCandidates.push({
              path: page.path,
              severity: f.severity,
              oldText,
              newText,
              discrepancy,
              source: url,
            });
          } else {
            findings.push({
              check: "content-drift",
              severity: f.severity,
              location: page.path,
              message: `${discrepancy} (vs ${url})`,
              evidence: claim,
            });
          }
        }
      } catch (error) {
        skipped.push(
          `content-drift: ${page.path} vs ${url} (${error instanceof Error ? error.message : String(error)})`,
        );
      }
    }
  }

  return { findings, editCandidates, skipped, pagesChecked: toCheck.length };
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
