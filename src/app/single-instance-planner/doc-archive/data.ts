import { Columns2, FileChartColumn, FilePenLine, Receipt } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * A document in the archive. Mocked for now — this moves to page.tsx and gets
 * derived from the Prisma model once the Document table exists.
 *
 * This lives apart from client.tsx so the planner's dashboard card can count the
 * archive without importing the page itself. Note `icon` is a component, which is
 * why the array cannot be handed across a server boundary: read what you need from
 * it in the server page (a length, say) and pass that, not the rows.
 */
export type ArchivedDoc = {
  id: number;
  name: string;
  createdAt: Date;
  companyName: string;
  icon: LucideIcon;
  link: string;
};

export const EXAMPLE_DOCS_DATA: ArchivedDoc[] = [
  { id: 1, name: 'Catering Quote', createdAt: new Date('2026-07-10'), companyName: 'Sage & Salt Catering', icon: FileChartColumn, link: '/example-documents/catering-quote.pdf' },
  { id: 2, name: 'Florist Brochure', createdAt: new Date('2026-06-02'), companyName: 'Willow & Bloom Florals', icon: Columns2, link: '/example-documents/florist-brochure.pdf' },
  { id: 3, name: 'Photography Contract', createdAt: new Date('2026-07-12'), companyName: 'Hart & Lane Photos', icon: FilePenLine, link: '/example-documents/photography-contract.pdf' },
  { id: 4, name: 'Rental Receipt', createdAt: new Date('2026-07-05'), companyName: 'Timeless Event Rentals', icon: Receipt, link: '/example-documents/rental-receipt.pdf' },
  { id: 5, name: 'Venue Quote', createdAt: new Date('2026-06-30'), companyName: 'Foxglove Hill Estate', icon: FileChartColumn, link: '/example-documents/venue-quote.pdf' }
];
