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

/** One number with its caption, left-aligned. A size container, so the number fits the cell (see stat-number). */
export function Stat({ value, caption, tone = "default", className }: StatProps) {
  return (
    <div className={cn("@container flex flex-col", className)}>
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
 * each one after the first. The rule is drawn in the middle of the gap rather than with
 * padding, so every cell has the same room and its number the same size.
 */
export function StatRow({ className, children }: StatRowProps) {
  return (
    <div
      className={cn(
        "grid w-full gap-x-6 gap-y-4 md:gap-x-12",
        "md:*:not-first:relative md:*:not-first:before:absolute md:*:not-first:before:inset-y-0 md:*:not-first:before:-start-6 md:*:not-first:before:border-s md:*:not-first:before:border-border md:*:not-first:before:content-['']",
        className
      )}
    >
      {children}
    </div>
  );
}
