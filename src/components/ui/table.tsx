"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Variants are documented on /planner/ui-kit. Each table keeps its own markup and
// column sizing; these carry the styling every table shares.

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

const tableBodyVariants = cva("[&_tr:last-child]:border-0", {
  variants: {
    variant: {
      default: "",
      // The rows under a party or category: a burgundy rule closes the group.
      group: "border-b border-burg",
    },
  },
  defaultVariants: { variant: "default" },
})

function TableBody({
  className,
  variant,
  ...props
}: React.ComponentProps<"tbody"> & VariantProps<typeof tableBodyVariants>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(tableBodyVariants({ variant }), className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

const tableRowVariants = cva("border-b transition-colors motion-reduce:transition-none", {
  variants: {
    variant: {
      // An item: a guest, a subcategory.
      default: "hover:bg-muted/50 data-[state=selected]:bg-muted",
      // The column labels above a table.
      heading: "border-b-accent",
      // A party or category row that opens its items. Stays tinted while open.
      group: "hover:bg-muted/20 has-aria-expanded:bg-muted/20",
      // Notes, empty states and "Add …" rows inside a group: no hover.
      static: "",
    },
  },
  defaultVariants: { variant: "default" },
})

function TableRow({
  className,
  variant,
  ...props
}: React.ComponentProps<"tr"> & VariantProps<typeof tableRowVariants>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(tableRowVariants({ variant }), className)}
      {...props}
    />
  )
}

// Money and counts line up on the right with even-width digits.
const numericCell = "text-right tabular-nums"

const tableHeadVariants = cva(
  "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
  {
    variants: {
      variant: {
        default: "",
        // Column labels: write them in sentence case, the class sets the caps.
        label: "h-8 text-xs tracking-wide text-gold-ink uppercase",
      },
      numeric: { true: numericCell },
    },
    defaultVariants: { variant: "default" },
  }
)

function TableHead({
  className,
  variant,
  numeric,
  ...props
}: React.ComponentProps<"th"> & VariantProps<typeof tableHeadVariants>) {
  return (
    <th
      data-slot="table-head"
      className={cn(tableHeadVariants({ variant, numeric }), className)}
      {...props}
    />
  )
}

const tableCellVariants = cva(
  "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
  { variants: { numeric: { true: numericCell } } }
)

function TableCell({
  className,
  numeric,
  ...props
}: React.ComponentProps<"td"> & VariantProps<typeof tableCellVariants>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(tableCellVariants({ numeric }), className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
