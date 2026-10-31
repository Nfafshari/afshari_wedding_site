import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SummaryCardProps {
  title: string;
  /** The page the card summarises. */
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}

/**
 * The Dashboard's card shell: a title, a link to the page it summarises, and a body.
 * The link sits in the header rather than wrapping the card, because the budget
 * card has an interactive chart inside it.
 */
export default function SummaryCard({ title, href, linkLabel, children }: SummaryCardProps) {
  return (
    <div className="flex flex-col gap-3 p-4 border border-burg/8 rounded-lg bg-olivine/15">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="section-title pr-2">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 text-sm text-burg/70 whitespace-nowrap rounded-sm hover:text-burg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="underline">{linkLabel}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {children}
    </div>
  );
}
