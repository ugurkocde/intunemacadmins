// Configuration for the LLM ground-truth drift check.

// Low volume (one call per sourced page per month), and precision matters for a
// trust tool, so use the most capable model. Lower this if you source many
// pages and want to cut cost.
export const DRIFT_MODEL = "claude-opus-4-8";

// Bounds cost if the source map grows large; excess pages are skipped with a
// logged notice rather than silently dropped.
export const MAX_DRIFT_PAGES = 40;

// Truncation limits for the model input.
export const PAGE_BODY_MAX_CHARS = 6000;
export const SOURCE_TEXT_MAX_CHARS = 8000;
export const DRIFT_MAX_TOKENS = 2000;
