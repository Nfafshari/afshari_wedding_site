# Standards

The rules the code already follows, plus the anti-bloat rules agents must follow. When this file and the code disagree, say so in the PR rather than silently picking one.

Canonical example of a well-formed action: [checklist/action.ts](../src/app/(protected)/planner/checklist/action.ts).

## Anti-bloat

- Do the smallest thing that satisfies the acceptance criteria.
- No abstraction until the third real use. Two similar blocks are fine.
- No unrequested refactors, renames, formatting sweeps, or new dependencies. Note them as follow-ups instead.
- No comments that restate the code, and no error handling for cases that can't happen. Comment the *why* when it isn't obvious.
- Reuse before adding: check `src/components/ui/` (shadcn), `src/components/`, `src/hooks/`, and `src/lib/` first.
- Don't edit files unrelated to the issue.

## Structure

- Each planner page is a trio: `page.tsx` (Server Component, fetches with Prisma), `client.tsx` (interactive parts), `action.ts` (Server Actions for writes). Dialogs live beside them.
- Scaffold new ones with `pnpm generate page <name> --protected`.
- Filter state lives in URL search params, not component state.
- Path alias: `@/*` maps to `src/*`.

## Server Actions

- File starts with `"use server"`.
- First line of every action: `const guard = await requireUserAction(); if (!guard.ok) return guard;`
- Return `ActionResult`: `{ ok: true }` or `{ ok: false; error: string; field?: ErrorField; authRequired?: true }`. Never throw to the client for expected failures.
- Validate and trim on the server. Convert Prisma errors to specific messages (`P2002` unique, `P2025` not found). Log unexpected errors and return a generic message.
- `revalidatePath(...)` after a successful write.

## Auth

Three layers, all required: `src/proxy.ts` matcher on `/planner/:path*`, `requireUser()` in Server Components and fetchers, `requireUserAction()` in Server Actions. See [README.md](../README.md#auth) for why.

## Database

- Prisma client only via `@/lib/prisma`. Generated client in `src/generated/` is never hand-edited.
- Schema changes need a migration: `pnpm prisma migrate dev --name <name>`. Never edit an applied migration.
- Choose `onDelete` deliberately (Cascade for children meaningless without a parent; Restrict for records of real activity). Index foreign keys.

## Styling

Theme colors are defined in `src/app/globals.css` and exposed as Tailwind color tokens: `burg` (= foreground), `cream` (= background), `gold`, `olivine`. Use them as `text-burg`, `bg-cream`, etc. Mobile-first with `md:`/`lg:`. Use existing utility classes (`page-title`, `section-title`, `stat-number`). (The README still describes the older `bg-(--burg)` form; treat the code as correct.)

## Tests

- Vitest. Run with `pnpm test`.
- Unit tests are colocated and named `<file>.test.ts` (for example `src/lib/utils.test.ts`). Whole-codebase structural tests (for example "every Server Action is guarded") live in `tests/`.
- Import `describe`, `it`, `expect` explicitly from `vitest`; don't enable globals.
- A new test must be seen failing once: break the thing it guards, confirm the test fails, then revert.

## Git

- Branch off `master` as `feature/NFA-<number>-short-slug` (for example `feature/NFA-13-record-linear-setup`). The `NFA-<number>` is the Linear issue ID, which is what links the branch and PR to the issue. Use the same slug as the issue title, lowercase, hyphenated.
- One issue = one branch = one PR.
- Linear's own "copy branch name" gives a different format (`nathenafshari/nfa-13-...`). Don't use it; use the format above.

## Demo sandbox parity

`src/app/(public)/single-instance-planner/` mirrors the planner with in-memory state. Rules:

- It must never import `prisma` or touch the DB. Its actions take the store as an argument.
- A planner behavior change is mirrored there with the same validation and error strings, or the PR explains why not.
- This duplication is planned for removal; don't deepen it.

## Definition of done

A change is done only when all of these are true and reported with real output:

1. `pnpm lint` passes.
2. `pnpm build` passes (includes type-checking).
3. Every acceptance criterion in the issue is demonstrably met.
4. Nothing outside the issue's scope was changed.
5. Demo parity and auth rules above are respected.
6. For anything touching production behavior, the relevant smoke-test steps are listed in the PR checklist.

If any check fails or was skipped, say so plainly. Do not claim done.
