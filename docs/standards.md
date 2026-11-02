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

## UI

Every rule below is shown live at [`/planner/ui-kit`](../src/app/(protected)/planner/ui-kit/page.tsx); each heading names its section anchor. Check the kit before adding anything new, and add a kit example when you add a variant.

### Tokens (`#palette`, `#roles`, `#contrast`)

- Colors come from tokens in `src/app/globals.css`. Use the semantic roles (`bg-card`, `text-muted-foreground`, `bg-accent`, `text-destructive`) or the brand tokens (`text-burg`, `bg-cream`, `gold`, `olivine`). **No hex values and no raw Tailwind palette classes** (`text-gray-500`, `bg-white`).
- Gold or olivine text and icons on a light background use `text-gold-ink` / `text-olivine-ink`, never the brand shades. Brand gold works as text only on burgundy and in the logo and script title.
- `text-muted` is a surface, not a text color: secondary text is `text-muted-foreground` or `text-burg/70`. Text opacity stops at `/70`, and error text is solid `text-destructive`.
- Every text/background pairing in use is listed in the kit's contrast table and must pass WCAG AA (4.5:1 text, 3:1 large text and UI parts). A new pairing, including a see-through one like `bg-olivine/15`, gets a row there.
- Allowed exceptions (from the NFA-40 scan): Google's brand colors in `google-sign-in-button.tsx`, the Recharts selectors in `ui/chart.tsx`, and `bg-black/…` scrims behind overlays (sheet, lightbox, image hover).

### Type, radius, elevation (`#type`, `#radius`, `#elevation`)

- Headings, titles and stat numbers use the type utilities (`page-title`, `page-subtitle`, `section-title`, `stat-number`, `muted-caption`); everything else is Lora by default. Don't set a font family by hand.
- Radius and shadows come from tokens (`rounded-sm`…`rounded-xl`, `shadow-xs`…`shadow-lg`), never bare `rounded`/`shadow` or arbitrary values.

### Components (`#primitives`)

- Pick a `variant` by purpose and don't add color classes to `Button`, `Badge` or fields: `default` for the page's one main action, `secondary` beside it, `ghost` for quiet actions and edit icons, `ghost-destructive` for trash icons, `destructive` only to confirm a delete, `outline` with `aria-pressed` for toggles. Badge tones are `neutral`/`success`/`warning`/`danger`.
- Form fields are see-through with a `border-input` outline, from the base components; don't give them a background. Mark an invalid field with `aria-invalid` and put its message right under it.

### Dialogs (`#modals`)

- Forms use `FormDialog`, inside the page's `<Dialog>` root (inner non-submit buttons need `type="button"`). Deletes use `ConfirmDialog`. Nothing else uses `AlertDialog`.
- Titles are noun phrases in title case ("Add Category", "Edit Flowers"); confirms ask ("Delete Flowers?") and say the consequence. Buttons say what happens ("Add", "Save changes", "Delete"), and the toast repeats the verb ("Category added").
- Esc and a click outside close a form, never while it saves. After a delete, focus moves to the page header's main action (handled by `ConfirmDialog`).

### Tables (`#tables`)

- Each table keeps its own markup and `<colgroup>`; styling comes from the variants on `ui/table.tsx`: rows `heading` / `group` / `default` / `static`, `<TableBody variant="group">` to close a group, `<TableHead variant="label">` for column labels (written in sentence case), and `numeric` on money and count cells.
- Row actions are `RowActionButton`s at the end of the row, always visible, each labelled with the row's name.
- On phones nothing scrolls sideways: columns that don't fit fold into a subline under the name (`hidden md:table-cell` on the cell, a zero-width `<col>` on mobile).

### Page chrome (`#page-chrome`)

- Planner pages wrap their content in `PlannerPage` and open with `PageHeader`; the main "Add …" goes in its `actions`. Data that isn't there yet shows `EmptyState` with that same action, never a blank area. Loading routes show `TableSkeleton` (or a skeleton of the page's shape).
- Nav labels, page titles and card titles use one word per page, from `src/lib/planner-nav.ts`: Dashboard, Checklist, RSVPs, Budget, Registry, Documents.

### Guest site (`#guest`)

- Guest pages set text in Montserrat (`font-guest`, from the public layout and the footer) and headings in Cormorant; the planner keeps Lora.
- Guest pages are built from full-width `GuestSection` bands (cream, olivine, burgundy) with centred text, not planner cards. Headings use `guest-display`, the "and" between the names `guest-script`, small capitals `guest-label` (gold ink, or `text-gold` on burgundy). `Sprig` divides blocks; painted art goes in an `ArtSlot`, which is decorative.
- The nav comes from `src/lib/public-nav.ts` and lists only pages that exist. Copy lives in `src/lib/guest-content.ts`, so words change without touching layouts.
- The header's links show from `lg`; below that the menu opens `GuestNavDrawer`. One `Footer` serves the whole site.

### Copy

- Buttons and labels in sentence case ("Add party", "Save changes"); dialog and page titles in title case.
- Dates read like "Oct 3, 2026" and come from `formatDate` in `src/lib/utils.ts` (pinned to Central time so server and browser agree). Don't call `toLocaleDateString()` in a component.
- Say what happens or what to fix: "Enter an email like name@example.com", not "Invalid input". Empty states say what will show up and offer the next step.

### Accessibility

- Every interactive element is a real `<button>` or `<a>` (never an icon or `div` with `onClick`) and shows a visible focus ring when reached by keyboard.
- Icon-only buttons need an `aria-label` that names the row or thing they act on. Toggles use `aria-pressed`; the current nav link uses `aria-current="page"`.
- Never rely on color alone: pair a status color with a word or an icon.
- Mobile-first with `md:`/`lg:`; every planner page must work at 320px with no sideways scroll.

(The README still describes the older `bg-(--burg)` form; treat the code as correct.)

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
