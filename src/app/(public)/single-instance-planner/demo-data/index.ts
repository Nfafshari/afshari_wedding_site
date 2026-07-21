import type { ArchivedDoc } from "../doc-archive/data";
import { EXAMPLE_DOCS_DATA } from "../doc-archive/data";
import type { BudgetCategory, CategoryWithTasks, RegistryItem, Rsvps } from "../demo-types";
import { DEMO_BUDGET_CATEGORIES } from "./budget";
import { DEMO_TASK_CATEGORIES } from "./checklist";
import { DEMO_REGISTRY_ITEMS } from "./registry";
import { DEMO_RSVPS } from "./rsvp";

/**
 * Everything the demo planner knows. One field per query the real planner runs.
 *
 * Nested rather than normalized, mirroring the `include` shapes the real pages
 * return — the client components are typed against those shapes already, so
 * normalizing would only mean writing a join layer to un-normalize it again.
 */
export type DemoState = {
  taskCategories: CategoryWithTasks[];
  budgetCategories: BudgetCategory[];
  registryItems: RegistryItem[];
  rsvps: Rsvps[];
  docs: ArchivedDoc[];
};

/**
 * A fresh copy of the seed.
 *
 * A function rather than a constant so Reset always gets an untouched graph. The
 * arrays are rebuilt one level down (the level the actions edit) rather than deep
 * cloned: `structuredClone` would throw here, because an ArchivedDoc's `icon` is a
 * React component and functions aren't cloneable. Dates are shared across copies,
 * which is safe — nothing mutates a Date.
 */
export function createInitialDemoState (): DemoState {
  return {
    taskCategories: DEMO_TASK_CATEGORIES.map((category) => ({
      ...category,
      tasks: category.tasks.map((task) => ({ ...task })),
    })),
    budgetCategories: DEMO_BUDGET_CATEGORIES.map((category) => ({
      ...category,
      budgetSubcategories: category.budgetSubcategories.map((sub) => ({ ...sub })),
    })),
    registryItems: DEMO_REGISTRY_ITEMS.map((item) => ({
      ...item,
      claimed: item.claimed.map((claim) => ({ ...claim })),
    })),
    rsvps: DEMO_RSVPS.map((rsvp) => ({
      ...rsvp,
      guests: rsvp.guests.map((guest) => ({ ...guest })),
    })),
    docs: EXAMPLE_DOCS_DATA.map((doc) => ({ ...doc })),
  };
}

/**
 * The highest id in the seed, across every entity.
 *
 * Computed rather than hardcoded so it stays right when the seed data is edited —
 * a stale constant here would hand out an id that already exists, which is the one
 * failure mode the id counter exists to prevent.
 */
export function getMaxSeededId (state: DemoState): number {
  return Math.max(
    0,
    ...state.taskCategories.flatMap((category) => [category.id, ...category.tasks.map((task) => task.id)]),
    ...state.budgetCategories.flatMap((category) => [category.id, ...category.budgetSubcategories.map((sub) => sub.id)]),
    ...state.registryItems.flatMap((item) => [item.id, ...item.claimed.map((claim) => claim.id)]),
    ...state.rsvps.flatMap((rsvp) => [rsvp.id, ...rsvp.guests.map((guest) => guest.id)]),
    ...state.docs.map((doc) => doc.id),
  );
}
