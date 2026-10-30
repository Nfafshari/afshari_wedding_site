"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/confirm-dialog";
import FormDialog from "@/components/form-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { updateBudgetCategory, deleteBudgetCategory, type ErrorField } from "../../action";
import type { BudgetCategory } from "../../page";

interface EditCategoryDialogProps {
  /** Existing categories, used for the client-side duplicate-name check. */
  budgetCategories: BudgetCategory[];
  /** The category being edited. */
  categoryToUpdate: BudgetCategory | undefined;
  /** Called after a successful rename/delete so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function EditCategoryDialog({ budgetCategories, categoryToUpdate, onSuccess }: EditCategoryDialogProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  // Opens the delete confirmation on top of the edit form.
  const [isDeleteCategoryActive, setIsDeleteCategoryActive] = useState(false);
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

    // Reject a name already used by *another* category (skip the one being edited).
    const isDuplicate = budgetCategories.some(
      (cat) =>
        cat.id !== categoryToUpdate?.id &&
        cat.name.toLowerCase().trim() === value.toLowerCase().trim()
    );
    if (isDuplicate) {
      return 'Category already exists!';
    }

    // return null if validation succeeded
    return null;
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function editCategory() {
    // Client-side checks for instant feedback (the server re-checks these too).
    const nameError = nameValidator(newCategoryName);
    if (nameError) {
      setFieldErrors({ name: nameError });
      return;
    }

    await runAction("Category saved", () => updateBudgetCategory(categoryToUpdate?.id, newCategoryName));
  }

  async function removeCategory() {
    await runAction("Category deleted", () => deleteBudgetCategory(categoryToUpdate?.id));
  }

  return (
    <>
      <FormDialog
        id="edit-category-dialog"
        title={`Edit ${categoryToUpdate?.name ?? "Category"}`}
        submitLabel="Save changes"
        isLoading={isLoading && !isDeleteCategoryActive}
        error={!isDeleteCategoryActive && serverError && !serverErrorField ? serverError : undefined}
        onSubmit={editCategory}
      >
          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="edit-category-name">New Category Name</FieldLabel>
            <Input
              id="edit-category-name"
              type="text"
              placeholder={categoryToUpdate?.name}
              aria-invalid={Boolean(fieldErrors.name || serverErrorField === 'name')}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
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
          <Button
            type="button"
            variant={'ghost-destructive'}
            className="w-full"
            onClick={() => {
              clearServerError();
              setIsDeleteCategoryActive(true)
            }}
          >
            Delete {categoryToUpdate?.name}
          </Button>
      </FormDialog>
      <ConfirmDialog
        open={isDeleteCategoryActive}
        onOpenChange={setIsDeleteCategoryActive}
        title={`Delete ${categoryToUpdate?.name}?`}
        description="This also deletes every subcategory in it. You can't undo this."
        isLoading={isLoading}
        error={serverError || undefined}
        onConfirm={removeCategory}
      />
    </>
  );
}
