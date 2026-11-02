"use client";

import { GroupedList, ListCell, ListGroup, ListHeadCell, ListHeader, ListRow } from "@/components/grouped-list";
import { StatRow } from "@/components/stat";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/*
 * Placeholders for a planner page while its data loads, built on the real components
 * (StatRow, GroupedList, SummaryCard) so nothing moves when the data arrives. A loading.tsx
 * renders the real PageHeader, then these inside a LoadingRegion.
 *
 * Bars inside text are inline-block and 0.7lh tall, so each sits on the line its text will
 * take, next to anything else on that line (the list's phone "·" separators). They sit in
 * divs, not <p>: a Skeleton is a div, and a div inside a <p> fails hydration.
 */

/** A bar on one line of the surrounding text, a little shorter than the line so it reads as a bar. */
function Line({ className }: { className?: string }) {
  return <Skeleton className={cn("inline-block h-[0.7lh] align-middle", className)} />;
}

interface LoadingRegionProps {
  /** Read out once, e.g. "Loading budget". */
  label: string;
  children: React.ReactNode;
}

/**
 * Announces the load once and hides the placeholders from screen readers and the keyboard.
 * `inert` also stops the real list's open/close buttons inside from taking focus.
 */
export function LoadingRegion({ label, children }: LoadingRegionProps) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div inert>{children}</div>
    </div>
  );
}

/** Stands in for the header's buttons, e.g. widths={["w-36"]} for one "Add category". */
export function ActionsSkeleton({ widths }: { widths: string[] }) {
  return (
    <>
      {widths.map((width, i) => <Skeleton key={i} aria-hidden className={cn("h-8", width)} />)}
    </>
  );
}

interface StatRowSkeletonProps {
  count: number;
  /** The real captions, when they don't depend on the data, so a caption that wraps wraps here too. */
  captions?: string[];
  className?: string;
}

/** The summary strip: the real StatRow with a number and a caption in each cell. */
export function StatRowSkeleton({ count, captions, className }: StatRowSkeletonProps) {
  return (
    <StatRow className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="@container flex flex-col">
          <div className="stat-number"><Line className="w-[3ch]" /></div>
          <div className="muted-caption pt-1">{captions?.[i] ?? <Line className="w-24 max-w-full" />}</div>
        </div>
      ))}
    </StatRow>
  );
}

interface FilterRowSkeletonProps {
  /** Adds the search box beside the filter. */
  search?: boolean;
  /** The filter's size, when it isn't one short line: a filter that wraps on phones is two lines there. */
  filterClassName?: string;
}

/** The segmented filter, and the search box beside it when the page has one. */
export function FilterRowSkeleton({ search, filterClassName = "h-9.5 w-56" }: FilterRowSkeletonProps) {
  if (!search) return <Skeleton className={cn("mb-4", filterClassName)} />;

  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <Skeleton className={filterClassName} />
      <Skeleton className="h-10 w-full sm:w-72" />
    </div>
  );
}

interface ListSkeletonProps {
  /** The page list's own column template, so the skeleton's columns are its columns. */
  columns: string;
  groups?: number;
  rows?: number;
}

/** The grouped list: column labels, then a few open groups of rows. */
export function ListSkeleton({ columns, groups = 2, rows = 3 }: ListSkeletonProps) {
  // Every template entry is one token ("minmax(0,1fr)", "8rem"): the name column, then the rest.
  const otherColumns = columns.trim().split(/\s+/).length - 1;
  const cells = (width: string) => ({
    meta: Array.from({ length: otherColumns - 1 }, (_, i) => <ListCell key={i}><Line className={width} /></ListCell>),
    end: <ListCell><Line className={width} /></ListCell>,
  });

  return (
    <GroupedList label="Loading" columns={columns}>
      <ListHeader>
        {Array.from({ length: otherColumns + 1 }, (_, i) => (
          <ListHeadCell key={i}><Line className="w-16" /></ListHeadCell>
        ))}
      </ListHeader>
      {Array.from({ length: groups }, (_, group) => (
        <ListGroup key={group} defaultOpen title={<Line className="w-40" />} {...cells("w-16")}>
          {Array.from({ length: rows }, (_, row) => (
            <ListRow key={row} name={<Line className="w-3/4 max-w-56" />} {...cells("w-12")} />
          ))}
        </ListGroup>
      ))}
    </GroupedList>
  );
}

/** The Documents grid: the same auto-fill grid and tile padding as DocTile. */
export function TileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7" />
            <Skeleton className="h-5 w-10" />
          </div>
          <div>
            <div className="font-semibold"><Line className="w-3/4" /></div>
            <div className="muted-caption"><Line className="w-1/2" /></div>
          </div>
          {/* As tall as the real row's edit and delete buttons. */}
          <div className="flex h-7 items-center text-sm"><Line className="w-28" /></div>
        </li>
      ))}
    </ul>
  );
}
