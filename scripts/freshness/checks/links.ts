import { AUTHORITATIVE_LINK_HOSTS, HTTP_TIMEOUT_MS, USER_AGENT } from "../config";
import type { DocPage, Finding } from "../types";

interface LinkRef {
  url: string;
  page: string;
  line: number;
}

// Pull authoritative links (markdown targets and bare URLs) out of a page,
// tagged with line numbers. Only hosts we treat as ground truth are returned;
// broad link rot is the lychee workflow's job.
export function extractAuthoritativeLinks(page: DocPage): LinkRef[] {
  const refs: LinkRef[] = [];
  const lines = page.body.split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
      pushIfAuthoritative(refs, m[1], page.path, page.bodyStartLine + i);
    }
    for (const m of line.matchAll(/(?<![("])\bhttps?:\/\/[^\s)<>"']+/g)) {
      pushIfAuthoritative(refs, m[0], page.path, page.bodyStartLine + i);
    }
  });
  return refs;
}

function pushIfAuthoritative(
  refs: LinkRef[],
  rawUrl: string,
  page: string,
  line: number,
): void {
  let host: string;
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return;
  }
  const isAuthoritative = AUTHORITATIVE_LINK_HOSTS.some(
    (h) => host === h || host.endsWith("." + h),
  );
  if (isAuthoritative && !refs.some((r) => r.url === rawUrl && r.page === page)) {
    refs.push({ url: rawUrl.replace(/[.,;]+$/, ""), page, line });
  }
}

export type Fetcher = (url: string) => Promise<number>;

// Checks each unique authoritative URL once. Only a definitive 404/410 is
// flagged - timeouts, 5xx, and bot-blocks (403/429) are treated as "reachable"
// to avoid CI false positives. Returns findings plus the count actually checked.
export async function checkDeadLinks(
  pages: DocPage[],
  fetcher: Fetcher = defaultFetcher,
): Promise<{ findings: Finding[]; checked: number }> {
  const refs = pages.flatMap(extractAuthoritativeLinks);
  const byUrl = new Map<string, LinkRef[]>();
  for (const ref of refs) {
    if (!byUrl.has(ref.url)) byUrl.set(ref.url, []);
    byUrl.get(ref.url)!.push(ref);
  }

  const findings: Finding[] = [];
  for (const [url, where] of byUrl) {
    let status: number;
    try {
      status = await fetcher(url);
    } catch {
      continue; // network error - don't flag, could be transient
    }
    if (status !== 404 && status !== 410) continue;
    for (const ref of where) {
      findings.push({
        check: "dead-link",
        severity: "high",
        location: `${ref.page}:${ref.line}`,
        message: `Authoritative link returns ${status} (page moved or removed): ${url}`,
        evidence: url,
      });
    }
  }
  return { findings, checked: byUrl.size };
}

async function defaultFetcher(url: string): Promise<number> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  return res.status;
}
