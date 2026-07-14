#!/usr/bin/env bash
set -euo pipefail

pr_number="${1:?pull request number is required}"
validation_check="${2:-Validate docs automation}"
preview_check="GitBook - docs.intunemacadmins.com/"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
owner="${repo%%/*}"
name="${repo#*/}"

head_sha=$(gh pr view "$pr_number" --repo "$repo" --json headRefOid --jq .headRefOid)
echo "Waiting for ${validation_check} on ${head_sha}"

checks_seen=false
for _ in $(seq 1 60); do
  checks=$(gh pr view "$pr_number" --repo "$repo" --json statusCheckRollup)
  validation_count=$(jq --arg check "$validation_check" \
    '[.statusCheckRollup[] | select((.name // .context // "") == $check)] | length' <<<"$checks")
  preview_count=$(jq --arg check "$preview_check" \
    '[.statusCheckRollup[] | select((.name // .context // "") == $check)] | length' <<<"$checks")
  if [ "$validation_count" -gt 0 ] && [ "$preview_count" -gt 0 ]; then
    checks_seen=true
    break
  fi
  sleep 10
done

if [ "$checks_seen" != true ]; then
  echo "The validation and GitBook preview checks did not both appear for ${head_sha}."
  exit 1
fi

# Wait for every check currently associated with the PR. This includes the
# repository validation workflow plus GitBook/Vercel preview checks.
gh pr checks "$pr_number" --repo "$repo" --watch --interval 10 --fail-fast

checks=$(gh pr view "$pr_number" --repo "$repo" --json statusCheckRollup)
validation_success=$(jq --arg check "$validation_check" \
  '[.statusCheckRollup[] | select((.name // .context // "") == $check) | select(.status == "COMPLETED" and .conclusion == "SUCCESS")] | length' <<<"$checks")
if [ "$validation_success" -lt 1 ]; then
  echo "${validation_check} did not finish successfully."
  exit 1
fi
preview_success=$(jq --arg check "$preview_check" \
  '[.statusCheckRollup[] | select((.name // .context // "") == $check) | select(.state == "SUCCESS")] | length' <<<"$checks")
if [ "$preview_success" -lt 1 ]; then
  echo "${preview_check} did not finish successfully."
  exit 1
fi

pr_json=$(gh pr view "$pr_number" --repo "$repo" \
  --json state,headRefOid,mergeable,reviewDecision)
current_head=$(jq -r .headRefOid <<<"$pr_json")
state=$(jq -r .state <<<"$pr_json")
mergeable=$(jq -r .mergeable <<<"$pr_json")
review_decision=$(jq -r '.reviewDecision // ""' <<<"$pr_json")

if [ "$current_head" != "$head_sha" ]; then
  echo "PR head changed from ${head_sha} to ${current_head}; refusing a stale merge."
  exit 1
fi
if [ "$state" != "OPEN" ] || [ "$mergeable" != "MERGEABLE" ]; then
  echo "PR is not ready: state=${state}, mergeable=${mergeable}."
  exit 1
fi
if [ "$review_decision" = "CHANGES_REQUESTED" ]; then
  echo "A review requested changes; refusing to merge."
  exit 1
fi

unresolved=$(gh api graphql \
  -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved}}}}}' \
  -f owner="$owner" -f name="$name" -F number="$pr_number" \
  --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length')
if [ "$unresolved" -ne 0 ]; then
  echo "${unresolved} unresolved review thread(s) remain; refusing to merge."
  exit 1
fi

# The repository ruleset requires a review. The automation token has an admin
# bypass, used only after validation succeeded for the exact current head.
gh pr merge "$pr_number" --repo "$repo" --squash --delete-branch --admin

merge_sha=$(gh pr view "$pr_number" --repo "$repo" --json mergeCommit --jq .mergeCommit.oid)
default_sha=$(gh api "repos/${repo}/branches/main" --jq .commit.sha)
if [ "$default_sha" != "$merge_sha" ]; then
  relation=$(gh api "repos/${repo}/compare/${merge_sha}...main" --jq .status)
  if [ "$relation" != "ahead" ] && [ "$relation" != "identical" ]; then
    echo "Merged commit ${merge_sha} is not on main (main=${default_sha}, relation=${relation})."
    exit 1
  fi
fi

echo "Monitoring publication checks for merged commit ${merge_sha}"
for _ in $(seq 1 60); do
  statuses=$(gh api "repos/${repo}/commits/${merge_sha}/status")
  gitbook=$(jq -r '[.statuses[] | select(.context == "GitBook - docs.intunemacadmins.com/")][0].state // "missing"' <<<"$statuses")
  vercel=$(jq -r '[.statuses[] | select(.context == "Vercel")][0].state // "missing"' <<<"$statuses")
  if [ "$gitbook" = "failure" ] || [ "$gitbook" = "error" ] || [ "$vercel" = "failure" ] || [ "$vercel" = "error" ]; then
    echo "Publication failed: GitBook=${gitbook}, Vercel=${vercel}."
    exit 1
  fi
  if [ "$gitbook" = "success" ] && [ "$vercel" = "success" ]; then
    echo "Publication succeeded: GitBook=${gitbook}, Vercel=${vercel}."
    exit 0
  fi
  sleep 10
done

echo "Publication checks did not finish: GitBook=${gitbook:-missing}, Vercel=${vercel:-missing}."
exit 1
