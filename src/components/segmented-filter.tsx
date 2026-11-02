"use client";

import { cn } from "@/lib/utils";
import { useQueryParams } from "@/hooks/use-query-params";

interface FilterOption {
  value: string;
  label: string;
  /** How many items the option shows, if worth saying. */
  count?: number;
}

interface SegmentedFilterProps {
  /** Names the group for screen readers, e.g. "Show tasks". */
  label: string;
  /** The query-string key that holds the choice. */
  param: string;
  /** The option shown when the key is absent. Choosing it removes the key. */
  defaultValue: string;
  options: FilterOption[];
  className?: string;
}

/** One choice from a few, kept in the URL so it survives a reload. Wraps on phones. */
export default function SegmentedFilter({ label, param, defaultValue, options, className }: SegmentedFilterProps) {
  const { searchParams, setParams } = useQueryParams();
  const current = searchParams.get(param) ?? defaultValue;

  function choose(value: string) {
    setParams((params) => (value === defaultValue ? params.delete(param) : params.set(param, value)));
  }

  return (
    <div role="group" aria-label={label} className={cn("inline-flex flex-wrap gap-0.5 rounded-md border bg-card p-0.5", className)}>
      {options.map((option) => {
        const isActive = option.value === current;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => choose(option.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
              isActive ? "bg-primary text-primary-foreground" : "text-burgundy-600 hover:bg-accent hover:text-foreground"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn("tabular-nums lining-nums", isActive ? "text-primary-foreground/80" : "text-burgundy-600")}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
