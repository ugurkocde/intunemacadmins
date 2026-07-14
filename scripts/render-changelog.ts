import { readFileSync } from "node:fs";
import {
  renderSiteChangelog,
  renderSiteChangelogFile,
  SITE_CHANGELOG_FILE,
  CHANGELOG_FILE,
} from "./changelog";

if (process.argv.includes("--check")) {
  const expected = renderSiteChangelog(readFileSync(CHANGELOG_FILE, "utf8"));
  const actual = readFileSync(SITE_CHANGELOG_FILE, "utf8");
  if (actual !== expected) {
    throw new Error(`${SITE_CHANGELOG_FILE} is stale. Run npm run changelog:render.`);
  }
  console.log("Changelog website output is current.");
} else {
  renderSiteChangelogFile();
  console.log(`Rendered ${SITE_CHANGELOG_FILE}.`);
}
