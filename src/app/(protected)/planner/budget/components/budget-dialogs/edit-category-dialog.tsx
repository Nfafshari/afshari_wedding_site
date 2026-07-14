"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  // Flips this dialog between the "edit" view and the "confirm delete" view.
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

  async function editCategory(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    // Client-side checks for instant feedback (the server re-checks these too).
    const nameError = nameValidator(newCategoryName);
    if (nameError) {
      setFieldErrors({ name: nameError });
      return;
    }

    await runAction(() => updateBudgetCategory(categoryToUpdate?.id, newCategoryName));
  }

  async function removeCategory(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    await runAction(() => deleteBudgetCategory(categoryToUpdate?.id));
  }

  if (!isDeleteCategoryActive) {
    return (
      <AlertDialogContent id="edit-category-dialog" className="bg-popover rounded-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="page-title border-b border-b-burg w-full">Edit <span className="font-bold">{categoryToUpdate?.name}</span>?</AlertDialogTitle>
          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="edit-category-name">New Category Name</FieldLabel>
            <Input
              id="edit-category-name"
              type="text"
              placeholder={categoryToUpdate?.name}
              className={`bg-popover text-burg rounded-sm placeholder:text-muted-foreground ${(fieldErrors.name || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
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
            variant={'destructive'}
            className="w-full mt-4 border border-destructive hover:bg-destructive hover:text-white"
            onClick={() => {
              setIsDeleteCategoryActive(true)
            }}
          >
            Delete {categoryToUpdate?.name}?
          </Button>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
          <AlertDialogCancel variant={'secondary'} className="hover:bg-gold/90">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={isLoading ? 'bg-primary/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
            onClick={editCategory}
          >
            {isLoading ? <Spinner /> : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  }

  return (
    <AlertDialogContent id="delete-category-dialog" className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full text-destructive">Delete <span className="font-bold">{categoryToUpdate?.name}</span>?</AlertDialogTitle>
        <AlertDialogDescription className="text-destructive">
          You are about to delete {categoryToUpdate?.name}. This will delete the category and every subcategory within it. This cannot be undone. Do you wish to continue?
        </AlertDialogDescription>
        {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
        <AlertDialogCancel
          variant={'secondary'}
          className="hover:bg-gold/90"
          onClick={(e) => {
            // Go back to the edit view instead of closing the whole dialog.
            e.preventDefault();
            setIsDeleteCategoryActive(false);
          }}
        >
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className={isLoading ? 'bg-destructive/30!' : 'bg-destructive! text-white hover:bg-destructive/80!'}
          onClick={removeCategory}
        >
          {isLoading ? <Spinner /> : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
