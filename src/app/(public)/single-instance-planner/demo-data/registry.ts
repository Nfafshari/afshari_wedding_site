import type { RegistryItem } from "../demo-types";

/**
 * Demo registry data, transcribed from `src/prisma/seed.ts`'s REGISTRY_ITEMS.
 *
 * The seed's invariants still hold, and they are the reason this set is worth
 * keeping intact: no item is over-claimed (the app refuses to create that state,
 * so the data shouldn't fabricate it), and between them the four items cover every
 * state the page renders — nothing claimed, partly claimed by several people,
 * partly claimed by one, and fully claimed with `image: null` so the placeholder
 * fallback gets exercised.
 *
 * Items are pre-sorted by name and claims oldest-first within each item, matching
 * what `getRegistryItems` used to return.
 */
export const DEMO_REGISTRY_ITEMS: RegistryItem[] = [
  // --- Nothing claimed yet ---
  {
    id: 1,
    name: 'Cast Iron Dutch Oven',
    link: 'https://www.example.com/dutch-oven',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400',
    quantityWanted: 1,
    claimed: [],
  },
  // --- Partly claimed, several claimants ---
  {
    id: 2,
    name: 'Linen Bath Towels',
    link: 'https://www.example.com/bath-towels',
    image: 'https://images.unsplash.com/photo-1620912189875-0d3d4d0d0b7e?w=400',
    quantityWanted: 8,
    claimed: [
      { id: 1, claimedBy: 'Aunt Sue', quantity: 2, createdAt: new Date('2026-07-02'), itemId: 2 },
      { id: 2, claimedBy: 'The Millers', quantity: 1, createdAt: new Date('2026-07-09'), itemId: 2 },
    ],
  },
  // --- Fully claimed by a single claimant ---
  {
    id: 3,
    name: 'Stand Mixer',
    link: 'https://www.example.com/stand-mixer',
    image: 'https://images.unsplash.com/photo-1594222082006-6bd7f4b1a4b0?w=400',
    quantityWanted: 1,
    claimed: [
      { id: 3, claimedBy: 'Grace Okafor', quantity: 1, createdAt: new Date('2026-07-11'), itemId: 3 },
    ],
  },
  // --- Fully claimed, and no image so the placeholder shows ---
  {
    id: 4,
    name: 'Wool Picnic Blanket',
    link: 'https://www.example.com/picnic-blanket',
    image: null,
    quantityWanted: 2,
    claimed: [
      { id: 4, claimedBy: 'Henry Kim', quantity: 1, createdAt: new Date('2026-06-28'), itemId: 4 },
      { id: 5, claimedBy: 'Elena Vasquez', quantity: 1, createdAt: new Date('2026-07-14'), itemId: 4 },
    ],
  },
];
