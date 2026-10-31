import { cn } from "@/lib/utils";

const TONE = {
  default: "",
  success: "text-olivine-ink",
  danger: "text-destructive",
};

interface StatProps {
  value: React.ReactNode;
  /** What the number counts, three words at most. */
  caption: string;
  tone?: keyof typeof TONE;
  className?: string;
}

/** One big number with its caption. */
export function Stat({ value, caption, tone = "default", className }: StatProps) {
  return (
    <div className={cn("flex flex-col items-center px-2 py-3 text-center", className)}>
      <p className={cn("stat-number", TONE[tone])}>{value}</p>
      <p className="muted-caption pt-2">{caption}</p>
    </div>
  );
}

interface StatRowProps {
  /** Column classes, e.g. "grid-cols-3". */
  className?: string;
  /**
   * Gold rules between stats. Right for a row that never wraps; a row that wraps
   * (2×2 on phones) turns this off and puts the rules on its Stats instead.
   */
  divided?: boolean;
  children: React.ReactNode;
}

/** A row of Stats, like the RSVP and Registry summaries. */
export function StatRow({ className, divided = true, children }: StatRowProps) {
  return (
    <div className={cn("grid w-full gap-y-4", divided && "divide-x-2 divide-accent", className)}>
      {children}
    </div>
  );
}
