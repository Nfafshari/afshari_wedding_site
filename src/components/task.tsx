"use client";

import { Circle, CircleCheck, Trash2 } from "lucide-react";

import { CategoryWithTasks } from "@/app/(protected)/dashboard/checklist/page";
import { Button } from "./ui/button";
import { toggleTaskStatus } from "@/app/(protected)/dashboard/checklist/action";

type TaskItem = CategoryWithTasks["tasks"][number];

interface TaskProps {
  task: TaskItem | undefined;
  onDelete(): void;
}

export default function Task ({ task, onDelete }: TaskProps) {
  const dateOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  } as const;

  function toggleTaskDone (status: boolean) {
    toggleTaskStatus(task?.id, status)
  }

  return(
    <div className={`flex py-2 w-full border-b border-b-(--burg)/50 items-center ${task?.status ? 'text-(--burg)/40' : 'text-(--burg)/70'}`}>
      <button
        onClick={() => {
          toggleTaskDone(!task?.status);
        }}
      >
        {task?.status ? <CircleCheck className="mx-3 cursor-pointer w-5 h-5"/> : <Circle className="mx-3 cursor-pointer w-5 h-5"/>}
      </button>
      <p className={`${task?.status ? 'line-through' : ''}`}>{task?.name}</p>
      <p className={`text-(--burg)/30 ml-auto ${task?.status ? 'line-through' : ''}`}>{task?.goalDate.toLocaleDateString('en-US', dateOptions)}</p>
      <Button
        variant={'ghost'}
        className="text-(--gold)/40  ml-1 p-1 hover:bg-red-500 hover:text-background"
        onClick={() => {
          onDelete()
        }}
      >
        <Trash2 />
      </Button>
    </div>
  );
}