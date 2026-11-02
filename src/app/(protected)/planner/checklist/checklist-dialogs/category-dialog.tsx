"use client";

import { useState } from "react";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { checkRequired, checkUniqueName } from "@/lib/validate";

import { createCategory, updateCategory, type ErrorField } from "../action";
import type { CategoryWithTasks } from "../page";
import RemoveCategoryDialog from "./remove-category-dialog";

const ICON_LIBRARY: LucideIcon[] = [
  Lucide.Astroid, Lucide.HandCoins, Lucide.CalendarDays, Lucide.Gift,
  Lucide.Car, Lucide.Store, Lucide.Timer, Lucide.Utensils, Lucide.Cake,
  Lucide.Landmark, Lucide.Flower2, Lucide.Gem,
  Lucide.Camera, Lucide.Music, Lucide.Shirt, Lucide.Mail,
  Lucide.Church, Lucide.Plane,
];

interface CategoryDialogProps {
  /** Existing categories, used for the client-side duplicate-name check. */
  categories: CategoryWithTasks[];
  /** The category to edit. Leave out to add a new one. */
  category?: CategoryWithTasks;
  /** Called after a save or delete so the parent can close the dialog. */
  onSuccess: () => void;
}

/** Adds a category (empty form, Add) or edits one (filled with its name and icon, Save changes, Delete). */
export default function CategoryDialog({ categories, category, onSuccess }: CategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState(category?.icon ?? 'Astroid');
  // Opens the delete confirmation on top of the edit form.
  const [isDeleteActive, setIsDeleteActive] = useState(false);
  const { errors: fieldErrors, check, clear, checkAll } = useFieldErrors<ErrorField>();
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  const takenNames = categories.filter((other) => other.id !== category?.id).map((other) => other.name);

  // The messages come from lib/validate.ts, so they match what the server would say.
  const checkName = () => checkRequired(name, 'Category name') ?? checkUniqueName(name, takenNames, 'category');

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function save () {
    if (!checkAll({ name: checkName() })) return;

    if (category === undefined) {
      await runAction("Category added", () => createCategory(name, icon));
      return;
    }

    await runAction("Category saved", () => updateCategory(category.id, name, icon));
  }

  return (
    <>
      <FormDialog
        id="category-dialog"
        title={category ? `Edit ${category.name}` : "Add Category"}
        submitLabel={category ? "Save changes" : "Add"}
        isLoading={isLoading}
        error={serverError && serverErrorField !== 'name' ? serverError : undefined}
        onSubmit={save}
      >
        <Field className="flex w-full text-burg">
          <FieldLabel htmlFor="category-name">Category Name</FieldLabel>
          <Input
            id="category-name"
            type="text"
            placeholder="Venue"
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

        <div className="flex flex-col w-full items-start mt-2 text-burg">
          <span id="category-icon" className="text-sm font-medium">Icon</span>
          <div className="h-30 w-full overflow-y-scroll">
            <div role="group" aria-labelledby="category-icon" className="grid grid-cols-3 gap-1 w-full">
              {ICON_LIBRARY.map((Icon) => (
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={icon === Icon.displayName}
                  aria-label={Icon.displayName}
                  key={Icon.displayName}
                  onClick={() => setIcon(Icon.displayName ?? 'Astroid')}
                >
                  <Icon />
                </Button>
              ))}
            </div>
          </div>
        </div>

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
      {category && isDeleteActive && (
        <RemoveCategoryDialog
          categoryToRemove={category}
          onSuccess={onSuccess}
          onCancel={() => setIsDeleteActive(false)}
        />
      )}
    </>
  );
}
