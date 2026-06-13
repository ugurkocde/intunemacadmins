// Offline self-test for the docs-freshness checker. No network, no API key.
// Run via: npm run freshness:selftest

import assert from "node:assert/strict";
import { checkPastDeadlines } from "./checks/dates";
import { checkDrift, type DriftClient } from "./drift/drift";
import {
  checkDeadLinks,
  extractAuthoritativeLinks,
} from "./checks/links";
import { checkMacosVersion, extractMacosMajors } from "./checks/macos-version";
import { checkReviewAge } from "./checks/review-age";
import { parseDoc } from "./load";
import { renderIssueBody } from "./render/issue-body";
import { parseLatestMacOS, scan } from "./scan";
import type { DocPage } from "./types";

let group = "";
function describe(name: string, fn: () => void | Promise<void>): void | Promise<void> {
  group = name;
  const done = () => console.log(`ok: ${name}`);
  const r = fn();
  return r instanceof Promise ? r.then(done) : done();
}
function fail(msg: string): never {
  throw new Error(`[${group}] ${msg}`);
}

function page(body: string, frontmatter: Record<string, unknown> = {}): DocPage {
  return { path: "test/page.mdx", frontmatter, title: "Test", body, bodyStartLine: 5 };
}

const NOW = new Date("2026-06-13T00:00:00Z");

await (async () => {
  describe("parseDoc: frontmatter + body line offset", () => {
    const raw = `---\ntitle: Hello\nlastReviewed: 2025-01-01\nsources:\n  - https://learn.microsoft.com/x\n---\n\nBody line one.\nBody line two.\n`;
    const doc = parseDoc("a.mdx", raw);
    assert.equal(doc.frontmatter.title, "Hello");
    assert.equal(doc.frontmatter.lastReviewed, "2025-01-01");
    assert.deepEqual(doc.frontmatter.sources, ["https://learn.microsoft.com/x"]);
    // Frontmatter is 6 lines incl. fences; body starts at line 7.
    assert.equal(doc.bodyStartLine, 7);
    assert.ok(doc.body.startsWith("\nBody line one."));
    // No-frontmatter file: body starts at line 1.
    assert.equal(parseDoc("b.md", "Just body\n").bodyStartLine, 1);
    // UTF-8 BOM must not defeat frontmatter parsing (some pages have one).
    const bom = parseDoc("c.md", "﻿---\ntitle: Has BOM\nsources:\n  - https://learn.microsoft.com/x\n---\n\nBody.\n");
    assert.equal(bom.frontmatter.title, "Has BOM");
    assert.deepEqual(bom.frontmatter.sources, ["https://learn.microsoft.com/x"]);
  });

  describe("review-age: frontmatter wins, git fallback, fresh passes", () => {
    // Fresh frontmatter -> no finding even if git is old.
    assert.equal(
      checkReviewAge(page("x", { lastReviewed: "2026-05-01" }), "2020-01-01T00:00:00Z", NOW).length,
      0,
    );
    // Old frontmatter -> flagged, and beats a recent git date.
    const f1 = checkReviewAge(page("x", { lastReviewed: "2024-01-01" }), "2026-06-01T00:00:00Z", NOW);
    assert.equal(f1.length, 1);
    assert.equal(f1[0].check, "review-age");
    assert.match(f1[0].message, /last reviewed/);
    // No frontmatter -> falls back to git date.
    const f2 = checkReviewAge(page("x"), "2024-01-01T00:00:00Z", NOW);
    assert.equal(f2.length, 1);
    assert.match(f2[0].message, /last changed/);
    // Review-age is always low severity (backlog signal, not a confirmed error).
    assert.equal(checkReviewAge(page("x"), "2024-01-01T00:00:00Z", NOW)[0].severity, "low");
    // No date info at all -> no finding (can't judge).
    assert.equal(checkReviewAge(page("x"), null, NOW).length, 0);
  });

  describe("past-deadline: flags expired, ignores future and non-deadline", () => {
    const expired = checkPastDeadlines(page("Devices update by 07/06/2024 automatically."), NOW);
    assert.equal(expired.length, 1);
    assert.equal(expired[0].check, "past-deadline");
    assert.match(expired[0].location, /:5$/); // bodyStartLine 5, first body line
    // Future deadline -> not flagged.
    assert.equal(checkPastDeadlines(page("Renew by 01/01/2027."), NOW).length, 0);
    // Past date without deadline cue (e.g. changelog) -> not flagged.
    assert.equal(checkPastDeadlines(page("Version 2.0 released 2024-09-02."), NOW).length, 0);
    // ISO and long-form date formats with cue.
    assert.equal(checkPastDeadlines(page("Valid until 2023-05-01."), NOW).length, 1);
    assert.equal(checkPastDeadlines(page("Token expires on January 5, 2024."), NOW).length, 1);
  });

  describe("macos-version: flags stale recommendation, not requirement", () => {
    // Recommendation to an old version -> flagged.
    const rec = checkMacosVersion(page("For the best results upgrade to macOS 14.x."), 26);
    assert.equal(rec.length, 1);
    assert.equal(rec[0].check, "macos-version");
    assert.equal(rec[0].severity, "low");
    // FAQ-style recommendation by name -> flagged.
    assert.equal(
      checkMacosVersion(page("It is recommended to be at least at macOS Sonoma (Version 14.0) or stay current."), 26).length,
      1,
    );
    // Requirement / availability statement -> NOT flagged.
    assert.equal(checkMacosVersion(page("Available in macOS 13 and later."), 26).length, 0);
    assert.equal(checkMacosVersion(page("Devices must be macOS 13.0 and newer devices."), 26).length, 0);
    // Recommendation to a current-ish version -> not flagged.
    assert.equal(checkMacosVersion(page("We recommend macOS 26."), 26).length, 0);
    // macOS 15 (Sequoia) is one release behind 26 (Tahoe), not flagged at threshold 2.
    assert.equal(checkMacosVersion(page("We recommend macOS 15."), 26).length, 0);
  });

  describe("extractMacosMajors", () => {
    assert.deepEqual(extractMacosMajors("macOS 14.x and macOS 13").sort((a, b) => a - b), [13, 14]);
    assert.deepEqual(extractMacosMajors("Sonoma (Version 14.0)").sort((a, b) => a - b), [14]);
    assert.deepEqual(extractMacosMajors("Ventura"), [13]);
    assert.deepEqual(extractMacosMajors("macOS 10.15"), [10]);
  });

  describe("links: extraction filters to authoritative hosts", () => {
    const p = page(
      "See [docs](https://learn.microsoft.com/intune/x) and [blog](https://example.com/y) and https://support.apple.com/en-us/z.",
    );
    const refs = extractAuthoritativeLinks(p);
    const urls = refs.map((r) => r.url).sort();
    assert.deepEqual(urls, [
      "https://learn.microsoft.com/intune/x",
      "https://support.apple.com/en-us/z",
    ]);
    assert.ok(refs.every((r) => r.line === 5));
  });

  await describe("links: only 404/410 flagged, transient ignored", async () => {
    const pages = [
      page("[a](https://learn.microsoft.com/dead) [b](https://learn.microsoft.com/ok) [c](https://learn.microsoft.com/blocked)"),
    ];
    const statuses: Record<string, number> = {
      "https://learn.microsoft.com/dead": 404,
      "https://learn.microsoft.com/ok": 200,
      "https://learn.microsoft.com/blocked": 403,
    };
    const { findings, checked } = await checkDeadLinks(pages, async (url) => {
      if (url.includes("throws")) throw new Error("network");
      return statuses[url] ?? 200;
    });
    assert.equal(checked, 3);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].check, "dead-link");
    assert.match(findings[0].message, /404/);
    // Network error path -> no finding.
    const t = await checkDeadLinks([page("[x](https://learn.microsoft.com/throws)")], async () => {
      throw new Error("network");
    });
    assert.equal(t.findings.length, 0);
  });

  describe("parseLatestMacOS: extracts max major from SOFA", () => {
    const feed = { OSVersions: [{ OSVersion: "Tahoe 26" }, { OSVersion: "Sequoia 15" }] };
    assert.equal(parseLatestMacOS(feed), 26);
    assert.equal(parseLatestMacOS({ OSVersions: [{ OSVersion: "macOS 15" }] }), 15);
    assert.equal(parseLatestMacOS({}), null);
  });

  await describe("scan: aggregates, sorts by severity, idempotent", async () => {
    const pages = [
      page("Update by 01/01/2024. Available in macOS 13 and later.", { lastReviewed: "2026-06-01" }),
    ];
    const opts = {
      now: NOW,
      latestMacOS: 26,
      checkLinks: false,
      gitDateResolver: () => null,
    };
    const r1 = await scan(pages, opts);
    const r2 = await scan(pages, opts);
    assert.deepEqual(r1.findings, r2.findings);
    // One past-deadline finding; the "available in" line is not flagged.
    assert.equal(r1.findings.filter((f) => f.check === "past-deadline").length, 1);
    assert.equal(r1.findings.filter((f) => f.check === "macos-version").length, 0);
    assert.ok(r1.skipped.some((s) => s.includes("dead-link")));
    // Issue body renders without throwing and includes the page path.
    const body = renderIssueBody(r1);
    assert.ok(body.includes("test/page.mdx"));
    assert.ok(body.includes("review"));
  });
  await describe("drift: maps model findings, skips unsourced and fetch errors", async () => {
    const sourced = page("Set the Team Identifier to UBF8T346G9.", {
      sources: ["https://learn.microsoft.com/intune/x"],
    });
    const unsourced = page("No sources here.");
    // Fake client returns one drift finding; fake fetch returns source HTML.
    const client: DriftClient = {
      messages: {
        parse: async () => ({
          parsed_output: {
            findings: [
              {
                severity: "high" as const,
                claim: "Team Identifier UBF8T346G9",
                discrepancy: "The current source lists a different identifier",
              },
            ],
          },
        }),
      },
    };
    const okFetch = (async () =>
      new Response("<main>current docs</main>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })) as unknown as typeof fetch;

    const r = await checkDrift([sourced, unsourced], { client, fetchImpl: okFetch });
    assert.equal(r.pagesChecked, 1); // only the sourced page
    assert.equal(r.findings.length, 1);
    assert.equal(r.findings[0].check, "content-drift");
    assert.equal(r.findings[0].severity, "high");
    assert.match(r.findings[0].message, /different identifier .*learn\.microsoft\.com/);
    assert.equal(r.findings[0].evidence, "Team Identifier UBF8T346G9");

    // Fetch failure -> skipped, not thrown, no finding.
    const badFetch = (async () => new Response("nope", { status: 404 })) as unknown as typeof fetch;
    const r2 = await checkDrift([sourced], { client, fetchImpl: badFetch });
    assert.equal(r2.findings.length, 0);
    assert.equal(r2.skipped.length, 1);
    assert.match(r2.skipped[0], /content-drift/);

    // No sourced pages -> nothing checked.
    const r3 = await checkDrift([unsourced], { client, fetchImpl: okFetch });
    assert.equal(r3.pagesChecked, 0);
    assert.equal(r3.findings.length, 0);
  });
})();

console.log("\nAll freshness self-tests passed.");
