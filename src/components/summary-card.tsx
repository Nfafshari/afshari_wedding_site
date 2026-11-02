import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  /** The page the card summarises. */
  href: string;
  linkLabel: string;
  /** Grid placement, e.g. a column span. */
  className?: string;
  children: React.ReactNode;
}

/**
 * The Dashboard's card shell: a title, a link to the page it summarises, and a body.
 * The link sits in the header rather than wrapping the card, so a card can hold its
 * own links (Up next's rows) without nesting one link in another.
 */
export default function SummaryCard({ title, href, linkLabel, className, children }: SummaryCardProps) {
  return (
    <div className={cn("flex flex-col gap-3 p-4 border rounded-lg bg-olivine-50", className)}>
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
