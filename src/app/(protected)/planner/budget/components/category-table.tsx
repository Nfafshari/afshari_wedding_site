"use client";

import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GroupedList, ListAddRow, ListCell, ListEmpty, ListGroup, ListHeadCell, ListHeader, ListRow } from "@/components/grouped-list";
import RowActionButton from "@/components/row-action-button";
import StatusChip from "@/components/status-chip";
import { useQueryParams } from "@/hooks/use-query-params";
import { getCategoryStatus, getCategoryTotals } from "@/lib/budget";
import { BUDGET_STATUS } from "@/lib/status";
import { toCurrency } from "@/lib/utils";

import { BudgetCategory, BudgetSubcategory } from "../page";

interface CategoryTableProps {
  data: BudgetCategory[];
  /** Open the "add line item" dialog for the given category. */
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
    // Category, then estimated and paid (folded under the name on phones), then balance and status.
    <GroupedList label="Budget by category" columns="minmax(0,1fr) 8rem 8rem 8rem 7.5rem">
      <ListHeader>
        <ListHeadCell>Category</ListHeadCell>
        <ListHeadCell numeric><SortButton label="Estimated" onClick={() => handleSortParams('estimated')} /></ListHeadCell>
        <ListHeadCell numeric><SortButton label="Paid" onClick={() => handleSortParams('paid')} /></ListHeadCell>
        <ListHeadCell numeric><SortButton label="Balance" onClick={() => handleSortParams('balance')} /></ListHeadCell>
        <ListHeadCell>Status</ListHeadCell>
      </ListHeader>

      {sortedCategories.map((budgetCategory) => {
        const lineItems = budgetCategory.budgetSubcategories;
        const totals = getCategoryTotals(budgetCategory);

        return (
          <ListGroup
            key={budgetCategory.id}
            title={budgetCategory.name}
            defaultOpen={lineItems.length > 0}
            meta={<MoneyMeta estimated={totals.estimated} paid={totals.paid} />}
            end={<BalanceAndStatus balance={totals.balance} status={getCategoryStatus(lineItems)} />}
            actions={
              <>
                <RowActionButton action="edit" aria-label={`Edit ${budgetCategory.name}`} onClick={() => onEditCategory(budgetCategory.id)} />
                <RowActionButton action="delete" aria-label={`Delete ${budgetCategory.name}`} onClick={() => onDeleteCategory(budgetCategory.id)} />
              </>
            }
          >
            {lineItems.map((lineItem) => (
              <ListRow
                key={lineItem.id}
                name={lineItem.name}
                meta={<MoneyMeta estimated={lineItem.estimatedCost} paid={lineItem.paidAmount} />}
                end={<BalanceAndStatus balance={lineItem.estimatedCost - lineItem.paidAmount} status={lineItem.status} />}
                actions={
                  <>
                    <RowActionButton action="edit" aria-label={`Edit ${lineItem.name}`} onClick={() => onEditSubcategory(lineItem.id)} />
                    <RowActionButton action="delete" aria-label={`Delete ${lineItem.name}`} onClick={() => onDeleteSubcategory(lineItem.id)} />
                  </>
                }
              />
            ))}
            {lineItems.length === 0 && <ListEmpty>No line items yet.</ListEmpty>}
            <ListAddRow onClick={() => onAddSubcategory(budgetCategory.id)}>Add line item</ListAddRow>
          </ListGroup>
        );
      })}
    </GroupedList>
  );
}

/** Estimated and paid: their own columns from md, a line under the name on phones. */
function MoneyMeta ({ estimated, paid }: { estimated: number; paid: number }) {
  return (
    <>
      <ListCell numeric phoneLabel="est.">{toCurrency(estimated)}</ListCell>
      <ListCell numeric phoneLabel="paid">{toCurrency(paid)}</ListCell>
    </>
  );
}

/** Balance and status stay on the right at every width. */
function BalanceAndStatus ({ balance, status }: { balance: number; status: BudgetSubcategory['status'] }) {
  return (
    <>
      <ListCell numeric>{toCurrency(balance)}</ListCell>
      <ListCell><StatusChip status={BUDGET_STATUS[status]} /></ListCell>
    </>
  );
}

/** A column label that sorts by it. The negative margin lines its text up with the numbers below. */
function SortButton ({ label, onClick }: { label: string; onClick(): void }) {
  return (
    <Button
      variant={'ghost'}
      size={'sm'}
      className="-mr-1.5 px-1.5 h-6 planner-label"
      onClick={onClick}
    >
      {label}
      <ArrowUpDown />
    </Button>
  );
}
