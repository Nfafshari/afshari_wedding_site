"use client";

import { Circle, CircleCheck, Trash2 } from "lucide-react";

import { CategoryWithTasks } from "@/app/(protected)/planner/checklist/page";
import { Button } from "./ui/button";
import { toggleTaskStatus } from "@/app/(protected)/planner/checklist/action";
import { notifyError, notifySuccess } from "@/lib/toast";
import { formatDate } from "@/lib/utils";

type TaskItem = CategoryWithTasks["tasks"][number];

interface TaskProps {
  task: TaskItem | undefined;
  onDelete(): void;
}

export default function Task ({ task, onDelete }: TaskProps) {
  async function toggleTaskDone (status: boolean) {
    const result = await toggleTaskStatus(task?.id, status);
    if (!result.ok) {
      notifyError(result.error);
      return;
    }
    notifySuccess("Task updated");
  }

  return(
    <div className={`flex py-2 w-full border-b border-b-burg/50 items-center ${task?.status ? 'text-burg/70' : 'text-burg'}`}>
      <button
        type="button"
        aria-label={`Mark ${task?.name} done`}
        aria-pressed={Boolean(task?.status)}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => {
          toggleTaskDone(!task?.status);
        }}
      >
        {task?.status ? <CircleCheck className="mx-3 cursor-pointer w-5 h-5"/> : <Circle className="mx-3 cursor-pointer w-5 h-5"/>}
      </button>
      <p className={`${task?.status ? 'line-through' : ''}`}>{task?.name}</p>
      <p className={`text-burg/70 ml-auto ${task?.status ? 'line-through' : ''}`}>{task && formatDate(task.goalDate)}</p>
      <Button
        variant={'ghost-destructive'}
        size={'icon-sm'}
        aria-label={`Delete ${task?.name}`}
        className="ml-1"
        onClick={() => {
          onDelete()
        }}
      >
        <Trash2 />
      </Button>
    </div>
  );
}