"use client";

import ConfirmDialog from "@/components/confirm-dialog";
import { deleteTask, type ErrorField } from "@/app/(protected)/planner/checklist/action";
import type { CategoryWithTasks } from "@/app/(protected)/planner/checklist/page";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

type TaskItem = CategoryWithTasks["tasks"][number];

interface RemoveTaskDialogProps {
  /** The task to delete. */
  taskToRemove: TaskItem | undefined;
  /** Called after the task is deleted so the parent can close the dialog. */
  onSuccess: () => void;
  /** Called when the user backs out. */
  onCancel: () => void;
}

export default function RemoveTaskDialog({ taskToRemove, onSuccess, onCancel }: RemoveTaskDialogProps) {
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={`Delete ${taskToRemove?.name}?`}
      description="You can't undo this."
      isLoading={isLoading}
      error={serverError || undefined}
      onConfirm={() => runAction("Task deleted", () => deleteTask(taskToRemove?.id))}
    />
  );
}
