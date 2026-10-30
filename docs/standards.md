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

These are enforced by `tests/auth-guards.test.ts`. A Server Action must start with `const guard = await requireUserAction();` followed by `if (!guard.ok) { return guard; }`. An action or route handler that is meant to be public must be added to the allowlist at the top of that test, with the reason in the PR.

## Database

- Prisma client only via `@/lib/prisma`. Generated client in `src/generated/` is never hand-edited, and never committed (it is gitignored and regenerated on install and build).
- `tests/standards.test.ts` enforces this: any file other than `src/lib/prisma.ts` that does `new PrismaClient(...)` fails the test unless it is added to `CLIENT_ALLOWLIST` there, with a reason on the line and a justification in the PR. The legitimate case is a standalone script that runs outside Next and can't use the singleton.
- Schema changes need a migration: `pnpm prisma migrate dev --name <name>`. Never edit an applied migration.
- Choose `onDelete` deliberately (Cascade for children meaningless without a parent; Restrict for records of real activity). Index foreign keys.

## Styling

Theme colors are defined in `src/app/globals.css` and exposed as Tailwind color tokens: `burg` (= foreground), `cream` (= background), `gold`, `olivine`. Use them as `text-burg`, `bg-cream`, etc. Prefer the semantic roles (`bg-card`, `text-muted-foreground`, `bg-accent`, `text-destructive`); for gold or olivine text and icons on light backgrounds use `text-gold-ink` / `text-olivine-ink`, never the brand shades. No hex values or raw Tailwind palette classes. Fonts: headings, titles and stat numbers use the type utilities (Cormorant); everything else is Lora by default, so don't set a font family by hand. Radius and shadows come from tokens (`rounded-sm`…`rounded-xl`, `shadow-xs`…`shadow-lg`), never bare `rounded`/`shadow` or arbitrary values; form fields get `bg-field` from the base components, so don't override their background. Buttons and badges: pick a `variant` by purpose (`ghost` for quiet actions, `ghost-destructive` for trash icons, `destructive` to confirm a delete, `outline` with `aria-pressed` for toggles; badge tones `neutral`/`success`/`warning`/`danger`) and don't add color classes to `Button`, `Badge` or fields. Icon-only buttons need an `aria-label`. Every color, role, type style, radius and shadow is shown live at `/planner/ui-kit`. Mobile-first with `md:`/`lg:`. Use existing utility classes (`page-title`, `section-title`, `stat-number`). (The README still describes the older `bg-(--burg)` form; treat the code as correct.)

## Tests

- Vitest. Run with `pnpm test`.
- Unit tests are colocated and named `<file>.test.ts` (for example `src/lib/utils.test.ts`). Whole-codebase structural tests (for example "every Server Action is guarded") live in `tests/`.
- Import `describe`, `it`, `expect` explicitly from `vitest`; don't enable globals.
- A module that reads env vars when it loads (like `src/auth.config.ts`) needs `vi.stubEnv(...)`, then `vi.resetModules()`, then a dynamic `import(...)` in each test; restore with `vi.unstubAllEnvs()` in `afterEach`.
- A new test must be seen failing once: break the thing it guards, confirm the test fails, then revert.

## Git

- Branch off `master` as `feature/NFA-<number>-short-slug` (for example `feature/NFA-13-record-linear-setup`). The `NFA-<number>` is the Linear issue ID, which is what links the branch and PR to the issue. Use the same slug as the issue title, lowercase, hyphenated.
- One issue = one branch = one PR.
- Linear's own "copy branch name" gives a different format (`nathenafshari/nfa-13-...`). Don't use it; use the format above.

## Definition of done

A change is done only when all of these are true and reported with real output:

1. `pnpm lint` passes.
2. `pnpm exec tsc --noEmit` passes (type-check).
3. `pnpm test` passes.
4. `pnpm build` passes.
5. Every acceptance criterion in the issue is demonstrably met.
6. Nothing outside the issue's scope was changed.
7. The auth rules above are respected.
8. For anything touching production behavior, the relevant smoke-test steps are listed in the PR checklist.

CI runs checks 1 to 4 on every PR and they must be green to merge. A new test also has to be seen failing once (see Tests).

If any check fails or was skipped, say so plainly. Do not claim done.
