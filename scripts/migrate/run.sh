#!/usr/bin/env bash
# One-shot migration build: Astro/Starlight (src/content/docs) -> GitBook tree.
# Idempotent and reproducible. Run from anywhere; resolves the repo root itself.
#
#   bash scripts/migrate/run.sh
#
# Steps, in order (later steps depend on earlier output):
#   1. convert.ts        src docs -> content/**.md + .gitbook/assets + manifest
#   2. summary.ts        content/SUMMARY.md (nav, mirrors the Starlight sidebar)
#   3. gitbook-config.ts .gitbook.yaml (Git Sync config + legacy-URL redirects)
#   4. pipeline render   normalize the 3 pipeline-managed pages to canonical
#                        pipeline output (whats-new, community-pulse index+week)
set -euo pipefail
cd "$(dirname "$0")/../.."

npx tsx scripts/migrate/convert.ts
npx tsx scripts/migrate/summary.ts
npx tsx scripts/migrate/gitbook-config.ts

# Seed empty inter-stage artifacts so the render stage runs without fetch/LLM,
# regenerating the generated pages from the committed pipeline state.
mkdir -p .cache
echo '{"fetchedTotal":0,"result":{"items":[],"errors":[],"skipped":[]}}' > .cache/raw-items.json
echo '{"published":[],"rejectedIds":[],"llmFailures":0,"classifiedRelevant":0,"classifiedRejected":0}' > .cache/processed-items.json
npx tsx scripts/pipeline/run.ts render

echo "Migration build complete."
