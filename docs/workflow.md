# Workflow

How an idea becomes shipped code. Each step exists to fix a specific failure: bloat, unreviewable diffs, or "done" that isn't.

```
Idea -> Linear issue -> Plan together -> Branch + implement -> PR (walkthrough + checklist)
     -> Review (CI; /pr-review on demand) -> Hand test -> Merge -> Deploy + smoke test
```

## 1. Capture: a Linear issue

Every change starts as an issue, so nothing is built blind and the agent has a boundary.

An issue has:

- **Problem**: what is wrong or missing, and for whom. One or two sentences.
- **Scope in**: what this issue will change.
- **Scope out**: what it will deliberately not touch. This is the main defense against bloat.
- **Acceptance criteria**: observable pass/fail statements ("Adding a category with a duplicate name shows 'Category already exists' on the name field"). These become the by-hand test checklist in the PR, so write them as things you can click through.

*Why:* a well-scoped issue is the contract. If a change isn't traceable to the issue, it doesn't belong in the PR.

## 2. Plan together

Before any code, the agent interviews you: it asks questions, proposes a design with trade-offs, and recommends one. You approve or push back. Design decisions (data model, where logic lives, new dependencies) are yours.

*Why:* design is the part you want to own, and a plan is far cheaper to correct than a finished diff.

## 3. Branch and implement

- Branch off `master`: `feature/NFA-<number>-short-slug` (for example `feature/NFA-13-record-linear-setup`). See [standards.md](standards.md#git).
- One issue = one PR. If the plan grows, split it into more issues instead of a bigger PR.
- Follow [standards.md](standards.md). Commit in small steps with messages that say why.
- Before opening the PR: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm build` all pass, with real output reported. These are the same four checks CI runs.

*Why:* small, single-purpose diffs are the only kind a human can actually follow.

## 4. Pull request

The description follows [`.github/pull_request_template.md`](../.github/pull_request_template.md). Its six headings, in order:

1. **Summary**: what changed and why, plus the Linear issue (`Linear issue: NFA-<n>`), which is also what attaches the PR to the issue.
2. **Walkthrough**: a short, ordered tour of the change ("start in `action.ts`: new validation; then `client.tsx`: new field; ...") with the *why* for each step.
3. **Verified**: only the commands that were actually run, with their real results.
4. **Calls I made (please check)**: decisions the issue didn't make for you.
5. **By-hand checklist**: the acceptance criteria as checkboxes, plus anything risky the diff touches (auth, migrations).
6. **Out of scope / follow-ups**: anything noticed but deliberately not changed.

Write "None" under a heading that doesn't apply instead of deleting it, and delete the template's `<!-- -->` prompts when filling it in. These six names are a contract: the `/pr-review` skill checks for the same headings, so rename one only together with the skill.

GitHub pre-fills the template in the web UI, but `gh pr create --body "..."` does **not**. When opening a PR from the command line, fill in the template file and pass it with `--body-file`.

*Why:* it turns "review a diff" into "follow a guided tour, then verify behavior."

## 5. Review

- **CI** (`.github/workflows/ci.yml`): on every PR to `master`, a clean install then lint, type-check, tests (`pnpm test`), and build, using placeholder env vars. Deterministic; it can't talk itself into "looks fine." The tests include structural checks that fail if a Server Action, planner fetcher, route handler, or the proxy matcher loses its auth protection.
- **`/pr-review`** (optional, on demand; see below): a deeper review of judgment items CI can't see. Run it when a change is risky or you ask for it, not on every PR.
- **You**: hand-test against the checklist on the Vercel preview deployment, then read the walkthrough for design fit.

### On-demand review: `/pr-review`

- **What it is.** A manual-only skill in `.claude/skills/pr-review/`. It runs a fresh reviewer that starts several review *lenses* as subagents (chosen by which files changed), verifies each finding against the code, and prints one report. It is read-only: the harness denies the Edit, Write, and NotebookEdit tools, and Bash is limited by instruction only. No GitHub-based reviewer is used, and nothing is posted to the PR.
- **How to run it.** You type it; an agent cannot. `/pr-review <number>` reviews an open or merged PR. `/pr-review` with no number reviews the current branch's committed work before a PR exists. If the skill is not in the list, type `/reload-skills`.
- **Cost, and when it is worth it.** A full review is expensive: about 250,000 tokens for five lenses on one PR. A docs-only PR is about a minute and starts no lens subagents. Use it for risky changes (auth, migrations, deleting live code) or when you want a second look, **not by default**. To trim it, edit the `Disabled lenses:` line at the top of `SKILL.md` (for example `A, B` drops the two generic code-review lenses).
- **What comes back.** The headings in `report-format.md`. Every finding carries a `path:line` and a quoted rule or acceptance criterion; anything that can't be backed up that way goes under "Declined to judge" instead.
- **After a review.** The author session fixes the VERIFIED **Blocking** and **Should fix** findings: the smallest change that resolves each one, a behavior fix gets a test seen failing first, and commits go on the same PR branch (no force-push). Then re-run the review, and **stop after two rounds**. **Consider** and INFERRED findings, and anything that would change the design, are left for you. Nothing is merged.
- **What the lenses call.** Skills from these plugins: `code-review`, `frontend-design`, `engineering` (code-review, debug, testing-strategy), `design` (accessibility-review, design-system, design-critique, ux-copy), plus the built-in `security-review`. A missing one never blocks a review; that lens falls back to its own description and is labelled "ran without the skill". Install commands live in one place, the Install section of `SKILL.md`.
- **Status and known gaps.** First version, partly verified. The debugging, testing, and security lenses, the missing-plugin fallback, and several fixes made after the first runs have not been re-tested; the full evaluation (NFA-29) is deferred because of the cost. Treat a clean report as evidence, not proof.

## 6. Merge and verify

Merge to `master` (Vercel deploys). Run the relevant part of [release-smoke-test.md](release-smoke-test.md) against production. Mark the issue done only after that.

### Merge protection

A GitHub ruleset on `master` enforces the process:

- Changes must come in through a pull request (no direct pushes).
- The `checks` status (lint, type-check, tests, build) must pass.
- No approvals are required (a solo repo can't approve its own PR).
- Force-push and branch deletion are blocked.
- Repository admins can bypass. That is for emergencies only; if you use it, say why in the PR or issue.

Red means don't merge. If the `checks` job id in `.github/workflows/ci.yml` is ever renamed, update the ruleset in the same change.

## Linear integration

The Linear MCP lets the agent read and write issues directly, so the issue is the contract in both directions.

- **Workspace:** team `NFA` (Nfafshari-personal), project **Workflow and small app refactor**.
- **Connect:** run `/plugin` in Claude Code and authenticate `linear`. Tools load on demand (deferred), so ask the agent to load them if a session doesn't see them.
- **Tools:** `list_issues` (filter by `project`, `state`, `parentId`) and `get_issue` to read; `save_issue` to create or update (with `id` it updates; `parentId` makes a sub-issue); `list_projects`, `list_teams`, `list_issue_labels` to look things up.
- **Labels:** `Feature`, `Improvement`, `Bug`.
- **Statuses seen so far:** Backlog, In Review, Done. Set a sub-issue to In Review when its PR opens; set Done after the smoke test passes.
- **Structure:** a big goal is a parent issue; the decided steps are sub-issues. Don't create sub-issues for work that hasn't been planned yet.
- **Branch and PR linking:** the `NFA-<number>` in the branch name (see [standards.md](standards.md#git)) and in the PR description is what attaches the PR to the issue. Always put the issue ID in the PR body.

## Housekeeping

- `master` is the only long-lived branch. Stale branches (`develop`, `22-finalize-rsvp-structure`, `24-hookup-budget-page-to-db`, `checklist__page`) should be merged or deleted as a separate chore.
