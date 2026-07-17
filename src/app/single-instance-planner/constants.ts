/**
 * Route prefix for the demo planner.
 *
 * Every in-demo link builds off this. Hardcoding `/single-instance-planner` in
 * the JSX instead would mean a link that silently escapes into the real planner
 * the moment someone copies a card over — which is exactly the bug this tree was
 * created to avoid.
 */
export const DEMO_BASE = '/single-instance-planner';
