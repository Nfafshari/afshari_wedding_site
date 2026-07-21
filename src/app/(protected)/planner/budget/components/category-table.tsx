"use client";

import { ArrowUpDown, ChevronDown, CirclePlus, SquarePen } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BudgetStatus } from "@/generated/prisma/enums";
import { useQueryParams } from "@/hooks/use-query-params";
import { toCurrency } from "@/lib/utils";
import { getCategoryTotals } from "@/lib/budget";

import SubcategoryRow from "./subcategory-row";
import CategoryColumns from "./category-columns";
import { BudgetCategory, BudgetSubcategory } from "../page";

interface CategoryTableProps {
  data: BudgetCategory[];
  /** Open the "add subcategory" dialog for the given category. */
  onAddSubcategory(budgetCategoryId: number): void;
  /** Open the delete-confirmation dialog for the given subcategory. */
  onDeleteSubcategory(subcategoryId: number): void;
  /** Open the edit/delete dialog for the given category. */
  onEditCategory(budgetCategoryId: number): void;
  /** Open the edit/delete dialog for the given subcategory. */
  onEditSubcategory(budgetSubcategoryId: number): void;
}

const SORT_ACCESSORS = {
  estimated: (sub: BudgetSubcategory) => sub.estimatedCost,
  paid:      (sub: BudgetSubcategory) => sub.paidAmount,
  balance:   (sub: BudgetSubcategory) => sub.estimatedCost - sub.paidAmount,
};

type SortKey = keyof typeof SORT_ACCESSORS;   // 'estimated' | 'paid' | 'balance'

type SortDirection = 'asc' | 'desc';

function isSortKey (value: string | null): value is SortKey {
  return value !== null && Object.hasOwn(SORT_ACCESSORS, value);
}

/**
 * Reorders each category's subcategories. The categories themselves keep the order
 * their `order` column gives them — only the rows inside them move.
 */
function sortCategories (
  categories: BudgetCategory[],
  sortKey: SortKey | null,
  sortDirection: SortDirection
): BudgetCategory[] {
  if (sortKey === null) return categories;

  const accessor = SORT_ACCESSORS[sortKey];
  const multiplier = sortDirection === 'asc' ? 1 : -1;

  // toSorted (not sort) — `categories` is a prop, and sorting in place would reorder
  // the array the parent still holds.
  return categories.map((category) => ({
    ...category,
    budgetSubcategories: category.budgetSubcategories.toSorted(
      (a, b) => (accessor(a) - accessor(b)) * multiplier
    ),
  }));
}

export default function CategoryTable ({ data, onAddSubcategory, onDeleteSubcategory, onEditCategory, onEditSubcategory }: CategoryTableProps) {
  const { searchParams, setParams } = useQueryParams();

  // The query string is untrusted input, so it gets parsed once here; everything
  // downstream works with values the compiler can vouch for.
  const rawSortKey = searchParams.get('sort');
  const sortKey = isSortKey(rawSortKey) ? rawSortKey : null;
  const sortDirection: SortDirection = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';

  function handleSortParams (key: SortKey) {
    // Re-clicking the active column flips it. Any other click defaults to descending
    const nextDirection: SortDirection =
      key === sortKey && sortDirection === 'desc' ? 'asc' : 'desc';

    // Set both params in a single call to avoid overwriting
    setParams((params) => {
      params.set('sort', key);
      params.set('dir', nextDirection);
    });
  }

  const sortedCategories = sortCategories(data, sortKey, sortDirection);

  return (
    <>
      {/** custom heading */}
      <Table className="w-full table-fixed mb-1">
        {/** custom column sizing */}
        <CategoryColumns heading />
        <TableHeader>
          <TableRow className="hover:bg-background border-b border-b-accent">
            <TableHead className="h-6"/>
            <TableHead className="h-6 text-xs text-accent">CATEGORY</TableHead>
            <TableHead className="hidden h-6 md:table-cell">
              <Button
                variant={'ghost'}
                size={'sm'}
                className="px-1.5 h-6 text-xs text-accent"
                onClick={() => {
                  handleSortParams('estimated')
                }}
              >
                ESTIMATED
                <ArrowUpDown />
              </Button>
            </TableHead>
            <TableHead className="hidden h-6 md:table-cell">
              <Button 
                variant={'ghost'}
                size={'sm'}
                className="px-1.5 h-6 text-xs text-accent"
                onClick={() => {
                  handleSortParams('paid')
                }}
              >
                PAID
                <ArrowUpDown />
              </Button>
            </TableHead>
            <TableHead className="h-6">
              <div className="flex justify-end">
                <Button 
                  variant={'ghost'}
                  size={'sm'}
                  className="px-1.5 h-6 text-xs text-accent"
                  onClick={() => {
                    handleSortParams('balance')
                  }}
                >
                  BALANCE
                  <ArrowUpDown />
                </Button>
              </div>
            </TableHead>
            <TableHead className="h-6 pr-3 text-xs text-right text-accent">STATUS</TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      {sortedCategories.map((budgetCategory) => {
        const { estimated: totalEstimated, paid: totalPaid, balance: totalBalance } =
          getCategoryTotals(budgetCategory);

        let isCategoryPaid = false;
        if (budgetCategory.budgetSubcategories.length > 0) {
          isCategoryPaid = budgetCategory.budgetSubcategories.every((subcategory) => subcategory.status === BudgetStatus.PAID);
        }

        return (
          <Collapsible key={budgetCategory.id} defaultOpen={budgetCategory.budgetSubcategories.length > 0}>
            <Table className="table-fixed">
              {/** custom column sizing */}
              <CategoryColumns />
              <TableHeader>
                <TableRow className="group/category">
                  <TableHead className="pt-2">
                    <CollapsibleTrigger className="group">
                      <ChevronDown className="w-4 h-4 group-data-[state=open]:rotate-180 transition-transform"/>
                    </CollapsibleTrigger>
                  </TableHead>
                  <TableHead className="font-bold text-lg pb-1 md:pb-0">
                    {/* Mobile: no hover on touch, so the pen is always shown to the right of the title. */}
                    <div className="flex items-center overflow-y-scroll py-2 text-xl md:hidden">
                      <div>
                        {budgetCategory.name}
                        <p className="text-xs text-accent">{toCurrency(totalEstimated)} est. <span className="text-sm leading-tight">•</span> {toCurrency(totalPaid)} paid</p>
                      </div>
                      <Button
                        variant={'ghost'}
                        aria-label={`Edit ${budgetCategory.name}`}
                        className="ml-2 text-gold/40 p-1 hover:bg-olivine hover:text-background"
                        onClick={() => {
                          onEditCategory(budgetCategory.id)
                        }}
                      >
                        <SquarePen />
                      </Button>
                    </div>

                    {/* Desktop: pen hidden on the left (zero layout width), revealed on row hover as the title slides right. */}
                    <div className="relative hidden items-center md:flex">
                      <Button
                        variant={'ghost'}
                        aria-label={`Edit ${budgetCategory.name}`}
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-gold/40 p-1 opacity-0 transition-opacity group-hover/category:opacity-100 focus-visible:opacity-100 hover:bg-olivine hover:text-background active:-translate-y-3.75!"
                        onClick={() => {
                          onEditCategory(budgetCategory.id)
                        }}
                      >
                        <SquarePen />
                      </Button>
                      <div className="transition-transform duration-200 group-hover/category:translate-x-8">
                        {budgetCategory.name}
                      </div>
                    </div>
                  </TableHead>
                  <TableHead className="hidden font-bold text-lg md:table-cell">{toCurrency(totalEstimated)}</TableHead>
                  <TableHead className="hidden font-bold text-lg md:table-cell">{toCurrency(totalPaid)}</TableHead>
                  <TableHead className="text-right font-bold md:text-lg">{toCurrency(totalBalance)}</TableHead>
                  <TableHead className="text-right font-bold">
                  <Badge variant={isCategoryPaid ? 'PAID' : 'DUE'} className="text-lg">
                    {isCategoryPaid ? 'PAID' : 'DUE'}
                  </Badge>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <CollapsibleContent asChild>
                <TableBody>
                  {budgetCategory.budgetSubcategories.map((budgetSubcategory) => (
                    <SubcategoryRow
                      key={budgetSubcategory.id}
                      subcategory={budgetSubcategory}
                      onDeleteSubcategory={onDeleteSubcategory}
                      onEditSubcategory={onEditSubcategory}
                    />
                  ))}
                  <TableRow className="border-b! border-burg! hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <Button
                        variant={'ghost'}
                        className="text-burg/40 text-xs ml-5 hover:bg-burg hover:text-background"
                        onClick={() => {
                          onAddSubcategory(budgetCategory.id)
                        }}
                      >
                        Add Subcategory
                        <CirclePlus/>
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </CollapsibleContent>
            </Table>
          </Collapsible>
        );
      })}
    </>
  );
}
