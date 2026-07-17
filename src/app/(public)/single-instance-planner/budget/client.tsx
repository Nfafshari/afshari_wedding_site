"use client";

import { useState } from "react";
import { CirclePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StackedProgressBar, type ProgressBarLegend } from "@/components/stacked-progress-bar";
import { AlertDialog } from "@/components/ui/alert-dialog";

import { useDemoPlanner } from "../demo-store";
import { toCurrency } from "@/lib/utils";
import CategoryTable from "./components/category-table";
import AddCategoryDialog from "./components/budget-dialogs/add-category-dialog";
import AddSubcategoryDialog from "./components/budget-dialogs/add-subcategory-dialog";
import RemoveSubcategoryDialog from "./components/budget-dialogs/remove-subcategory-dialog";
import EditCategoryDialog from "./components/budget-dialogs/edit-category-dialog";
import EditSubcategoryDialog from "./components/budget-dialogs/edit-subcategory-dialog";

export enum DialogType {
  None =        'none',
  Category =    'category',
  Subcategory = 'subcategory',
  Edit =        'edit',
  EditSubcat =  'editSubcat',
  Delete =      'delete'
}

export default function Budget () {
  const { budgetCategories } = useDemoPlanner();

  const LIMITS = { target: 15000, cap: 20000 };

  const [activeDialog, setActiveDialog] = useState(DialogType.None);
  // Which category a new subcategory attaches to, and which subcategory a delete targets.
  const [activeBudgetCategoryId, setActiveBudgetCategoryId] = useState<number | null>(null);
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<number | null>(null);

  // The category a pending edit refers to.
  const categoryToUpdate = budgetCategories.find(
    (budgetCategory) => budgetCategory.id === activeBudgetCategoryId
  );

  // The subcategory a pending delete refers to (searched across every category).
  const activeSubcategory = budgetCategories
    .flatMap((budgetCategory) => budgetCategory.budgetSubcategories)
    .find((subcategory) => subcategory.id === activeSubcategoryId);

  // total estimated cost of all categories
  const totalEstimatedCost = budgetCategories
    .flatMap((budgetCategory) => budgetCategory.budgetSubcategories)
    .reduce((sum, subcategory) => sum += subcategory.estimatedCost, 0);

  // total paid amount of all categories
  const totalPaidAmount = budgetCategories
    .flatMap((budgetCategory) => budgetCategory.budgetSubcategories)
    .reduce((sum, subcategory) => sum += subcategory.paidAmount, 0);

  const totalBalance = totalEstimatedCost - totalPaidAmount;

  // progress bar legend values
  const progressLegend: ProgressBarLegend = {
    primary: { label: 'Estimated', value: totalEstimatedCost, color: 'var(--gold)' },
    secondary: { label: 'Spent', value: totalPaidAmount, color: 'var(--foreground)' }
  }

  function closeDialog () {
    setActiveDialog(DialogType.None);
    setActiveBudgetCategoryId(null);
    setActiveSubcategoryId(null);
  }

  // Opens the "add subcategory" dialog for a specific category.
  function onAddSubcategory (budgetCategoryId: number) {
    setActiveBudgetCategoryId(budgetCategoryId);
    setActiveDialog(DialogType.Subcategory);
  }

  // Opens the delete-confirmation dialog for a specific subcategory.
  function onDeleteSubcategory (subcategoryId: number) {
    setActiveSubcategoryId(subcategoryId);
    setActiveDialog(DialogType.Delete);
  }

  // Opens the edit/delete dialog for a specific category.
  function onEditCategory (budgetCategoryId: number) {
    setActiveBudgetCategoryId(budgetCategoryId);
    setActiveDialog(DialogType.Edit);
  }

  // Opens the edit/delete dialog for a specific subcategory.
  function onEditSubcategory (budgetSubcategoryId: number) {
    setActiveSubcategoryId(budgetSubcategoryId);
    setActiveDialog(DialogType.EditSubcat);
  }

  return (
    <AlertDialog
      open={activeDialog !== DialogType.None}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          closeDialog();
        }
      }}
    >
      <div className="w-full min-h-full bg-background font-sans text-burg px-6 py-2 md:px-12 lg:px-16">
        {/** title */}
        <div className="flex w-full">
          <h1 className="page-title w-full text-center translate-y-3 md:text-start">Budget Tracker</h1>
          <div className="hidden flex-col w-1/2 ml-auto md:flex">
            <h2 className="page-title text-2xl text-end">{toCurrency(totalPaidAmount)} Paid</h2>
            <h3 className="section-title text-end text-sm">{toCurrency(totalBalance)} Remaining</h3>
          </div>
        </div>
        <hr className="my-5 bg-accent"/>

        <div className="flex flex-col justify-center items-center md:hidden">
          <h2 className="page-title text-6xl text-olivine">{toCurrency(totalPaidAmount)}</h2>
          <h3 className="section-title text-sm text-accent-foreground font-normal">Paid of {toCurrency(totalEstimatedCost)} Estimated</h3>
        </div>

        {/** overview */}
        <div className="grid pt-3 lg:grid-cols-2 lg:gap-10">
          <div className="flex flex-col w-full px-2">
            <h3 className="hidden section-title font-normal text-accent-foreground ml-1 mb-3 md:flex">Estimated/Spent vs. Soft/Hard Caps</h3>
            <StackedProgressBar
              limits={LIMITS}
              legend={progressLegend}
            />
          </div>
          <div className="hidden flex-col w-full mt-5 md:mt-0 md:flex">
            <div className="flex py-4 items-center border-b border-b-accent">
              <p className="text-gold mt-1 text-xl">ESTIMATED TOTAL</p>
              <p className="ml-auto text-3xl md:text-4xl">{toCurrency(totalEstimatedCost)}</p>
            </div>
            <div className="flex py-4 items-center border-b border-b-accent">
              <p className="text-gold mt-1 text-xl">PAID TO DATE</p>
              <p className="ml-auto text-3xl text-olivine md:text-4xl">{toCurrency(totalPaidAmount)}</p>
            </div>
            <div className="flex py-4 items-center border-b border-b-accent">
              <p className="text-gold mt-1 text-xl">BALANCE DUE</p>
              <p className="ml-auto text-red-800 text-3xl md:text-4xl">{toCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>

        {/** Category breakdown */}
        <div className="mt-10 w-full">
          <h3 className="text-accent-foreground text-lg mb-2">By Category Breakdown</h3>
          <CategoryTable
            data={budgetCategories}
            onAddSubcategory={onAddSubcategory}
            onDeleteSubcategory={onDeleteSubcategory}
            onEditCategory={onEditCategory}
            onEditSubcategory={onEditSubcategory}
          />
          <Button
            variant={'ghost'}
            className="text-burg/40 ml-5 hover:bg-burg hover:text-background"
            onClick={() => {
              setActiveDialog(DialogType.Category)
            }}
          >
            Add Category
            <CirclePlus/>
          </Button>
        </div>
      </div>

      {/* Each dialog owns its own form state; rendering it conditionally mounts/unmounts (and resets) it. */}
      {activeDialog === DialogType.Category && (
        <AddCategoryDialog
          budgetCategories={budgetCategories}
          onSuccess={closeDialog}
        />
      )}

      {activeDialog === DialogType.Subcategory && (
        <AddSubcategoryDialog
          budgetCategories={budgetCategories}
          budgetCategoryId={activeBudgetCategoryId}
          onSuccess={closeDialog}
        />
      )}

      {activeDialog === DialogType.Delete && (
        <RemoveSubcategoryDialog
          subcategoryToRemove={activeSubcategory}
          onSuccess={closeDialog}
        />
      )}

      {activeDialog === DialogType.Edit && (
        <EditCategoryDialog
          budgetCategories={budgetCategories}
          categoryToUpdate={categoryToUpdate}
          onSuccess={closeDialog}
        />
      )}

      {activeDialog === DialogType.EditSubcat && activeSubcategory && (
        <EditSubcategoryDialog
          subcategoryToUpdate={activeSubcategory}
          onSuccess={closeDialog}
        />
      )}
    </AlertDialog>
  );
}
