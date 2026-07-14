import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { DocPage, EditCandidate, Finding } from "../types";
import { DRIFT_MAX_TOKENS } from "./config";
import type { StructuredClient } from "./drift";
import { VERIFY_SYSTEM } from "./prompts";

export const VerifyVerdicts = z.object({
  verdicts: z.array(
    z.object({
      index: z.number(),
      supported: z.boolean(),
      reason: z.string(),
    }),
  ),
});

// Independent second pass: re-checks each drafted edit against the source and
// approves only those the source clearly supports in the same scope. Anything
// rejected (or unverifiable) is demoted to a flag finding rather than applied -
// the safe outcome. A whole-call failure rejects every candidate to flags.
export async function verifyEditCandidates(
  client: StructuredClient,
  page: DocPage,
  sourceText: string,
  url: string,
  candidates: EditCandidate[],
  model: string,
): Promise<{ approved: EditCandidate[]; rejected: Finding[] }> {
  if (candidates.length === 0) return { approved: [], rejected: [] };

  const payload = candidates.map((c, index) => ({
    index,
    pageStatement: c.oldText,
    proposedReplacement: c.newText,
  }));
  const content = [
    `PAGE TITLE: ${page.title}`,
    "",
    "PROPOSED CORRECTIONS (verify each against the source below):",
    JSON.stringify(payload, null, 2),
    "",
    `CURRENT OFFICIAL SOURCE (${url}):`,
    sourceText,
  ].join("\n");

  let parsed: z.infer<typeof VerifyVerdicts> | null = null;
  try {
    const response = await client.messages.parse({
      model,
      max_tokens: DRIFT_MAX_TOKENS,
      system: VERIFY_SYSTEM,
      messages: [{ role: "user", content }],
      output_config: { format: zodOutputFormat(VerifyVerdicts) },
    });
    parsed = response.parsed_output as z.infer<typeof VerifyVerdicts> | null;
  } catch {
    parsed = null;
  }

  if (!parsed) {
    return {
      approved: [],
      rejected: candidates.map((c) => toFlag(c, "verification step failed")),
    };
  }

  const byIndex = new Map(parsed.verdicts.map((v) => [v.index, v]));
  const approved: EditCandidate[] = [];
  const rejected: Finding[] = [];
  candidates.forEach((c, i) => {
    const v = byIndex.get(i);
    if (v && v.supported) approved.push(c);
    else rejected.push(toFlag(c, v?.reason || "not verified against source"));
  });
  return { approved, rejected };
}

function toFlag(c: EditCandidate, reason: string): Finding {
  return {
    check: "content-drift",
    severity: c.severity,
    location: c.path,
    message: `${c.discrepancy} (vs ${c.source}) — a correction was drafted but not auto-applied (verification: ${reason}).`,
    evidence: c.oldText.slice(0, 200),
  };
}
