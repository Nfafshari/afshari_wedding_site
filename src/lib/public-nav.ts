/**
 * The guest site's pages, in nav order. The header puts the first half left of the crest and
 * the rest to its right. List only pages that exist: each guest page issue adds its own entry.
 * Planned order: Home, Our Story, Details, Wedding Party, FAQ, Registry, RSVP.
 */
export const PUBLIC_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "RSVP", href: "/rsvp" },
] as const;
