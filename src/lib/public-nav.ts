/**
 * The guest site's pages, in nav order. The header puts the first half left of the crest and
 * the rest to its right. List only pages that exist: each guest page issue adds its own entry.
 * Planned order: Home, Our Story, Details, FAQ, Registry, RSVP.
 */
export const PUBLIC_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Our Story", href: "/our-story" },
  { label: "Details", href: "/details" },
  { label: "FAQ", href: "/faq" },
  { label: "Registry", href: "/registry" },
  { label: "RSVP", href: "/rsvp" },
] as const;

/**
 * Whether a link (anchors allowed, e.g. "/details#venue") goes to a page that exists yet.
 * Pages link to each other through this, so a link appears once its page ships.
 */
export function hasPage(href: string): boolean {
  const path = href.split("#")[0];
  return PUBLIC_NAV_ITEMS.some((item) => item.href === path);
}
