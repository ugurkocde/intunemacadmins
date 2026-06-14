// Crawl the live GitBook docs site and verify every INTERNAL link resolves.
//
//   npx tsx scripts/migrate/check-live-links.ts
//
// Catches "quick links" / cross-references that point at dead paths after the
// subdomain move. Internal = docs/apex/www host or relative. External links are
// ignored (the monthly lychee job covers those).

const DOCS = "https://docs.intunemacadmins.com";
const INTERNAL_HOSTS = [
  "docs.intunemacadmins.com",
  "intunemacadmins.com",
  "www.intunemacadmins.com",
];

async function getText(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  return res.ok ? res.text() : "";
}

function extractHrefs(html: string, baseUrl: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/href="([^"#]+)(?:#[^"]*)?"/g)) {
    let href = m[1];
    if (!href || href.startsWith("mailto:") || href.startsWith("data:")) continue;
    try {
      const u = new URL(href, baseUrl);
      if (u.protocol !== "https:" && u.protocol !== "http:") continue;
      if (u.pathname.endsWith("/rss.xml")) continue; // GitBook per-page autodiscovery (head, 404 by design)
      out.add(u.origin + u.pathname);
    } catch {
      /* ignore */
    }
  }
  return [...out];
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker(): Promise<void> {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function main(): Promise<void> {
  // All live doc pages from the sitemap.
  const sm = await getText(`${DOCS}/sitemap-pages.xml`);
  const pages = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`crawling ${pages.length} live pages for internal links...`);

  // page -> internal links found on it
  const linkSources = new Map<string, Set<string>>();
  await mapLimit(pages, 6, async (page) => {
    const html = await getText(page);
    for (const href of extractHrefs(html, page)) {
      const host = new URL(href).host;
      if (!INTERNAL_HOSTS.includes(host)) continue;
      if (!linkSources.has(href)) linkSources.set(href, new Set());
      linkSources.get(href)!.add(page);
    }
  });

  const unique = [...linkSources.keys()];
  console.log(`checking ${unique.length} unique internal link targets...`);

  // redirect:"manual" so we flag BOTH dead links (4xx/5xx) AND internal links
  // that bounce through a redirect (e.g. an old apex/www URL) — those should
  // point straight at the docs page.
  const issues: { url: string; status: number; on: string[] }[] = [];
  await mapLimit(unique, 8, async (url) => {
    let status = 0;
    try {
      status = (await fetch(url, { method: "GET", redirect: "manual" })).status;
    } catch {
      status = 0;
    }
    if (status !== 200) issues.push({ url, status, on: [...linkSources.get(url)!] });
  });

  const redirecting = issues.filter((i) => i.status >= 300 && i.status < 400);
  const dead = issues.filter((i) => i.status < 300 || i.status >= 400);

  console.log(`\n=== RESULT ===`);
  console.log(`unique internal links: ${unique.length} | dead: ${dead.length} | redirecting: ${redirecting.length}`);
  for (const label of [
    { name: "DEAD (4xx/5xx — fix the link)", list: dead },
    { name: "REDIRECTING (point straight at the docs page)", list: redirecting },
  ]) {
    if (!label.list.length) continue;
    console.log(`\n-- ${label.name} --`);
    for (const b of label.list.sort((a, b) => a.url.localeCompare(b.url))) {
      console.log(`  [${b.status}] ${b.url}`);
      console.log(`     from: ${b.on.slice(0, 4).map((u) => u.replace(DOCS, "")).join(", ")}${b.on.length > 4 ? ` (+${b.on.length - 4})` : ""}`);
    }
  }
  if (!issues.length) console.log("\nAll internal links resolve directly (200). No broken or bouncing links.");
}

main();
