"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { ChevronDown, CirclePlus, SquarePen, Trash2 } from "lucide-react";
import { toCurrency } from "@/lib/utils";
import CategoryColumns from "./category-columns";
import { BudgetCategory } from "../page";
import { Button } from "@/components/ui/button";

interface CategoryTableProps {
  data: BudgetCategory[];
  /** Open the "add subcategory" dialog for the given category. */
  onAddSubcategory(budgetCategoryId: number): void;
  /** Open the delete-confirmation dialog for the given subcategory. */
  onDeleteSubcategory(subcategoryId: number): void;
  /** Open the edit/delete dialog for the given category. */
  onEditCategory(budgetCategoryId: number): void;
}

export default function CategoryTable ({ data, onAddSubcategory, onDeleteSubcategory, onEditCategory }: CategoryTableProps) {
  return (
    <>
      {/** custom heading */}
      <Table className="w-full table-fixed">
        {/** custom column sizing */}
        <CategoryColumns />
        <TableHeader>
          <TableRow className="hover:bg-background border-b border-b-accent">
            <TableHead className="h-6"/>
            <TableHead className="h-6 text-xs leading-tight text-accent">CATEGORY</TableHead>
            <TableHead className="hidden h-6 text-xs leading-tight text-accent md:table-cell">ESTIMATED</TableHead>
            <TableHead className="hidden h-6 text-xs leading-tight text-accent md:table-cell">PAID</TableHead>
            <TableHead className="h-6 text-xs leading-tight text-right text-accent">BALANCE</TableHead>
            <TableHead className="h-6 text-xs leading-tight text-right text-accent">STATUS</TableHead>
          </TableRow>
        </TableHeader>
      </Table>

      {data.map((budgetCategory) => {
        const totalEstimated = budgetCategory.budgetSubCategories.reduce((sum, sub) => sum + sub.estimatedCost, 0);
        const totalPaid = budgetCategory.budgetSubCategories.reduce((sum, sub) => sum + sub.paidAmount, 0);
        const totalBalance = totalEstimated - totalPaid;

        return (
          <Collapsible key={budgetCategory.id} defaultOpen>
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
                  <TableHead className="font-bold">
                    {/* Mobile: no hover on touch, so the pen is always shown to the right of the title. */}
                    <div className="flex items-center md:hidden">
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
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-gold/40 p-1 opacity-0 transition-opacity group-hover/category:opacity-100 focus-visible:opacity-100 hover:bg-olivine hover:text-background"
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
                  <TableHead className="hidden font-bold md:table-cell">{toCurrency(totalEstimated)}</TableHead>
                  <TableHead className="hidden font-bold md:table-cell">{toCurrency(totalPaid)}</TableHead>
                  <TableHead className="text-right font-bold">{toCurrency(totalBalance)}</TableHead>
                  <TableHead className="text-right font-bold">DUE</TableHead>
                </TableRow>
              </TableHeader>
              <CollapsibleContent asChild>
                <TableBody className="last:border-b border-burg">
                  {budgetCategory.budgetSubCategories.map((budgetSubCategory) => (
                    <TableRow key={budgetSubCategory.id}>
                      <TableCell>
                        <div className="flex justify-center">
                          <Button
                            variant={'ghost'}
                            aria-label={`Delete ${budgetSubCategory.name}`}
                            className="text-gold/40 p-1 ml-1 hover:bg-destructive hover:text-background"
                            onClick={() => {
                              onDeleteSubcategory(budgetSubCategory.id)
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="text-lg md:hidden">
                          {budgetSubCategory.name}
                          <p className="text-xs text-accent">{toCurrency(budgetSubCategory.estimatedCost)} est. <span className="text-sm leading-tight">•</span> {toCurrency(budgetSubCategory.paidAmount)} paid</p>
                        </div>
                        <div className="hidden truncate md:block">{budgetSubCategory.name}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{toCurrency(budgetSubCategory.estimatedCost)}</TableCell>
                      <TableCell className="hidden md:table-cell">{toCurrency(budgetSubCategory.paidAmount)}</TableCell>
                      <TableCell className="text-right">{toCurrency(budgetSubCategory.estimatedCost - budgetSubCategory.paidAmount)}</TableCell>
                      <TableCell className="text-right">PAID</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="hover:bg-background">
                    <TableCell>
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
