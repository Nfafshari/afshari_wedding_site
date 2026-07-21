# Afshari Wedding Site

A wedding website and private planning dashboard for Piper & Nathen — **September 11, 2027**.

Built with Next.js 16 (App Router), React 19 Server Components + Server Actions, Prisma 7 against PostgreSQL, and Tailwind CSS v4 + shadcn/ui.

## What's in here

The app is split into three surfaces:

| Surface | Route | Auth | Data |
|---|---|---|---|
| **Public site** | `/` | none | — (placeholder page while the guest-facing site is built) |
| **Demo sandbox** | `/single-instance-planner` | none | in-memory React state, seeded per visitor |
| **Planner** | `/planner/*` | Google sign-in + allow list | PostgreSQL via Prisma |

### Planner (`src/app/(protected)/planner`)

The couple's private tools. Every page follows the same shape — a Server Component `page.tsx` that fetches with Prisma, a `client.tsx` for the interactive parts, and a colocated `action.ts` of Server Actions for writes.

- **Dashboard** (`/planner`) — task progress, budget rollup, section cards
- **Checklist** (`/planner/checklist`) — tasks grouped by category, filtered via URL search params
- **Budget** (`/planner/budget`) — categories and subcategories with estimated/paid amounts and a stacked progress bar
- **RSVP Manager** (`/planner/rsvp`) — read-only guest table
- **Registry Claims** (`/planner/registry-manager`) — registry items and who claimed what
- **Documents** (`/planner/doc-archive`) — vendor quotes, contracts, receipts

### Demo sandbox (`src/app/(public)/single-instance-planner`)

A public, signed-out mirror of the planner so the project can be shown off without exposing real wedding data. It is a near-copy of the planner's components, but the Prisma calls are swapped for a React context store (`demo-store.tsx`) seeded from `demo-data/`. Edits are real within the session and vanish on refresh.

> The demo **must never touch the database**. Its actions take the store as an argument (dependency injection) rather than importing `prisma` at module scope — a DB connection is legitimately one shared thing, a React store is not. If you extend the demo, keep that boundary.

## Getting started

Requires **Node 20+**, **pnpm**, and a PostgreSQL database.

```bash
pnpm install          # also runs `prisma generate` via postinstall
pnpm dev              # http://localhost:3000
```

Then apply the schema and seed:

```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

## Scripts

```bash
pnpm dev        # dev server
pnpm build      # prisma generate && next build
pnpm start      # serve the production build
pnpm lint       # eslint
pnpm generate   # scaffold a component or page (see below)
```

Prisma:

```bash
pnpm prisma migrate dev --name <name>   # create + apply a migration
pnpm prisma generate                    # regenerate the client
pnpm prisma studio                      # inspect the database
```

### Scaffolding

`scripts/generate.mjs` writes boilerplate that already matches the conventions below:

```bash
pnpm generate component <kebab-name> [--client]
pnpm generate page <kebab-name> [--protected] [--layout] [--force]
```

`page --protected` emits the full `page.tsx` / `client.tsx` / `action.ts` trio with the `ActionResult` contract prefilled.

## Architecture

```
src/
├── app/
│   ├── (public)/                     # no auth
│   │   ├── page.tsx                  # landing page
│   │   └── single-instance-planner/  # state-only demo
│   ├── (protected)/planner/          # the real planner, DB-backed
│   ├── api/auth/[...nextauth]/       # Auth.js route handler
│   ├── sign-in/ sign-out/ access-denied/
│   ├── layout.tsx                    # fonts, metadata, Toaster, SidebarProvider
│   └── globals.css                   # theme tokens + shared utility classes
├── auth.ts / auth.config.ts          # Auth.js setup + allow-list check
├── proxy.ts                          # middleware; matcher guards /planner/:path*
├── components/                       # shared components; ui/ is shadcn
├── hooks/                            # use-mobile, use-dialog-submit, use-query-params
├── lib/                              # prisma singleton, require-user guards, helpers
└── prisma/                           # schema.prisma, migrations, seed.ts
```

### Conventions

- **Path alias** `@/*` → `src/*`.
- **Prisma client** — always import the singleton from [prisma.ts](src/lib/prisma.ts). It's cached on `globalThis` in dev so hot reloads don't exhaust the connection pool. The generated client lands in `src/generated/prisma` and is **gitignored** — it's regenerated on install and on build, never hand-edited.
- **Schema** lives at [schema.prisma](src/prisma/schema.prisma); config is external in [prisma.config.ts](prisma.config.ts) rather than embedded in the schema. Models: `Rsvp`/`Guest`, `RegistryItem`/`RegistryClaim`, `BudgetCategory`/`BudgetSubcategory`, `TaskCategory`/`Task`.
- **Data flow** — Server Component fetches → typed props → Client Component. Mutations go through Server Actions in colocated `action.ts` files.
- **Server Action contract** — every action returns an `ActionResult`:
  ```ts
  type ActionResult =
    | { ok: true }
    | { ok: false; error: string; field?: ErrorField };
  ```
  Validate and trim on the server, catch Prisma codes (`P2002` unique, `P2025` not found) and turn them into a specific message, log anything unexpected, then `revalidatePath(...)` on success. [checklist/action.ts](src/app/(protected)/planner/checklist/action.ts) is the canonical example.
- **Styling** — theme colors are CSS custom properties in [globals.css](src/app/globals.css) (`--burg`, `--gold`, `--olivine`, `--cream`), used as `bg-(--burg)`. Shared layout classes (`page-title`, `section-title`, `stat-number`) live there too. Mobile-first with `md:`/`lg:` breakpoints; the offcanvas sidebar is mobile-only.
- **Filter state** lives in URL search params (`?category=`) rather than component state, so filters survive a refresh and are linkable.

### Auth

Google OAuth via Auth.js v5 (`next-auth@5` beta), JWT session strategy, with an email allow list on top.

Authorization is checked in three places, deliberately:

1. [proxy.ts](src/proxy.ts) — middleware matcher on `/planner/:path*`, so planner content never renders for a signed-out visitor.
2. `requireUser()` in [require-user.ts](src/lib/require-user.ts) — guards Server Components and data fetchers. Redirects to `/sign-in` when there's no session, `/access-denied` when there's a valid session for a removed user (a different failure the user can't fix by signing in again). Wrapped in `cache()` so one request verifies the JWT once.
3. `requireUserAction()` — guards Server Actions. Returns an `ActionResult`-shaped failure instead of redirecting, because `redirect()` throws and would land the client in its generic "Something went wrong" catch.

Because sessions are JWTs, a session outlives removal from `PLANNER_ALLOW_LIST` — so every guard re-checks the list, and the `jwt` callback returns `null` for a de-authorized token.

## Testing

There is no automated test suite yet. Releases are verified with the manual [release smoke test](docs/release-smoke-test.md) — run against the deployed production URL, not localhost. When a step in it fails in production, it's earmarked for Playwright and removed from the checklist.

## License

MIT — see [LICENSE](LICENSE).
