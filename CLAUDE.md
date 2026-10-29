# Afshari Wedding Site

Wedding site and private planning dashboard for Piper & Nathen (Sept 11, 2027). Next.js 16 (App Router), React 19, Prisma 7 on Postgres, Auth.js (Google + allow list), Tailwind v4 + shadcn/ui, Supabase Storage, deployed on Vercel.

Three surfaces: public site (`/`), a no-DB demo sandbox (`/single-instance-planner`), and the private planner (`/planner/*`). See [README.md](README.md) for the full picture.

## Working agreement

The owner designs; the agent implements. Do not write code until a plan for the issue has been discussed and approved.

1. Work comes from a Linear issue (problem, scope in/out, acceptance criteria). No issue, no build: ask for one or draft one.
2. Interview first. Ask questions, propose a design with trade-offs, wait for approval.
3. One issue = one branch = one small PR. Branch off `master`, named `feature/NFA-<number>-short-slug`.
4. Smallest change that meets the acceptance criteria. Do not refactor, add abstractions, or add dependencies that the issue did not ask for. Ask first.
5. Never say "done" without running the checks below and reporting their real output, including failures.

Full process: [docs/workflow.md](docs/workflow.md). Code rules and definition of done: [docs/standards.md](docs/standards.md). Manual release checks: [docs/release-smoke-test.md](docs/release-smoke-test.md).

## Commands

```bash
pnpm dev                                # dev server, http://localhost:3000
pnpm lint                               # eslint
pnpm test                               # vitest, single run (pnpm test:watch to watch)
pnpm build                              # prisma generate && next build (also type-checks)
pnpm prisma migrate dev --name <name>   # create + apply a migration
pnpm generate page <name> --protected   # scaffold page/client/action trio
```

CI (`.github/workflows/ci.yml`) runs lint, `tsc --noEmit`, `pnpm test`, and build on every PR, and all four must be green to merge. Run the same four locally before opening a PR, then do the relevant steps of the smoke test. The tests include auth checks (`tests/auth-guards.test.ts`); read a failure before touching the test. Local `node_modules` or `.next/` can go stale and give false type errors: trust a clean `pnpm install --frozen-lockfile` and CI over a long-lived working tree.

## Hard rules

- Every Server Action starts with `requireUserAction()` and returns an `ActionResult`. Every protected data fetcher starts with `requireUser()`. Never skip either.
- The demo sandbox must never import `prisma` or touch the database. It receives a store by injection.
- A change to a planner feature must be mirrored in `single-instance-planner/` (or the PR says why not) until the duplication is removed.
- Import Prisma only from `@/lib/prisma`. `src/generated/` is machine-generated; never edit it.
- Never commit `.env*`. Never hand-edit applied migrations; add a new one.
