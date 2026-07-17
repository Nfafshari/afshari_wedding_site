"use client";

/**
 * Demo fork of `src/components/task.tsx`. Identical rendering and identical
 * toggle behaviour; the only difference is where the toggle comes from — the real
 * component imports the server action directly, this one pulls it off the demo
 * store. Fixes to the real component do not reach this one — keep the two in step
 * by hand.
 */

import { Circle, CircleCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { notifyError, notifySuccess } from "@/lib/toast";
import { useDemoPlanner } from '../demo-store';
import type { CategoryWithTasks } from "../demo-types";

type TaskItem = CategoryWithTasks["tasks"][number];

interface TaskProps {
  task: TaskItem | undefined;
  onDelete(): void;
}

export default function Task ({ task, onDelete }: TaskProps) {
  const { toggleTaskStatus } = useDemoPlanner();

  const dateOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  } as const;

  async function toggleTaskDone (status: boolean) {
    const result = await toggleTaskStatus(task?.id, status);
    if (!result.ok) {
      notifyError(result.error);
      return;
    }
    notifySuccess("Task updated");
  }

  return(
    <div className={`flex py-2 w-full border-b border-b-burg/50 items-center ${task?.status ? 'text-burg/40' : 'text-burg/70'}`}>
      <button
        onClick={() => {
          toggleTaskDone(!task?.status);
        }}
      >
        {task?.status ? <CircleCheck className="mx-3 cursor-pointer w-5 h-5"/> : <Circle className="mx-3 cursor-pointer w-5 h-5"/>}
      </button>
      <p className={`${task?.status ? 'line-through' : ''}`}>{task?.name}</p>
      <p className={`text-burg/30 ml-auto ${task?.status ? 'line-through' : ''}`}>{task?.goalDate.toLocaleDateString('en-US', dateOptions)}</p>
      <Button
        variant={'ghost'}
        className="text-gold/40  ml-1 p-1 hover:bg-destructive hover:text-background"
        onClick={() => {
          onDelete()
        }}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
