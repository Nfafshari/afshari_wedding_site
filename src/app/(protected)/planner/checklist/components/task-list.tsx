"use client";

import { Circle, CircleCheck, type LucideIcon } from "lucide-react";
import * as Lucide from "lucide-react";

import { GroupedList, ListAddRow, ListCell, ListEmpty, ListGroup, ListHeadCell, ListHeader, ListRow } from "@/components/grouped-list";
import RowActionButton from "@/components/row-action-button";
import StatusChip from "@/components/status-chip";
import { isOverdue, matchesTaskFilter, type TaskFilter } from "@/lib/checklist";
import { notifyError, notifySuccess } from "@/lib/toast";
import { OVERDUE_STATUS } from "@/lib/status";
import { cn, formatDate } from "@/lib/utils";

import { toggleTaskStatus } from "../action";
import type { CategoryWithTasks } from "../page";

type TaskItem = CategoryWithTasks["tasks"][number];

/** Shown when a category has no tasks under the current filter. */
const EMPTY_MESSAGE: Record<TaskFilter, string> = {
  all: "No tasks yet.",
  todo: "Nothing to do here.",
  done: "Nothing done here yet.",
};

interface TaskListProps {
  categories: CategoryWithTasks[];
  filter: TaskFilter;
  onEditCategory: (categoryId: number) => void;
  onDeleteCategory: (categoryId: number) => void;
  onAddTask: (categoryId: number) => void;
  onDeleteTask: (taskId: number) => void;
}

/** Categories in their saved order, each open with its tasks by due date. */
export default function TaskList ({ categories, filter, onEditCategory, onDeleteCategory, onAddTask, onDeleteTask }: TaskListProps) {
  return (
    <GroupedList label="Checklist by category" columns="minmax(0,1fr) 9rem 7rem">
      <ListHeader>
        <ListHeadCell>Task</ListHeadCell>
        <ListHeadCell>Due</ListHeadCell>
        <ListHeadCell>Status</ListHeadCell>
      </ListHeader>

      {categories.map((category) => {
        const CategoryIcon = (Lucide[category.icon as keyof typeof Lucide] ?? Lucide.Astroid) as LucideIcon;
        const done = category.tasks.filter((task) => task.status).length;
        const shown = category.tasks.filter((task) => matchesTaskFilter(task, filter));

        return (
          <ListGroup
            key={category.id}
            defaultOpen
            title={
              <span className="flex items-center gap-2">
                <CategoryIcon className="size-5 shrink-0 text-gold-ink" aria-hidden />
                <span className="min-w-0 break-words">{category.name}</span>
              </span>
            }
            // Always a cell, even when empty, so the count lands in the status column from md.
            meta={<ListCell />}
            end={<ListCell className="text-sm font-normal text-burgundy-600">{done} of {category.tasks.length} done</ListCell>}
            actions={
              <>
                <RowActionButton action="edit" aria-label={`Edit ${category.name}`} onClick={() => onEditCategory(category.id)} />
                <RowActionButton action="delete" aria-label={`Delete ${category.name}`} onClick={() => onDeleteCategory(category.id)} />
              </>
            }
          >
            {shown.map((task) => (
              <ListRow
                key={task.id}
                lead={<TaskTick task={task} />}
                name={<span className={cn(task.status && "text-burgundy-600 line-through")}>{task.name}</span>}
                meta={<ListCell className={cn(task.status && "line-through")}>{formatDate(task.goalDate)}</ListCell>}
                end={<ListCell>{isOverdue(task) && <StatusChip status={OVERDUE_STATUS} />}</ListCell>}
                actions={<RowActionButton action="delete" aria-label={`Delete ${task.name}`} onClick={() => onDeleteTask(task.id)} />}
              />
            ))}
            {shown.length === 0 && <ListEmpty>{EMPTY_MESSAGE[filter]}</ListEmpty>}
            <ListAddRow onClick={() => onAddTask(category.id)}>Add task</ListAddRow>
          </ListGroup>
        );
      })}
    </GroupedList>
  );
}

/** The round tick box. Saves straight away, with a toast either way. */
function TaskTick ({ task }: { task: TaskItem }) {
  async function toggle () {
    const result = await toggleTaskStatus(task.id, !task.status);
    if (!result.ok) {
      notifyError(result.error);
      return;
    }
    notifySuccess(task.status ? "Task marked to do" : "Task done");
  }

  return (
    <button
      type="button"
      aria-label={`Mark ${task.name} done`}
      aria-pressed={task.status}
      className="flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={toggle}
    >
      {task.status
        ? <CircleCheck className="size-5 text-olivine-ink" aria-hidden />
        : <Circle className="size-5" aria-hidden />}
    </button>
  );
}
