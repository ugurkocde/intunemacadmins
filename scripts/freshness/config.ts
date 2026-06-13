// Configuration for the docs-freshness checker.

export const USER_AGENT =
  "intunemacadmins-freshness/1.0 (+https://intunemacadmins.com)";

// Root of the authored documentation (GitBook content tree), relative to repo root.
export const DOCS_DIR = "content";

// Generated/nav files are excluded: they are rebuilt from their own sources, so
// "staleness" does not apply the same way.
export const EXCLUDED_PATHS = [
  "content/home/whats-new.md",
  "content/community-pulse",
  "content/SUMMARY.md",
];

// A page is flagged for review when its last-reviewed date (frontmatter, or
// git last-commit as fallback) is older than this.
export const REVIEW_MAX_MONTHS = 9;
export const REVIEW_STALE_MONTHS = 15; // escalated severity past this point

// SOFA is the macadmins-community feed of current Apple OS versions; used as
// ground truth for "is this macOS recommendation outdated". Falls back to the
// constant below if unreachable.
export const SOFA_MACOS_FEED =
  "https://sofafeed.macadmins.io/v1/macos_data_feed.json";
export const LATEST_MACOS_FALLBACK = 26; // major version; refreshed by SOFA at runtime

// Only these hosts are liveness-checked here. General link rot is handled by the
// separate monthly lychee workflow; this check targets authoritative sources
// whose 404 means a real doc moved or a portal deep link broke.
export const AUTHORITATIVE_LINK_HOSTS = [
  "intune.microsoft.com",
  "learn.microsoft.com",
  "support.apple.com",
  "developer.apple.com",
];

export const HTTP_TIMEOUT_MS = 15_000;

export const REPORT_JSON = ".cache/freshness-report.json";
export const REPORT_MD = ".cache/freshness-report.md";
export const EDITS_PR_BODY = ".cache/edits-pr-body.md";
export const EDITS_JSON = ".cache/edits.json";
