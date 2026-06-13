# Self-hosted runner for the content pipeline

The **Content pipeline** workflow runs on a self-hosted runner so it executes
from a residential IP. This unblocks the two sources that GitHub's datacenter
IPs get blocked from:

- **Reddit** (public RSS returns HTTP 429 from cloud IPs; works from home — no
  API credentials needed)
- **Rockenroll** and any other blog that blocks datacenter IP ranges

The **Docs freshness** and **Link check** workflows stay on GitHub's cloud
runners (`ubuntu-latest`) — their sources (Microsoft Learn, Apple) are reachable
from anywhere, so they keep running even if the self-hosted machine is off.

A manual run of the content pipeline can still target the cloud via the
**runner** input (`ubuntu-latest`) — handy for testing without the runner.

## Requirements on the runner machine

- Always-on (a Mac mini, home server, or Raspberry Pi is ideal; a laptop that's
  often closed will miss the Monday schedule).
- macOS or Linux, on your home/office network.
- Tools on PATH: `git`, `gh` (GitHub CLI), `jq`. Node is provided by the
  workflow via `actions/setup-node`, but Node 22+ system-wide is a safe backup.
  - macOS: `brew install gh jq`

`gh` and `jq` are required because the pipeline's "report source failures as
issues" step uses them (GitHub's cloud runners ship them preinstalled; a
self-hosted runner does not).

## One-time setup

1. In GitHub: **Settings → Actions → Runners → New self-hosted runner**.
2. Pick the runner's OS and follow the shown **Download** and **Configure**
   commands verbatim (they include a one-time registration token). Accept the
   default labels — they must include `self-hosted`.
3. Install it as a service so it runs without a terminal and survives reboots:
   - macOS / Linux: `./svc.sh install && ./svc.sh start`
4. Confirm it shows **Idle** under Settings → Actions → Runners.

## Verify

- Actions → **Content pipeline** → **Run workflow** with `runner = self-hosted`.
- The run should fetch Reddit and Rockenroll successfully and open the weekly PR.

## Notes

- If the machine is off when the Monday 06:00 UTC schedule fires, the job queues
  and runs when the runner next comes online; GitHub cancels it if the runner
  stays offline past the queue window. Keep the machine on around Mondays.
- Security: this is safe on a public repo because these workflows trigger only on
  `schedule` and `workflow_dispatch` — never on `pull_request` from forks — so
  outside contributors cannot execute code on your runner.
