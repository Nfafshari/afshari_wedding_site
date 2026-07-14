"use client";

import { useState } from "react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  /**
   * Validates the category name by checking if it is empty or already taken
   * @param value - string value of the name
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function nameValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Category name cannot be empty.';
    }

    // check if there is already a category with that name
    const isDuplicate = budgetCategories.some(
      (cat) => cat.name.toLowerCase().trim() === value.toLowerCase().trim()
    );
    if (isDuplicate) {
      return 'Category already exists!';
    }

    // return null if validation succeeded
    return null;
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function addCategory() {
    // Client-side checks for instant feedback (the server re-checks these too).
    const nameError = nameValidator(categoryName);
    if (nameError) {
      setFieldErrors({ name: nameError });
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
          className={`bg-popover text-burg rounded-sm ${(fieldErrors.name || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setCategoryName(e.target.value);
            // Typing clears any previous error so the user gets a fresh start.
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ name, ...rest }) => rest);
            }
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = nameValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, name: msg }));
            } else {
              setFieldErrors(({ name, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.name && <p className="text-destructive/80 text-xs">{fieldErrors.name}</p>}
        {(serverError && serverErrorField === 'name') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>
    </FormDialog>
  );
}
