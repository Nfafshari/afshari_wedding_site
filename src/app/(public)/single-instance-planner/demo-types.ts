import type { BudgetStatus } from "@/generated/prisma/enums";

/**
 * The demo's data shapes, hand-written.
 *
 * The real planner derives these from its Prisma queries
 * (`Awaited<ReturnType<typeof getCategories>>[number]`), which is the right call
 * there — the types track the schema for free. The demo has no query to derive
 * from, so the same shapes are written out by hand.
 *
 * These must stay faithful to `src/prisma/schema.prisma`, nullability included:
 * every client component here was written against the real types, and a widened
 * or narrowed field makes its null-guards look dead to TypeScript.
 *
 * Each page re-exports the type it used to derive, so consumers keep importing
 * from `../page` exactly as before. The definition moved; the address did not.
 */

// -- Checklist -----------------------------------------------------------------
// The real checklist passes raw Prisma rows through unmapped, so these mirror the
// `TaskCategory` / `Task` models directly.

export type Task = {
  id: number;
  name: string;
  createdAt: Date;
  goalDate: Date;
  status: boolean;
  categoryId: number;
};

export type CategoryWithTasks = {
  id: number;
  name: string;
  order: number;
  /** Lucide icon displayName. Nullable in the schema; readers fall back to Astroid. */
  icon: string | null;
  tasks: Task[];
};

// -- RSVP ----------------------------------------------------------------------
// Also passed through raw, so these mirror `Rsvp` / `Guest`.

export type Guest = {
  id: number;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: Date;
  rsvpId: number;
};

/** Singular shape, plural name — matches the real page's `Rsvps` export. */
export type Rsvps = {
  id: number;
  attendance: boolean;
  createdAt: Date;
  guests: Guest[];
};

// -- Budget --------------------------------------------------------------------
// The real page maps Decimal -> number at the boundary, so the client shape is
// already plain. `createdAt` and `order` are dropped there; dropped here too.

export type BudgetSubcategory = {
  id: number;
  name: string;
  estimatedCost: number;
  paidAmount: number;
  status: BudgetStatus;
  budgetCategoryId: number;
};

export type BudgetCategory = {
  id: number;
  name: string;
  budgetSubcategories: BudgetSubcategory[];
};

// -- Registry ------------------------------------------------------------------
// The real page maps explicitly but has no Decimal to unwrap. Claim `createdAt`
// stays a Date; item `createdAt` is dropped.

export type RegistryClaim = {
  id: number;
  claimedBy: string;
  quantity: number;
  createdAt: Date;
  itemId: number;
};

export type RegistryItem = {
  id: number;
  name: string;
  link: string;
  quantityWanted: number;
  /** `@default("/window.svg")` never applies to an explicit null, so this is nullable. */
  image: string | null;
  claimed: RegistryClaim[];
};
