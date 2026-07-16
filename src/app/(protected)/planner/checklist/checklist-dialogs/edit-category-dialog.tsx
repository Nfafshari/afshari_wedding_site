"use client";

import { useState } from "react";
import * as Lucide from "lucide-react";
import { LucideIcon } from "lucide-react";

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
  const [isDeleteCategoryActive, setIsDeleteCategoryActive] = useState(false);

  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  async function editCategory(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

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

    await runAction("Category updated", () => updateCategory(categoryToUpdate?.id, newCategoryName, newIcon));
  }

  async function removeCategory(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    await runAction("Category removed", () => deleteCategory(categoryToUpdate?.id));
  }

  if (!isDeleteCategoryActive) {
    return (
      <AlertDialogContent id="add-category-dialog" className="bg-popover rounded-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="page-title border-b border-b-burg w-full">Edit <span className="font-bold">{categoryToUpdate?.name}</span>?</AlertDialogTitle>
          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="category-name">New Category Name</FieldLabel>
            <Input
              id="category-name"
              type="text"
              placeholder={categoryToUpdate?.name}
              className={`bg-popover text-burg rounded-sm placeholder:text-muted-foreground ${(isEmptyInput || !isUniqueCategory || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
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
            {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
          </Field>
          <div className="flex flex-col w-full items-start overflow-y overflow-y-scroll mt-2 text-burg">
            Icon:
            <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full">
              {ICON_LIBRARY.map((icon, idx) => {
                const Icon = icon;
                return (
                  <Button
                    variant={'outline'}
                    className={`bg-popover border-olivine text-olivine hover:bg-olivine hover:text-background ${newIcon === icon.displayName ? 'bg-olivine text-background' : 'bg-popover'}`}
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
          <Button
            variant={'destructive'}
            className={`w-full mt-4 border border-destructive hover:bg-destructive hover:text-white`}
            onClick={() => {
              setIsDeleteCategoryActive(true)
            }}
          >
            Delete {categoryToUpdate?.name}?
          </Button>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-muted/20 rounded-sm rounded-t-none">
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
  } else {
    return (
      <AlertDialogContent id="add-category-dialog" className="bg-popover rounded-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="page-title border-b border-b-burg w-full text-destructive">Delete <span className="font-bold">{categoryToUpdate?.name}</span>?</AlertDialogTitle>
          <AlertDialogDescription className="text-destructive">
            You are about to delete {categoryToUpdate?.name}, this will delete the category as well as all tasks within the category. Do you wish to continue?
          </AlertDialogDescription>
          {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-muted/20 rounded-sm rounded-t-none">
          <AlertDialogCancel
            variant={'secondary'} 
            className="hover:bg-gold/90"
            onClick={(e) => {
              setIsDeleteCategoryActive(false)
              e.preventDefault();
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
}
