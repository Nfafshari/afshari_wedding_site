import { cn } from "@/lib/utils";

const TONE = {
  default: "",
  success: "text-olivine-ink",
  danger: "text-destructive",
  /** Something waiting on you, e.g. plus-ones to review. */
  attention: "text-gold-ink",
};

interface StatProps {
  value: React.ReactNode;
  /** What the number counts, three words at most, sentence case. */
  caption: string;
  tone?: keyof typeof TONE;
  className?: string;
}

/** One number with its caption, left-aligned. */
export function Stat({ value, caption, tone = "default", className }: StatProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <p className={cn("stat-number", TONE[tone])}>{value}</p>
      <p className="muted-caption pt-1">{caption}</p>
    </div>
  );
}

interface StatRowProps {
  /** Column classes, e.g. "grid-cols-2 md:grid-cols-4". */
  className?: string;
  children: React.ReactNode;
}

/**
 * The summary strip at the top of a page. Phones show a grid with no rules (a wrapping
 * row can't place them cleanly); from md the stats sit in one row with a rule before
 * each one after the first.
 */
export function StatRow({ className, children }: StatRowProps) {
  return (
    <div className={cn("grid w-full gap-x-6 gap-y-4 md:*:not-first:border-s md:*:not-first:ps-6", className)}>
      {children}
    </div>
  );
}
