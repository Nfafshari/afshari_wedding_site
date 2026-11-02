"use client";

import { useState } from "react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { formatDate } from "@/lib/utils";
import { checkDate, checkRequired } from "@/lib/validate";

import { createTask, updateTask, type ErrorField } from "../action";
import type { CategoryWithTasks } from "../page";

type TaskItem = CategoryWithTasks["tasks"][number];

interface TaskDialogProps {
  categories: CategoryWithTasks[];
  /** The task to edit. Leave out to add a new one. */
  task?: TaskItem;
  /** The category a new task starts in. */
  defaultCategoryId?: number | null;
  /** Called after a save so the parent can close the dialog. */
  onSuccess: () => void;
}

/** Adds a task (empty form, Add) or edits one (filled form, Save changes), including moving it to another category. */
export default function TaskDialog({ categories, task, defaultCategoryId, onSuccess }: TaskDialogProps) {
  const [name, setName] = useState(task?.name ?? '');
  const [goalDate, setGoalDate] = useState<Date | undefined>(task?.goalDate);
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? defaultCategoryId ?? categories[0]?.id);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { errors: fieldErrors, check, clear, checkAll } = useFieldErrors<ErrorField>();
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  // The messages come from lib/validate.ts, so they match what the server would say.
  const checks = {
    name: () => checkRequired(name, 'Task name'),
    date: (value = goalDate) => checkDate(value),
  };

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function save () {
    if (!checkAll({ name: checks.name(), date: checks.date() })) return;
    if (categoryId === undefined) return;

    if (task === undefined) {
      await runAction("Task added", () => createTask(name, goalDate, categoryId));
      return;
    }

    await runAction("Task saved", () => updateTask(task.id, { name, goalDate, categoryId }));
  }

  return (
    <FormDialog
      id="task-dialog"
      title={task ? `Edit ${task.name}` : "Add Task"}
      submitLabel={task ? "Save changes" : "Add"}
      isLoading={isLoading}
      error={serverError && serverErrorField === null ? serverError : undefined}
      onSubmit={save}
    >
      <Field className="flex w-full text-burg">
        <FieldLabel htmlFor="task-name">Task Name</FieldLabel>
        <Input
          id="task-name"
          type="text"
          placeholder="Book the florist"
          value={name}
          aria-invalid={Boolean(fieldErrors.name || serverErrorField === 'name')}
          onChange={(e) => {
            setName(e.target.value);
            clear('name');
            clearServerError();
          }}
          onBlur={() => check('name', checks.name())}
        />
        {fieldErrors.name && <p className="text-destructive text-xs">{fieldErrors.name}</p>}
        {(serverError && serverErrorField === 'name') && <p className="text-destructive text-xs">{serverError}</p>}
      </Field>

      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        <Field className="flex w-full text-burg">
          <FieldLabel htmlFor="task-date">Due</FieldLabel>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                id="task-date"
                aria-invalid={Boolean(fieldErrors.date || serverErrorField === 'date')}
                className="justify-start font-normal rounded-sm"
              >
                {goalDate ? formatDate(goalDate) : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={goalDate}
                onSelect={(date) => {
                  setGoalDate(date);
                  check('date', checks.date(date));
                  clearServerError();
                  setIsCalendarOpen(false);
                }}
                defaultMonth={goalDate}
              />
            </PopoverContent>
          </Popover>
          {fieldErrors.date && <p className="text-destructive text-xs">{fieldErrors.date}</p>}
          {(serverError && serverErrorField === 'date') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>

        <Field className="flex w-full text-burg">
          <FieldLabel htmlFor="task-category">Category</FieldLabel>
          <Select
            value={categoryId === undefined ? undefined : String(categoryId)}
            onValueChange={(value) => {
              setCategoryId(Number(value));
              clearServerError();
            }}
          >
            <SelectTrigger id="task-category" className="w-full" aria-invalid={serverErrorField === 'category'}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {(serverError && serverErrorField === 'category') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>
      </div>
    </FormDialog>
  );
}
