# Workflow

How an idea becomes shipped code. Each step exists to fix a specific failure: bloat, unreviewable diffs, or "done" that isn't.

```
Idea -> Linear issue -> Plan together -> Branch + implement -> PR (walkthrough + checklist)
     -> Review (pr-review skill + CI) -> Hand test -> Merge -> Deploy + smoke test
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
- Before opening the PR: `pnpm lint` and `pnpm build` pass, with real output reported.

*Why:* small, single-purpose diffs are the only kind a human can actually follow.

## 4. Pull request

The description contains:

1. **Link** to the Linear issue.
2. **Walkthrough**: a short, ordered tour of the change ("start in `action.ts`: new validation; then `client.tsx`: new field; ...") with the *why* for each step.
3. **By-hand checklist**: the acceptance criteria as checkboxes, plus anything risky the diff touches (auth, migrations, demo parity).
4. **Out of scope / follow-ups**: anything noticed but deliberately not changed.

*Why:* it turns "review a diff" into "follow a guided tour, then verify behavior."

## 5. Review

- **CI** (coming in Track 2): lint, types, build. Deterministic; it can't talk itself into "looks fine."
- **pr-review skill** (coming in Track 3): run before opening the PR and while it is open. Checks judgment items: matches the plan, anything out of scope, bloat, demo parity, auth rules. Its output feeds the walkthrough and checklist.
- **You**: hand-test against the checklist on the Vercel preview deployment, then read the walkthrough for design fit.

## 6. Merge and verify

Merge to `master` (Vercel deploys). Run the relevant part of [release-smoke-test.md](release-smoke-test.md) against production. Mark the issue done only after that.

## Linear integration

The Linear MCP lets the agent read and update issues directly. Setup status and the exact tool names are recorded here once connected.

## Housekeeping

- `master` is the only long-lived branch. Stale branches (`develop`, `22-finalize-rsvp-structure`, `24-hookup-budget-page-to-db`, `checklist__page`) should be merged or deleted as a separate chore.
