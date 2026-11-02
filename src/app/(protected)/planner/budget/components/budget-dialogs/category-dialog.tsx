"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/confirm-dialog";
import FormDialog from "@/components/form-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { checkRequired, checkUniqueName } from "@/lib/validate";

import { createBudgetCategory, deleteBudgetCategory, updateBudgetCategory, type ErrorField } from "../../action";
import type { BudgetCategory } from "../../page";

interface CategoryDialogProps {
  /** Existing categories, used for the client-side duplicate-name check. */
  budgetCategories: BudgetCategory[];
  /** The category to rename. Leave out to add a new one. */
  category?: BudgetCategory;
  /** Called after a save or delete so the parent can close the dialog. */
  onSuccess: () => void;
}

/** Adds a category (empty form, Add) or renames one (filled form, Save changes, Delete). */
export default function CategoryDialog({ budgetCategories, category, onSuccess }: CategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? '');
  // Opens the delete confirmation on top of the edit form.
  const [isDeleteActive, setIsDeleteActive] = useState(false);
  const { errors: fieldErrors, check, clear, checkAll } = useFieldErrors<ErrorField>();
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  const otherNames = budgetCategories.filter((other) => other.id !== category?.id).map((other) => other.name);
  const checkName = () => checkRequired(name, 'Category name') ?? checkUniqueName(name, otherNames, 'category');

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function save () {
    if (!checkAll({ name: checkName() })) return;

    if (category === undefined) {
      await runAction("Category added", () => createBudgetCategory(name));
      return;
    }

    // Unchanged, so close without a pointless write.
    if (name.trim() === category.name) {
      onSuccess();
      return;
    }

    await runAction("Category saved", () => updateBudgetCategory(category.id, name));
  }

  return (
    <>
      <FormDialog
        id="category-dialog"
        title={category ? `Edit ${category.name}` : "Add Category"}
        submitLabel={category ? "Save changes" : "Add"}
        isLoading={isLoading && !isDeleteActive}
        error={!isDeleteActive && serverError && !serverErrorField ? serverError : undefined}
        onSubmit={save}
      >
        <Field className="flex w-full text-burg">
          <FieldLabel htmlFor="category-name">Name</FieldLabel>
          <Input
            id="category-name"
            type="text"
            placeholder="Flowers"
            value={name}
            aria-invalid={Boolean(fieldErrors.name || serverErrorField === 'name')}
            onChange={(e) => {
              setName(e.target.value);
              clear('name');
              clearServerError();
            }}
            onBlur={() => check('name', checkName())}
          />
          {fieldErrors.name && <p className="text-destructive text-xs">{fieldErrors.name}</p>}
          {(serverError && serverErrorField === 'name') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>

        {category && (
          <Button
            type="button"
            variant={'ghost-destructive'}
            className="w-full"
            onClick={() => {
              clearServerError();
              setIsDeleteActive(true);
            }}
          >
            Delete {category.name}
          </Button>
        )}
      </FormDialog>
      {category && (
        <ConfirmDialog
          open={isDeleteActive}
          onOpenChange={setIsDeleteActive}
          title={`Delete ${category.name}?`}
          description="This also deletes every line item in it. You can't undo this."
          isLoading={isLoading}
          error={serverError || undefined}
          onConfirm={() => runAction("Category deleted", () => deleteBudgetCategory(category.id))}
        />
      )}
    </>
  );
}
