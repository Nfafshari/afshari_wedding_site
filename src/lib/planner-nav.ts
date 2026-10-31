/** The planner's pages, in nav order. These labels are also the page and card titles. */
export const PLANNER_NAV_ITEMS = [
  { label: "Dashboard", href: "/planner" },
  { label: "Checklist", href: "/planner/checklist" },
  { label: "RSVPs", href: "/planner/rsvp" },
  { label: "Budget", href: "/planner/budget" },
  { label: "Registry", href: "/planner/registry-manager" },
  { label: "Documents", href: "/planner/doc-archive" },
] as const;
