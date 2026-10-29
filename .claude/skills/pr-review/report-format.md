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
