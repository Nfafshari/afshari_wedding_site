"use client";

import { useState } from "react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/dialog-submit";

import { createBudgetCategory, type ErrorField } from "../../action";
import type { BudgetCategory } from "../../page";

interface AddCategoryDialogProps {
  /** Existing categories, used for the client-side duplicate-name check. */
  budgetCategories: BudgetCategory[];
  /** Called after a category is created so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function AddCategoryDialog({ budgetCategories, onSuccess }: AddCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [isEmptyInput, setIsEmptyInput] = useState(false);
  const [isUniqueCategory, setIsUniqueCategory] = useState(true);
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function addCategory() {
    // Client-side checks for instant feedback (the server re-checks these too).
    if (categoryName.trim() === '') {
      setIsEmptyInput(true);
      return;
    }

    // check if there is already a category with that name
    const isDuplicate = budgetCategories.some(
      (cat) => cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
    );

    if (isDuplicate) {
      setIsUniqueCategory(false);
      return;
    }

    await runAction(() => createBudgetCategory(categoryName));
  }

  return (
    <FormDialog
      id="add-category-dialog"
      title="Add New Category?"
      isLoading={isLoading}
      onSubmit={addCategory}
    >
      <Field className="flex w-full text-burg">
        <FieldLabel htmlFor="category-name">Category Name</FieldLabel>
        <Input
          id="category-name"
          type="text"
          placeholder="Category"
          className={`bg-popover text-burg rounded-sm ${(isEmptyInput || !isUniqueCategory || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setCategoryName(e.target.value);
            // Typing clears any previous error so the user gets a fresh start.
            if (e.target.value !== '') {
              setIsEmptyInput(false);
            }
            setIsUniqueCategory(true);
            clearServerError();
          }}
        />
        {isEmptyInput && <p className="text-destructive/80 text-xs">Category name cannot be empty</p>}
        {!isUniqueCategory && <p className="text-destructive/80 text-xs">Category already exists!</p>}
        {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>
    </FormDialog>
  );
}
