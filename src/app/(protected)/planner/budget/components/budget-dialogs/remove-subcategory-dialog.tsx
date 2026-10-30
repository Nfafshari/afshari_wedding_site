"use client";

import ConfirmDialog from "@/components/confirm-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { deleteBudgetSubcategory, type ErrorField } from "../../action";
import type { BudgetSubcategory } from "../../page";

interface RemoveSubcategoryDialogProps {
  /** The subcategory to delete. */
  subcategoryToRemove: BudgetSubcategory | undefined;
  /** Called after the subcategory is deleted so the parent can close the dialog. */
  onSuccess: () => void;
  /** Called when the user backs out. */
  onCancel: () => void;
}

export default function RemoveSubcategoryDialog({ subcategoryToRemove, onSuccess, onCancel }: RemoveSubcategoryDialogProps) {
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={`Delete ${subcategoryToRemove?.name}?`}
      description="You can't undo this."
      isLoading={isLoading}
      error={serverError || undefined}
      onConfirm={() => runAction("Subcategory deleted", () => deleteBudgetSubcategory(subcategoryToRemove?.id))}
    />
  );
}
