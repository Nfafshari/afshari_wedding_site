"use client";

import { ChevronDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/*
 * The planner's one list for grouped data: categories with line items, parties with guests,
 * gifts with claims. Built from divs on a CSS grid with ARIA table roles, so screen readers
 * still hear a table while phones can fold the same cells into a different shape.
 *
 * From md every row is a grid on the same template: a chevron column, the page's columns,
 * then an actions column. Below md a row is name over meta line, with the end cells and
 * the actions on the right:
 *
 *   [lead] name                    end   [actions]
 *          meta · meta             end
 */

/** The full column template: the chevron column, the page's columns, the actions column. */
export function gridTemplate(columns: string) {
  return `2rem ${columns} 4.5rem`;
}

// Below md: lead | name and meta | end | actions. From md: the --gl-cols template, and the
// meta and end wrappers dissolve (display: contents) so their cells take the next columns.
// The phone "·" separators are switched off from md with the same not-first selector: a
// plain `md:*:before` is less specific than `*:not-first:before` and would lose.
const ROW = "grid grid-cols-[2rem_minmax(0,1fr)_auto_auto] items-center gap-x-4 border-b px-2 py-2.5 md:min-h-13 md:grid-cols-(--gl-cols) md:py-1.5";
const LEAD = "col-1 row-[1/3] md:col-auto md:row-auto";
const NAME = "col-2 row-1 min-w-0 md:col-auto md:row-auto";
const META = "col-2 row-2 flex flex-wrap text-sm text-burgundy-600 *:not-first:before:px-1.5 *:not-first:before:content-['·'] md:contents md:text-base md:text-foreground md:*:not-first:before:content-none";
const END = "col-3 row-[1/3] flex flex-col items-end gap-1 md:contents";
const ACTIONS = "col-4 row-[1/3] flex justify-end gap-1 md:col-auto md:row-auto";

interface GroupedListProps {
  /** Names the list for screen readers, e.g. "Budget by category". */
  label: string;
  /** The page's own columns, from the name column on, e.g. "minmax(0,1fr) 8rem 8rem". */
  columns: string;
  className?: string;
  children: React.ReactNode;
}

export function GroupedList({ label, columns, className, children }: GroupedListProps) {
  return (
    <div
      role="table"
      aria-label={label}
      className={cn("border-t", className)}
      style={{ "--gl-cols": gridTemplate(columns) } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Column labels, in the same order as the row cells. Hidden on phones, where meta cells carry their own labels. */
export function ListHeader({ children }: { children: React.ReactNode }) {
  return (
    <div role="row" className="hidden min-h-9 items-center gap-x-4 border-b px-2 md:grid md:grid-cols-(--gl-cols)">
      <span aria-hidden />
      {children}
      <span aria-hidden />
    </div>
  );
}

export function ListHeadCell({ numeric, children }: { numeric?: boolean; children?: React.ReactNode }) {
  return (
    <div role="columnheader" className={cn("planner-label", numeric && "text-right")}>
      {children}
    </div>
  );
}

interface ListCellProps {
  /** Money and counts: right-aligned from md, with even-width digits. */
  numeric?: boolean;
  /** Shown after the value on phones only, where there are no column labels, e.g. "est.". */
  phoneLabel?: string;
  /** Leave the cell out on phones. */
  hideOnPhone?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ListCell({ numeric, phoneLabel, hideOnPhone, className, children }: ListCellProps) {
  return (
    <div
      role="cell"
      className={cn(numeric && "lining-nums tabular-nums md:text-right", hideOnPhone && "hidden md:block", className)}
    >
      {children}
      {phoneLabel && <span className="md:hidden"> {phoneLabel}</span>}
    </div>
  );
}

interface RowSlots {
  /** Cells that fold into the line under the name on phones. */
  meta?: React.ReactNode;
  /** Cells that stay on the right on phones: the number that matters most, a status chip. */
  end?: React.ReactNode;
  /** RowActionButtons: edit, then delete. */
  actions?: React.ReactNode;
}

function RowSlotCells({ meta, end, actions }: RowSlots) {
  return (
    <>
      <div className={META}>{meta}</div>
      <div className={END}>{end}</div>
      <div role="cell" className={ACTIONS}>{actions}</div>
    </>
  );
}

interface ListRowProps extends RowSlots {
  /** Fills the chevron column, e.g. a checkbox. */
  lead?: React.ReactNode;
  name: React.ReactNode;
  className?: string;
}

/** One item: a line item, a guest, a claim. */
export function ListRow({ lead, name, className, ...slots }: ListRowProps) {
  return (
    <div role="row" className={cn(ROW, className)}>
      <div role="cell" className={LEAD}>{lead}</div>
      <div role="cell" className={NAME}>{name}</div>
      <RowSlotCells {...slots} />
    </div>
  );
}

interface ListGroupProps extends RowSlots {
  /** Usually just the name; can carry a thumbnail. It sits inside the open/close button, so nothing interactive. */
  title: React.ReactNode;
  /** Beside the title, outside the button: a link, e.g. to the product page. */
  aside?: React.ReactNode;
  defaultOpen?: boolean;
  /** ListRows, then a ListEmpty and/or a ListAddRow. */
  children: React.ReactNode;
}

/** A category, party or gift: a tinted row whose title opens its items. */
export function ListGroup({ title, aside, defaultOpen, children, ...slots }: ListGroupProps) {
  return (
    <Collapsible role="rowgroup" defaultOpen={defaultOpen}>
      <div role="row" className={cn(ROW, "bg-olivine-50 font-semibold md:min-h-14")}>
        <div role="rowheader" className="col-[1/3] row-1 flex min-w-0 items-center gap-1 md:col-[1/3] md:row-auto">
          {/* Fills the cell, unless an aside follows the title: then it hugs the title so the aside sits right after it. */}
          <CollapsibleTrigger className={cn("group flex min-w-0 items-center gap-4 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring", !aside && "flex-1")}>
            <span className="flex w-8 shrink-0 justify-center">
              <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" aria-hidden />
            </span>
            <span className="min-w-0 break-words">{title}</span>
          </CollapsibleTrigger>
          {aside}
        </div>
        <RowSlotCells {...slots} />
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** Says a group has no items yet. Replaces the dashed empty box inside groups. */
export function ListEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div role="row" className="border-b">
      <div role="cell" className="py-3.5 pl-14 text-sm text-burgundy-600 italic">{children}</div>
    </div>
  );
}

/** The "Add …" button at the foot of a group, lined up with the item names. */
export function ListAddRow({ children, ...props }: Omit<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <div role="row" className="border-b">
      <div role="cell" className="py-1.5 pl-12">
        <Button variant="ghost" size="sm" {...props}>
          <Plus aria-hidden /> {children}
        </Button>
      </div>
    </div>
  );
}
