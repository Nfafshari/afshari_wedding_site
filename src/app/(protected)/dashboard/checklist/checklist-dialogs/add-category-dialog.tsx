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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { createCategory, type ErrorField } from "@/app/(protected)/dashboard/checklist/action";
import type { CategoryWithTasks } from "@/app/(protected)/dashboard/checklist/page";

const ICON_LIBRARY: LucideIcon[] = [
  Lucide.HandCoins, Lucide.CalendarDays, Lucide.Gift, Lucide.Car,
  Lucide.Store, Lucide.Timer, Lucide.Utensils, Lucide.Cake, Lucide.Astroid,
];

interface AddCategoryDialogProps {
  /** Existing categories, used for the client-side duplicate-name check. */
  categories: CategoryWithTasks[];
  /** Called after a category is created so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function AddCategoryDialog({ categories, onSuccess }: AddCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [activeIcon, setActiveIcon] = useState('Astroid');
  const [isEmptyInput, setIsEmptyInput] = useState(false);
  const [isUniqueCategory, setIsUniqueCategory] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverErrorField, setServerErrorField] = useState<ErrorField | null>(null);

  async function addCategory(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    // Client-side checks for instant feedback (the server re-checks these too).
    if (categoryName.trim() === '') {
      setIsEmptyInput(true);
      return;
    }

    // check if there is already a category with that name
    const isDuplicate = categories.some(
      (cat) => cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
    );

    if (isDuplicate) {
      setIsUniqueCategory(false);
      return;
    }

    setIsLoading(true);
    const result = await createCategory(categoryName, activeIcon);
    setIsLoading(false);

    if (!result.ok) {
      setServerError(result.error);
      setServerErrorField(result.field ?? null);
      return;
    }

    onSuccess();
  }

  return (
    <AlertDialogContent id="add-category-dialog" className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full">Add New Category?</AlertDialogTitle>
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
              setServerError('');
              setServerErrorField(null);
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
                  className={`bg-popover border-olivine text-olivine hover:bg-olivine hover:text-background ${activeIcon === icon.displayName ? 'bg-olivine text-background' : 'bg-popover'}`}
                  key={idx}
                  onClick={() => {
                    setActiveIcon(icon.displayName ?? '')
                  }}
                >
                  <Icon />
                </Button>
              )
            })}
          </div>
        </div>
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
        <AlertDialogCancel variant={'secondary'} className="hover:bg-gold/90">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className={isLoading ? 'bg-primary/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
          onClick={addCategory}
        >
          {isLoading ? <Spinner /> : 'Add'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
