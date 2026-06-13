// Central configuration for the content pipeline.
// Source URLs verified 2026-06-09; see config/sources.json for the blog list.

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
export const SOURCES_FILE = "config/sources.json";
// GitBook content tree (Git Sync renders these directly).
export const WHATS_NEW_FILE = "content/home/whats-new.md";
export const PULSE_DIR = "content/community-pulse";
export const SUMMARY_FILE = "content/SUMMARY.md";

// Microsoft Learn "What's new in Microsoft Intune".
// The markdown source lives in MicrosoftDocs/memdocs (moved to intune/whats-new/ in 2025).
export const MS_WHATS_NEW_RAW_URL =
  "https://raw.githubusercontent.com/MicrosoftDocs/memdocs/main/intune/whats-new/index.md";
export const MS_WHATS_NEW_PAGE_URL =
  "https://learn.microsoft.com/en-us/intune/whats-new/";
export const MS_WHATS_NEW_WINDOW_MONTHS = 12;
export const WHATS_NEW_RELEASE_GROUPS = 6;

// Microsoft Tech Community boards. HTML pages 403 to plain fetches; only this
// post-Aurora-migration RSS workaround format works. Full post body is in the feed.
export const TECH_COMMUNITY_FEEDS = [
  {
    name: "Microsoft Intune Blog",
    url: "https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=MicrosoftIntuneBlog",
  },
  {
    name: "Intune Customer Success",
    url: "https://techcommunity.microsoft.com/t5/s/gxcuf89792/rss/board?board.id=IntuneCustomerSuccess",
  },
] as const;

// Reddit, two access modes:
// 1. OAuth script app (REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET) - most reliable,
//    includes scores for the quality gate.
// 2. Credential-free fallback: public search.rss feeds. Works from residential
//    IPs and sometimes from CI; no scores, so the LLM classifier is the only
//    quality gate. Failures in this mode soft-skip (datacenter IPs are often
//    blocked by Reddit), they are not treated as source errors.
export const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
export const REDDIT_SEARCHES = [
  {
    sourceName: "r/Intune",
    url: "https://oauth.reddit.com/r/Intune/search?q=flair_name%3A%22macOS%20Management%22%20OR%20macos&restrict_sr=1&sort=new&limit=50",
  },
  {
    sourceName: "r/macsysadmin",
    url: "https://oauth.reddit.com/r/macsysadmin/search?q=intune&restrict_sr=1&sort=new&limit=50",
  },
] as const;
// Reddit 429s automation User-Agents but serves its public RSS to a normal
// browser UA, logged out. Used only for the Reddit RSS feeds (other sources
// keep the honest USER_AGENT above).
export const REDDIT_RSS_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// Reddit rate-limits bursts even with a browser UA, so retry 429s with long
// waits and space the two feeds apart. Low weekly volume makes this reliable.
export const REDDIT_RSS_BACKOFF_MS = [8000, 20000];
export const REDDIT_RSS_FEED_GAP_MS = 5000;

export const REDDIT_RSS_SEARCHES = [
  {
    sourceName: "r/Intune",
    url: "https://www.reddit.com/r/Intune/search.rss?q=flair%3A%22macOS+Management%22+OR+macos&restrict_sr=on&sort=new&t=month",
  },
  {
    sourceName: "r/macsysadmin",
    url: "https://www.reddit.com/r/macsysadmin/search.rss?q=intune&restrict_sr=on&sort=new&t=month",
  },
] as const;
export const REDDIT_MIN_SCORE = 5;

// Recency window for feed/reddit items (the weekly cadence is 7 days; the wider
// window plus state-based dedup gives slack for failed or skipped runs).
export const ITEM_WINDOW_DAYS = 14;

// State entries older than this are pruned; feeds never resurface items that old.
export const STATE_RETENTION_MONTHS = 12;

// Deterministic prefilter applied before the LLM relevance gate. Recall-high on
// purpose: the classifier removes false positives, this list only saves spend.
export const MACOS_KEYWORDS = [
  "macos",
  "mac os",
  "platform sso",
  "psso",
  "platform single sign-on",
  "declarative device management",
  "apple silicon",
  "apple business manager",
  "automated device enrollment",
  "company portal for mac",
  "filevault",
  "gatekeeper",
  "munki",
  "autopkg",
  "swift dialog",
  "swiftdialog",
];

export const EXCERPT_MAX_CHARS = 700;
export const CONTENT_MAX_CHARS = 6000;
export const SUMMARY_MAX_CHARS = 700;

export const HTTP_TIMEOUT_MS = 20_000;
export const HTTP_RETRIES = 2;
export const HTTP_BACKOFF_MS = [500, 2000];
