# Report format

Print exactly this structure. Headings are fixed so the report can be scanned (and, later, parsed). Leave out empty sections, **except** Issue alignment, Declined to judge, and Lenses, which are always present.

```markdown
### PR review: #<n> <title>            (pre-PR mode: "### Branch review: <branch>")

**Summary.** <what the change does, in plain words>. Verdict: <"no blocking issues" | "N blocking issues">.
Mode: <PR | pre-PR>   State: <open | draft | closed | merged | n/a>   Head: <short sha>

#### Blocking
1. **<short title>** (VERIFIED, lens C) <what is wrong, and the scenario: input -> wrong outcome, or who is affected> — `path/to/file.ts:123` — Rule: "<quoted rule or criterion>"

#### Should fix
2. **<short title>** (INFERRED, lens A+B) ... — `path:line` — Rule: "..."

#### Consider
3. ...

#### Issue alignment
| Acceptance criterion | Status | Evidence |
|---|---|---|
| <criterion, quoted> | met / partly / not met / not verifiable | `path:line`, a test, or why it cannot be checked here |

Scope: <any change outside scope in that the PR body discloses; any touch of scope out>
PR requirements: <title, branch, template headings, Linear line, one issue per PR: each met or missed, with the evidence; in pre-PR mode only the branch name>

#### CI failures
<per failing check: root cause, caused by this PR or already failing on the base branch, the fix>

#### Tests
<missing cases (lens E), or "covered", or "no logic changed">

#### What to click-test
<2 to 5 clicks or commands to do on the preview or locally to see this change work. If there is no visible change, say what to run instead.>

#### Declined to judge
- <a behaviour or candidate set aside, and the reason; for example "candidate without a quotable rule: ...">
(write `none` if there was nothing)

#### Lenses
C ran · D skipped (no failing checks) · A ran · B ran without the skill · E skipped (no logic change in src/lib, action.ts, or auth files) · F skipped (no UI) · H skipped (no UI) · G skipped (no auth, config, or dependency change)
```

## Rules for the report

- **Every finding** carries a label (VERIFIED or INFERRED), the lens letter(s), a `path:line`, and a quoted `Rule:`. A finding without both a location and a quoted rule belongs in Declined to judge, not here.
- **Number findings continuously** across Blocking, Should fix, and Consider so they can be referred to by number.
- **Lenses line:** list every lens A to H. Each is exactly one of: `ran`, `ran without the skill`, `could not run: <reason>`, `skipped (<the trigger that did not match>, or docs-only, or deletion-only)`, or `disabled`. `could not run` is only for a lens that was dispatched and failed.
- **Docs-only diffs:** only lens C runs; the other lenses read `skipped (docs-only)`.
- **Pre-PR mode:** CI failures reads `no CI before a PR exists`; the PR-requirements checks are limited to the branch name.
- If nothing survived verification, write under the Summary: `No issues found.` Never invent a finding to fill the template.

## Draft PR description (pre-PR mode only)

After the report, in pre-PR mode, print one more fenced markdown block: a draft body the author can save and pass to `gh pr create --body-file`. PR mode never prints it (the PR already has a body). Build it from what steps 1 and 2 gathered and the verified findings; it adds no lens and no extra cost.

The six headings are copied from `.github/pull_request_template.md`, same text and same order. `tests/pr-review-draft.test.ts` fails if they drift. Do not rename, drop, or reorder them, and do not copy the template's HTML comments.

```markdown
## Summary

Linear issue: NFA-<n> (parent: NFA-<n>, Track <n>).

<what changed and why, in a short paragraph; say what is NOT changed if the issue could be read more broadly>

## Walkthrough

1. `<path>`: <why a reader starts here>
2. `<path>`: <why next>

## Verified

Not run by the reviewer (the review is read-only). Author: run these and fill in the real results before opening.

- `pnpm lint`:
- `pnpm exec tsc --noEmit`:
- `pnpm test`:
- `pnpm build`:

## Calls I made (please check)

- <a choice the diff makes that the issue did not make for the author>

## By-hand checklist

- [ ] CI `checks` is green (required to merge)
- [ ] <each acceptance criterion, quoted>
- [ ] <each risk flag the diff trips>

## Out of scope / follow-ups

- <scope-out lines the diff touched or came near, and anything noticed and rightly left alone>
```

Rules for the draft:

- **Walkthrough order:** follow the change top to bottom: schema or migration, then `src/lib`, then actions and routes, then UI, then tests, then docs. Give each step its *why*. Group a large deletion into one line ("52 files under X").
- **Verified:** never invent a result. The reviewer does not run project commands, so the commands stay listed with empty results for the author to fill in. Write `None` only if the diff has no code.
- **Calls I made:** inferred from the diff, so they are candidates. Write `None` if nothing was chosen beyond the issue.
- **By-hand checklist:** the `CI checks` line first, then every acceptance criterion of the Linear issue verbatim, then one box per risk flag, decided from the changed paths so it works even when lens G was skipped: `src/auth*.ts`, `src/proxy.ts`, `src/lib/require-user.ts` or any `action.ts` (auth); `src/prisma/migrations/**` (migration); `.env*` or a new `process.env` read (env var); any removed file or a `delete` call (destructive); `package.json`, `pnpm-lock.yaml`, or `.github/workflows/**` (dependencies or CI).
- **Out of scope:** the issue's scope-out lines that the diff touched or came near, plus anything a lens noticed that the diff rightly left alone. Link the Linear issue if one exists.
- If the Linear issue could not be read, say so in the Summary line instead of guessing; do not invent criteria.
