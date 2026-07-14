"use client";

import { useState } from "react";

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

import { deleteTask } from "@/app/(protected)/planner/checklist/action";
import type { CategoryWithTasks } from "@/app/(protected)/planner/checklist/page";

type TaskItem = CategoryWithTasks["tasks"][number];

interface RemoveTaskDialogProps {
  /** The task to delete. */
  taskToRemove: TaskItem | undefined;
  /** Called after the task is deleted so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function RemoveTaskDialog({ taskToRemove, onSuccess }: RemoveTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  async function removeTask(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    setIsLoading(true);
    const result = await deleteTask(taskToRemove?.id);
    setIsLoading(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    onSuccess();
  }

  return (
    <AlertDialogContent id="remove-task-dialog" className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full text-destructive">
          Delete <span className="font-bold">{taskToRemove?.name}</span>?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-destructive">
          You are about to delete {taskToRemove?.name}. This cannot be undone. Do you wish to continue?
        </AlertDialogDescription>
        {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
        <AlertDialogCancel variant={'secondary'} className="hover:bg-gold/90">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className={isLoading ? 'bg-destructive/30!' : 'bg-destructive! text-white hover:bg-destructive/90!'}
          onClick={removeTask}
        >
          {isLoading ? <Spinner /> : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
