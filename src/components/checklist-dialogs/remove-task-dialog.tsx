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

import { deleteTask } from "@/app/(protected)/dashboard/checklist/action";
import type { CategoryWithTasks } from "@/app/(protected)/dashboard/checklist/page";

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
    <AlertDialogContent id="remove-task-dialog" className="bg-white rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-(--burg) w-full text-red-600">
          Delete <span className="font-bold">{taskToRemove?.name}</span>?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-red-600">
          You are about to delete {taskToRemove?.name}. This cannot be undone. Do you wish to continue?
        </AlertDialogDescription>
        {serverError && <p className="text-red-600/50 text-xs">{serverError}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-gray-50 rounded-sm rounded-t-none">
        <AlertDialogCancel className="bg-gray-50 border-yellow-600/50 text-(--gold) hover:bg-yellow-600/50 hover:text-black">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className={isLoading ? 'bg-red-950/30' : 'bg-red-950/95 text-white hover:bg-red-900'}
          onClick={removeTask}
        >
          {isLoading ? <Spinner /> : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
