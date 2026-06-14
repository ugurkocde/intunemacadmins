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

  const broken: { url: string; status: number; on: string[] }[] = [];
  await mapLimit(unique, 8, async (url) => {
    let status = 0;
    try {
      const res = await fetch(url, { method: "GET", redirect: "follow" });
      status = res.status;
    } catch {
      status = 0;
    }
    if (status !== 200) {
      broken.push({ url, status, on: [...linkSources.get(url)!] });
    }
  });

  console.log(`\n=== RESULT ===`);
  console.log(`unique internal links: ${unique.length} | broken (non-200): ${broken.length}`);
  for (const b of broken.sort((a, b) => a.url.localeCompare(b.url))) {
    console.log(`\n  [${b.status}] ${b.url}`);
    console.log(`     linked from: ${b.on.slice(0, 4).map((u) => u.replace(DOCS, "")).join(", ")}${b.on.length > 4 ? ` (+${b.on.length - 4})` : ""}`);
  }
  if (!broken.length) console.log("\nAll internal links resolve (200). No broken quick-links.");
}

main();
