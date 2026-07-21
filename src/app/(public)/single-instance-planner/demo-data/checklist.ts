import type { CategoryWithTasks } from "../demo-types";

/**
 * Demo checklist data. Authored rather than transcribed — the repo has no checklist seed.
 *
 * Sized deliberately to exercise the code that renders it:
 *  - Four tasks are done out of seventeen, so the dashboard progress bar sits at a
 *    real percentage rather than 0% or 100%.
 *  - Three incomplete tasks fall after the demo's "today" and are the nearest three,
 *    so the dashboard's up-next widget fills its three slots — it slices to 3, and
 *    with fewer it renders its empty state instead. They sit in three different
 *    categories on purpose, so the widget shows three different icons.
 *  - "Draft ceremony playlist" is incomplete but overdue, which is what the
 *    `goalDate >= startOfToday` filter is there to exclude.
 *
 * `icon` holds a Lucide displayName; readers resolve it and fall back to Astroid.
 *
 * Tasks are pre-sorted by goalDate ascending within each category, matching what
 * `getCategories` used to return. `createdAt` is uniform because nothing renders it —
 * the schema requires it, the UI never reads it.
 */
const CREATED = new Date('2026-05-01');

export const DEMO_TASK_CATEGORIES: CategoryWithTasks[] = [
  {
    id: 1,
    name: 'Venue',
    order: 0,
    icon: 'Landmark',
    tasks: [
      { id: 1, name: 'Tour Foxglove Hill Estate', goalDate: new Date('2026-05-20'), status: true, categoryId: 1, createdAt: CREATED },
      { id: 2, name: 'Sign venue contract', goalDate: new Date('2026-06-15'), status: true, categoryId: 1, createdAt: CREATED },
      { id: 3, name: 'Confirm ceremony start time', goalDate: new Date('2026-09-01'), status: false, categoryId: 1, createdAt: CREATED },
      { id: 4, name: 'Final venue walkthrough', goalDate: new Date('2027-08-14'), status: false, categoryId: 1, createdAt: CREATED },
    ],
  },
  {
    id: 2,
    name: 'Catering',
    order: 0,
    icon: 'Utensils',
    tasks: [
      { id: 5, name: 'Shortlist caterers', goalDate: new Date('2026-06-01'), status: true, categoryId: 2, createdAt: CREATED },
      { id: 6, name: 'Book tasting with Sage & Salt', goalDate: new Date('2026-07-24'), status: false, categoryId: 2, createdAt: CREATED },
      { id: 7, name: 'Choose menu', goalDate: new Date('2026-10-10'), status: false, categoryId: 2, createdAt: CREATED },
      { id: 8, name: 'Finalize head count', goalDate: new Date('2027-08-01'), status: false, categoryId: 2, createdAt: CREATED },
    ],
  },
  {
    id: 3,
    name: 'Photography',
    order: 0,
    icon: 'Camera',
    tasks: [
      { id: 9, name: 'Review Hart & Lane portfolio', goalDate: new Date('2026-06-28'), status: true, categoryId: 3, createdAt: CREATED },
      { id: 10, name: 'Book engagement session', goalDate: new Date('2026-07-20'), status: false, categoryId: 3, createdAt: CREATED },
      { id: 11, name: 'Send shot list', goalDate: new Date('2027-07-15'), status: false, categoryId: 3, createdAt: CREATED },
    ],
  },
  {
    id: 4,
    name: 'Flowers',
    order: 0,
    icon: 'Flower2',
    tasks: [
      { id: 12, name: 'Meet Willow & Bloom', goalDate: new Date('2026-07-30'), status: false, categoryId: 4, createdAt: CREATED },
      { id: 13, name: 'Pick centerpiece style', goalDate: new Date('2026-11-05'), status: false, categoryId: 4, createdAt: CREATED },
      { id: 14, name: 'Order boutonnieres', goalDate: new Date('2027-08-20'), status: false, categoryId: 4, createdAt: CREATED },
    ],
  },
  {
    id: 5,
    name: 'Music',
    order: 0,
    icon: 'Music',
    tasks: [
      { id: 15, name: 'Draft ceremony playlist', goalDate: new Date('2026-07-08'), status: false, categoryId: 5, createdAt: CREATED },
      { id: 16, name: 'Book DJ', goalDate: new Date('2026-12-01'), status: false, categoryId: 5, createdAt: CREATED },
      { id: 17, name: 'Send do-not-play list', goalDate: new Date('2027-08-28'), status: false, categoryId: 5, createdAt: CREATED },
    ],
  },
];
