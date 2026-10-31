"use client";

import { ArrowUpDown, ChevronDown, CirclePlus, Receipt } from "lucide-react";

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
import BudgetStatusBadge from "@/components/budget-status-badge";
import RowActionButton from "@/components/row-action-button";
import TableEmptyState from "@/components/table-empty-state";
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
  /** Open the delete-confirmation dialog for the given category. */
  onDeleteCategory(budgetCategoryId: number): void;
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

export default function CategoryTable ({ data, onAddSubcategory, onDeleteCategory, onDeleteSubcategory, onEditCategory, onEditSubcategory }: CategoryTableProps) {
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
        <CategoryColumns />
        <TableHeader>
          <TableRow variant="heading">
            <TableHead variant="label"/>
            <TableHead variant="label">Category</TableHead>
            <TableHead variant="label" numeric className="hidden md:table-cell">
              <SortButton label="Estimated" onClick={() => handleSortParams('estimated')} />
            </TableHead>
            <TableHead variant="label" numeric className="hidden md:table-cell">
              <SortButton label="Paid" onClick={() => handleSortParams('paid')} />
            </TableHead>
            <TableHead variant="label" numeric>
              <SortButton label="Balance" onClick={() => handleSortParams('balance')} />
            </TableHead>
            <TableHead variant="label" className="pr-3 text-right">Status</TableHead>
            <TableHead variant="label" className="hidden md:table-cell"/>
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

        const actions = (
          <>
            <RowActionButton action="edit" aria-label={`Edit ${budgetCategory.name}`} onClick={() => onEditCategory(budgetCategory.id)} />
            <RowActionButton action="delete" aria-label={`Delete ${budgetCategory.name}`} onClick={() => onDeleteCategory(budgetCategory.id)} />
          </>
        );

        const addSubcategoryButton = (
          <Button
            variant={'ghost'}
            className="text-xs"
            onClick={() => {
              onAddSubcategory(budgetCategory.id)
            }}
          >
            Add Subcategory
            <CirclePlus/>
          </Button>
        );

        return (
          <Collapsible key={budgetCategory.id} defaultOpen={budgetCategory.budgetSubcategories.length > 0}>
            <Table className="table-fixed">
              {/** custom column sizing */}
              <CategoryColumns />
              <TableHeader>
                <TableRow variant="group">
                  <TableHead className="pt-2">
                    <CollapsibleTrigger className="group rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Show subcategories in ${budgetCategory.name}`}>
                      <ChevronDown className="w-4 h-4 group-data-[state=open]:rotate-180 transition-transform"/>
                    </CollapsibleTrigger>
                  </TableHead>
                  <TableHead className="font-bold text-lg pb-1 md:pb-0">
                    {/* Mobile: est/paid and the actions fold into sublines, since their columns are hidden. */}
                    <div className="flex flex-col py-2 text-xl md:hidden">
                      <div className="flex flex-col overflow-x-auto">
                        {budgetCategory.name}
                        <p className="text-xs text-gold-ink tabular-nums">{toCurrency(totalEstimated)} est. <span className="text-sm leading-tight">•</span> {toCurrency(totalPaid)} paid</p>
                      </div>
                      <div className="-ml-2 mt-1 flex">{actions}</div>
                    </div>
                    <span className="hidden truncate md:block">{budgetCategory.name}</span>
                  </TableHead>
                  <TableHead numeric className="hidden font-bold text-lg md:table-cell">{toCurrency(totalEstimated)}</TableHead>
                  <TableHead numeric className="hidden font-bold text-lg md:table-cell">{toCurrency(totalPaid)}</TableHead>
                  <TableHead numeric className="font-bold md:text-lg">{toCurrency(totalBalance)}</TableHead>
                  <TableHead className="text-right font-bold">
                    <BudgetStatusBadge status={isCategoryPaid ? 'PAID' : 'DUE'} />
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <div className="flex justify-end">{actions}</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <CollapsibleContent asChild>
                <TableBody variant="group">
                  {budgetCategory.budgetSubcategories.map((budgetSubcategory) => (
                    <SubcategoryRow
                      key={budgetSubcategory.id}
                      subcategory={budgetSubcategory}
                      onDeleteSubcategory={onDeleteSubcategory}
                      onEditSubcategory={onEditSubcategory}
                    />
                  ))}
                  <TableRow variant="static">
                    <TableCell colSpan={7}>
                      {budgetCategory.budgetSubcategories.length === 0 ? (
                        <TableEmptyState icon={Receipt} message={`Nothing in ${budgetCategory.name} yet.`}>
                          {addSubcategoryButton}
                        </TableEmptyState>
                      ) : (
                        <div className="ml-5">{addSubcategoryButton}</div>
                      )}
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

/** A column label that sorts by it. The negative margin lines its text up with the numbers below. */
function SortButton ({ label, onClick }: { label: string; onClick(): void }) {
  return (
    <Button
      variant={'ghost'}
      size={'sm'}
      className="-mr-1.5 px-1.5 h-6 text-xs tracking-wide uppercase text-gold-ink"
      onClick={onClick}
    >
      {label}
      <ArrowUpDown />
    </Button>
  );
}
