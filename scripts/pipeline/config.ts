// Central configuration for the Intune release-note pipeline.

export const USER_AGENT =
  "intunemacadmins-content-pipeline/1.0 (+https://intunemacadmins.com)";

// LLM models. Classification is high-volume and cheap; summaries favor quality.
export const CLASSIFY_MODEL = "claude-haiku-4-5";
export const SUMMARIZE_MODEL = "claude-opus-4-8";
export const CLASSIFY_BATCH_SIZE = 15;
export const LLM_FAILURE_ABORT_RATIO = 0.5;

// Paths (relative to repo root).
export const CACHE_DIR = ".cache";
export const PREVIEW_DIR = ".cache/preview";
export const STATE_FILE = "data/pipeline-state.json";
// GitBook content tree (Git Sync renders these directly).
export const WHATS_NEW_FILE = "content/home/whats-new.md";

// Microsoft Learn "What's new in Microsoft Intune".
// The markdown source lives in MicrosoftDocs/memdocs (moved to intune/whats-new/ in 2025).
export const MS_WHATS_NEW_RAW_URL =
  "https://raw.githubusercontent.com/MicrosoftDocs/memdocs/main/intune/whats-new/index.md";
export const MS_WHATS_NEW_PAGE_URL =
  "https://learn.microsoft.com/en-us/intune/whats-new/";
export const MS_WHATS_NEW_WINDOW_MONTHS = 12;
export const MS_INTUNE_NOTICES_RAW_URL =
  "https://raw.githubusercontent.com/MicrosoftDocs/memdocs/main/intune/whats-new/includes/intune-notices.md";
export const MS_DEFENDER_RELEASES_RAW_URL =
  "https://raw.githubusercontent.com/MicrosoftDocs/defender-docs/public/defender-endpoint/microsoft-defender-endpoint-releases.md";
export const MS_DEFENDER_RELEASES_PAGE_URL =
  "https://learn.microsoft.com/en-us/defender-endpoint/microsoft-defender-endpoint-releases";
export const MS_DEFENDER_WINDOW_MONTHS = 3;
export const WHATS_NEW_RELEASE_GROUPS = 6;

// State entries older than this are pruned; release notes never resurface items that old.
export const STATE_RETENTION_MONTHS = 12;

export const EXCERPT_MAX_CHARS = 700;
export const CONTENT_MAX_CHARS = 6000;
export const SUMMARY_MAX_CHARS = 700;
export const MAX_INTEGRATION_ITEMS = 5;

export const HTTP_TIMEOUT_MS = 20_000;
export const HTTP_RETRIES = 2;
export const HTTP_BACKOFF_MS = [500, 2000];
