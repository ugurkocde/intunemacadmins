import { REVIEW_MAX_MONTHS, REVIEW_STALE_MONTHS } from "../config";
import type { DocPage, Finding } from "../types";

// Flags pages not verified in a while. Uses frontmatter `lastReviewed` when
// present (explicit reviewer intent), otherwise the git last-commit date passed
// in by the caller. A typo-fix commit resets git mtime but not lastReviewed, so
// lastReviewed is the stronger signal once pages adopt it.
export function checkReviewAge(
  page: DocPage,
  gitDate: string | null,
  now: Date,
): Finding[] {
  const explicit =
    typeof page.frontmatter.lastReviewed === "string"
      ? page.frontmatter.lastReviewed
      : null;
  const basis = explicit ?? gitDate;
  if (!basis) return [];
  const reviewed = new Date(basis);
  if (Number.isNaN(reviewed.getTime())) return [];

  const months = monthsBetween(reviewed, now);
  if (months < REVIEW_MAX_MONTHS) return [];

  // Review-age is a backlog signal, not a confirmed error, so it stays low
  // severity (the renderer groups it separately from specific findings). The
  // age is in the message so the backlog can be prioritized oldest-first.
  void REVIEW_STALE_MONTHS;
  const source = explicit ? "last reviewed" : "last changed";
  return [
    {
      check: "review-age",
      severity: "low",
      location: page.path,
      message: `Not verified in ${months} months (${source} ${reviewed
        .toISOString()
        .slice(0, 10)}).`,
    },
  ];
}

function monthsBetween(from: Date, to: Date): number {
  return Math.max(
    0,
    (to.getFullYear() - from.getFullYear()) * 12 +
      (to.getMonth() - from.getMonth()),
  );
}
