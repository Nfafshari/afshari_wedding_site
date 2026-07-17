"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { createInitialDemoState, getMaxSeededId, type DemoState } from "./demo-data";
import { createChecklistActions } from "./checklist/action";
import { createBudgetActions } from "./budget/action";
import { createRegistryActions } from "./registry-manager/action";
import { createDocArchiveActions } from "./doc-archive/action";

/**
 * What the demo's actions need from the store.
 *
 * The real actions reach for `prisma` in module scope, which is right there — a DB
 * connection genuinely is one shared thing. A React store is not: it belongs to a
 * component tree, and a module-level one would live in the Node process and be
 * shared between visitors. So the demo's actions take their equivalent as an
 * argument instead. Same code, dependency injected rather than imported.
 */
export type DemoStore = {
  /**
   * The data as of the last render.
   *
   * Some actions must read before they write — the registry totals up existing
   * claims before accepting a new one — and an action is a plain async function
   * with no access to the render's `state` binding.
   *
   * "As of the last render" is the honest description and the right semantics: an
   * action runs from a click, and what the user clicked on is what was rendered.
   */
  getState(): DemoState;
  /**
   * Applies an update.
   *
   * The updater must be pure — React invokes it twice in StrictMode. Anything the
   * action needs to decide (a validation result, a new id) has to be worked out
   * *before* this is called, never inside the callback.
   */
  setState(updater: (prev: DemoState) => DemoState): void;
  /** An unused row id. Call before setState, never inside the updater. */
  nextId(): number;
};

type DemoPlannerValue =
  & DemoState
  & ReturnType<typeof createChecklistActions>
  & ReturnType<typeof createBudgetActions>
  & ReturnType<typeof createRegistryActions>
  & ReturnType<typeof createDocArchiveActions>
  & { reset(): void };

const DemoPlannerContext = createContext<DemoPlannerValue | null>(null);

export function useDemoPlanner (): DemoPlannerValue {
  const value = useContext(DemoPlannerContext);

  if (value === null) {
    throw new Error(
      'useDemoPlanner was called outside <DemoPlannerProvider>. Every demo route ' +
      'renders under single-instance-planner/layout.tsx, which mounts the provider — ' +
      'so this usually means the component is being rendered from the real planner, ' +
      'or from a Server Component (context only reaches client components).'
    );
  }

  return value;
}

export function DemoPlannerProvider ({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(createInitialDemoState);

  // Rebuilt whenever the data changes, so `getState` closes over the current value.
  //
  // The obvious alternative — parking the latest state in a useRef and mutating it
  // during render — is what the react-hooks/refs lint rule exists to stop, and it is
  // right to: a render can be thrown away, and the ref would keep the discarded
  // value. Closing over the render's own state has no such hole, and rebuilding a
  // few closures per render costs nothing.
  const store = useMemo<DemoStore>(() => ({
    getState: () => state,
    setState,
    // Derived from the data rather than kept in a counter, which means no mutable
    // id state to hold, seed, or reset.
    //
    // The ids this hands out are unique but not permanently unique: delete the
    // newest row and the next insert reuses its id. That is fine — an id only ever
    // has to be distinct from the ids that currently exist, which is exactly what
    // scanning for the maximum guarantees. It is `array.length + 1` that breaks
    // (delete row 2 of 3, add one, and the "new" id 3 already exists — React keys
    // collide and `.find(t => t.id === activeTaskId)` starts returning the wrong
    // row, so dialogs edit something the user never clicked).
    nextId: () => getMaxSeededId(state) + 1,
  }), [state]);

  const actions = useMemo(() => ({
    ...createChecklistActions(store),
    ...createBudgetActions(store),
    ...createRegistryActions(store),
    ...createDocArchiveActions(store),
  }), [store]);

  const value = useMemo<DemoPlannerValue>(
    () => ({ ...state, ...actions, reset: () => setState(createInitialDemoState()) }),
    [state, actions]
  );

  return (
    <DemoPlannerContext.Provider value={value}>
      {children}
    </DemoPlannerContext.Provider>
  );
}
