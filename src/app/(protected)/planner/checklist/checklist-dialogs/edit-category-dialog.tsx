"use client";

import { useState } from "react";
import * as Lucide from "lucide-react";
import { LucideIcon } from "lucide-react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/confirm-dialog";
import FormDialog from "@/components/form-dialog";

import { updateCategory, deleteCategory, type ErrorField } from "@/app/(protected)/planner/checklist/action";
import type { CategoryWithTasks } from "@/app/(protected)/planner/checklist/page";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

const ICON_LIBRARY: LucideIcon[] = [
  Lucide.HandCoins, Lucide.CalendarDays, Lucide.Gift, Lucide.Car,
  Lucide.Store, Lucide.Timer, Lucide.Utensils, Lucide.Cake, Lucide.Astroid,
];

interface AddCategoryDialogProps {
  /** Existing categories, used for the client-side duplicate-name check. */
  categories: CategoryWithTasks[];
  /** Category to be updated */
  categoryToUpdate: CategoryWithTasks | undefined;
  /** Called after a category is created so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function EditCategoryDialog({ categories, categoryToUpdate, onSuccess }: AddCategoryDialogProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newIcon, setNewIcon] = useState('Astroid');
  const [isEmptyInput, setIsEmptyInput] = useState(false);
  const [isUniqueCategory, setIsUniqueCategory] = useState(true);
  // Opens the delete confirmation on top of the edit form.
  const [isDeleteCategoryActive, setIsDeleteCategoryActive] = useState(false);

  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function editCategory() {
    // Client-side checks for instant feedback (the server re-checks these too).
    if (newCategoryName.trim() === '') {
      setIsEmptyInput(true);
      return;
    }

    for (let i = 0; i < categories.length; i++) {
        // exclide category that is being edited
        if (categories[i].name === categoryToUpdate?.name) {
            continue;
        } else if (newCategoryName === categories[i].name) {
            setIsUniqueCategory(false);
            return;
        }
    }

    await runAction("Category saved", () => updateCategory(categoryToUpdate?.id, newCategoryName, newIcon));
  }

  async function removeCategory() {
    await runAction("Category deleted", () => deleteCategory(categoryToUpdate?.id));
  }

  return (
    <>
      <FormDialog
        id="edit-category-dialog"
        title={`Edit ${categoryToUpdate?.name ?? "Category"}`}
        submitLabel="Save changes"
        isLoading={isLoading && !isDeleteCategoryActive}
        onSubmit={editCategory}
      >
        <Field className="flex w-full text-burg">
          <FieldLabel htmlFor="category-name">New Category Name</FieldLabel>
          <Input
            id="category-name"
            type="text"
            placeholder={categoryToUpdate?.name}
            aria-invalid={Boolean(isEmptyInput || !isUniqueCategory || serverErrorField === 'name')}
            onChange={(e) => {
              setNewCategoryName(e.target.value);
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
          {serverError && !isDeleteCategoryActive && <p className="text-destructive/80 text-xs">{serverError}</p>}
        </Field>
        <div className="flex flex-col w-full items-start text-burg">
          Icon:
          <div className="h-30 w-full overflow-y overflow-y-scroll">
            <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full">
              {ICON_LIBRARY.map((icon, idx) => {
                const Icon = icon;
                return (
                  <Button
                    type="button"
                    variant={'outline'}
                    aria-pressed={newIcon === icon.displayName}
                    aria-label={icon.displayName}
                    key={idx}
                    onClick={() => {
                      setNewIcon(icon.displayName ?? '')
                    }}
                  >
                    <Icon />
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
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
        description="This also deletes every task in it. You can't undo this."
        isLoading={isLoading}
        error={serverError || undefined}
        onConfirm={removeCategory}
      />
    </>
  );
}
