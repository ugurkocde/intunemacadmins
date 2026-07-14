// Offline self-test for the content pipeline. No network, no API key.
// Run via: npm run pipeline:selftest

import assert from "node:assert/strict";
import { parseMsWhatsNew, slugify } from "./fetch/ms-whats-new";
import { addSummaryEntry, insertUnderHeading } from "./integrate/content";
import { sanitizeSummary } from "./llm/summarize";
import { escapeMdx, mdLink, safeUrl, yamlString } from "./render/escape";
import { renderWhatsNew } from "./render/whats-new";
import {
  hashId,
  isoWeekOf,
  isoWeekString,
  stableStringify,
} from "./state";
import { stripHtml, truncate } from "./text";
import type { StateFile } from "./types";

let group = "";
function describe(name: string, fn: () => void): void {
  group = name;
  fn();
  console.log(`ok: ${name}`);
}
function fail(message: string): never {
  throw new Error(`[${group}] ${message}`);
}

describe("escapeMdx", () => {
  assert.equal(
    escapeMdx("Hello <world> & {x} *b* _i_ [l] ~s~ `c` \\ |p|"),
    "Hello &lt;world&gt; &amp; &#123;x&#125; \\*b\\* \\_i\\_ \\[l\\] \\~s\\~ \\`c\\` \\\\ \\|p\\|",
  );
  // No HTML/JSX can survive escaping.
  const hostile = escapeMdx('</small><script>alert(1)</script>{evil}');
  if (hostile.includes("<script") || hostile.includes("{evil}")) {
    fail("hostile input survived escaping");
  }
});

describe("yamlString", () => {
  assert.equal(yamlString(`What's "new": yes`), `"What's \\"new\\": yes"`);
});

describe("safeUrl / mdLink", () => {
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("ftp://example.com/x"), null);
  assert.equal(
    safeUrl("https://example.com/a b(c)"),
    "https://example.com/a%20b%28c%29",
  );
  // Unsafe URL degrades to plain text, never a link.
  assert.equal(mdLink("label", "javascript:alert(1)"), "label");
  assert.equal(
    mdLink("a [b]", "https://example.com/x"),
    "[a \\[b\\]](https://example.com/x)",
  );
});

describe("hashId", () => {
  assert.equal(hashId("a"), hashId("a"));
  assert.equal(hashId("a").length, 16);
  assert.notEqual(hashId("a"), hashId("b"));
});

describe("ISO week math", () => {
  assert.equal(isoWeekString(isoWeekOf(new Date("2026-01-01T12:00:00Z"))), "2026-W01");
  assert.equal(isoWeekString(isoWeekOf(new Date("2027-01-01T12:00:00Z"))), "2026-W53");
  assert.equal(isoWeekString(isoWeekOf(new Date("2025-12-29T12:00:00Z"))), "2026-W01");
  assert.equal(isoWeekString(isoWeekOf(new Date("2026-06-08T12:00:00Z"))), "2026-W24");
});

describe("stableStringify", () => {
  assert.equal(
    stableStringify({ b: 1, a: { d: 2, c: 3 } }),
    `{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}`,
  );
});

describe("text helpers", () => {
  assert.equal(
    stripHtml("<p>Hello <b>world</b> &amp; more</p><script>bad()</script>"),
    "Hello world & more",
  );
  assert.equal(truncate("short", 100), "short");
  assert.equal(truncate("a".repeat(50) + " tail words here", 55).endsWith("…"), true);
});

describe("sanitizeSummary", () => {
  assert.equal(
    sanitizeSummary("See [docs](https://x.com) at https://evil.com/path now."),
    "See docs at now.",
  );
});

describe("GitBook content integration", () => {
  const page = "---\ndescription: test\n---\n\n# Page\n\nIntro.\n\n## Configure\n\nExisting.\n\n## Verify\n\nDone.\n";
  const updated = insertUnderHeading(page, "## Configure", "New supported behavior.");
  assert.ok(updated.indexOf("New supported behavior.") < updated.indexOf("## Verify"));
  assert.equal(insertUnderHeading(updated, "## Configure", "New supported behavior."), updated);

  const summary = "# Table of contents\n\n## Existing\n\n* [One](existing/one.md)\n\n## Next\n";
  const existing = addSummaryEntry(summary, "Existing", "Two", "existing/two.md");
  assert.ok(existing.includes("* [Two](existing/two.md)\n\n## Next"));
  const created = addSummaryEntry(existing, "New Category", "Three", "new-category/three.md");
  assert.ok(created.includes("## New Category\n\n* [Three](new-category/three.md)"));
});

describe("ms-whats-new parser", () => {
  const fixture = [
    "# What's new in Microsoft Intune",
    "",
    "## Week of June 1, 2026 (Service release 2606)",
    "",
    "### Device management",
    "",
    "#### Support for macOS 27 enrollment <!-- 12345 -->",
    "",
    "Intune now supports enrolling macOS 27 devices.",
    "",
    "#### Windows Autopilot improvements <!-- 99999 -->",
    "",
    "Something purely about Windows.",
    "",
    "### App management",
    "",
    "#### New app deployment options for Mac <!-- 54321 -->",
    "",
    "Deploy apps to Mac computers using new options.",
    "",
    "## Week of May 4, 2020",
    "",
    "### Old",
    "",
    "#### Ancient macOS feature <!-- 11111 -->",
    "",
    "Too old to include.",
    "",
    "## In development",
    "",
    "#### macOS future thing <!-- 22222 -->",
    "",
    "Not yet released, must be excluded.",
  ].join("\n");

  const items = parseMsWhatsNew(fixture, new Date("2026-06-11T00:00:00Z"));
  assert.equal(items.length, 2);
  const [first, second] = items;
  assert.equal(first.title, "Support for macOS 27 enrollment");
  assert.equal(first.meta.week, "Week of June 1, 2026");
  assert.equal(first.meta.release, "2606");
  assert.equal(first.meta.categoryHeading, "Device management");
  assert.equal(
    first.url,
    "https://learn.microsoft.com/en-us/intune/whats-new/#support-for-macos-27-enrollment",
  );
  assert.equal(second.title, "New app deployment options for Mac");
  // Same input -> same IDs (idempotent across runs).
  const again = parseMsWhatsNew(fixture, new Date("2026-06-11T00:00:00Z"));
  assert.deepEqual(items.map((i) => i.id), again.map((i) => i.id));
  assert.equal(slugify("Platform SSO: what's new (preview)?"), "platform-sso-whats-new-preview");
});

describe("renderers are idempotent and escape hostile content", () => {
  const state: StateFile = {
    version: 1,
    items: {
      aaaa: {
        status: "published",
        firstSeen: "2026-06-08T06:00:00.000Z",
        week: "2026-W24",
        source: "ms-whats-new",
        sourceName: "Microsoft Learn",
        url: "https://learn.microsoft.com/en-us/intune/whats-new/#x",
        title: "macOS <thing> with {braces}",
        publishedAt: "2026-06-01T00:00:00.000Z",
        summary: "A summary with *asterisks* and <tags>.",
        category: "configuration",
        tags: ["macos"],
        meta: { week: "Week of June 1, 2026", release: "2606", categoryHeading: "Device management" },
      },
      cccc: { status: "rejected", firstSeen: "2026-06-08T06:00:00.000Z" },
    },
  };

  const whatsNew1 = renderWhatsNew(state);
  const whatsNew2 = renderWhatsNew(state);
  assert.equal(whatsNew1, whatsNew2);
  assert.ok(whatsNew1.includes("Week of June 1, 2026 (Service release 2606)"));
  assert.ok(!whatsNew1.includes("<thing>"));

  // GitBook output format (no Starlight constructs and an H1 page title).
  assert.ok(whatsNew1.startsWith("---\ndescription:"), "whats-new: GitBook frontmatter");
  assert.ok(whatsNew1.includes("# What's New in Intune"), "whats-new: H1");
  assert.ok(!whatsNew1.includes("sidebar:") && !whatsNew1.includes("\ntitle:"), "whats-new: no Starlight keys");
});

console.log("\nAll pipeline self-tests passed.");
