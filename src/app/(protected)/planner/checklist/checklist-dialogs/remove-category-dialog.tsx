"use client";

import ConfirmDialog from "@/components/confirm-dialog";
import { deleteCategory, type ErrorField } from "@/app/(protected)/planner/checklist/action";
import type { CategoryWithTasks } from "@/app/(protected)/planner/checklist/page";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

interface RemoveCategoryDialogProps {
  /** The category to delete. */
  categoryToRemove: CategoryWithTasks | undefined;
  /** Called after the category is deleted so the parent can close the dialog. */
  onSuccess: () => void;
  /** Called when the user backs out. */
  onCancel: () => void;
}

export default function RemoveCategoryDialog({ categoryToRemove, onSuccess, onCancel }: RemoveCategoryDialogProps) {
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={`Delete ${categoryToRemove?.name}?`}
      description="This also deletes every task in it. You can't undo this."
      isLoading={isLoading}
      error={serverError || undefined}
      onConfirm={() => runAction("Category deleted", () => deleteCategory(categoryToRemove?.id))}
    />
  );
}
