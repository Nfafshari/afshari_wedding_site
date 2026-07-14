"use client";

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

import { deleteBudgetSubcategory, type ErrorField } from "../../action";
import type { BudgetSubcategory } from "../../page";

interface RemoveSubcategoryDialogProps {
  /** The subcategory to delete. */
  subcategoryToRemove: BudgetSubcategory | undefined;
  /** Called after the subcategory is deleted so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function RemoveSubcategoryDialog({ subcategoryToRemove, onSuccess }: RemoveSubcategoryDialogProps) {
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  async function removeSubcategory(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    await runAction(() => deleteBudgetSubcategory(subcategoryToRemove?.id));
  }

  return (
    <AlertDialogContent id="remove-subcategory-dialog" className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full text-destructive">
          Delete <span className="font-bold">{subcategoryToRemove?.name}</span>?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-destructive">
          You are about to delete {subcategoryToRemove?.name}. This cannot be undone. Do you wish to continue?
        </AlertDialogDescription>
        {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
        <AlertDialogCancel variant={'secondary'} className="hover:bg-gold/90">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className={isLoading ? 'bg-destructive/30!' : 'bg-destructive! text-white hover:bg-destructive/90!'}
          onClick={removeSubcategory}
        >
          {isLoading ? <Spinner /> : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
