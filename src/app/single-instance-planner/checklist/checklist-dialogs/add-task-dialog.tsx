"use client";

import { useState } from "react";
import { format } from "date-fns";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { type ErrorField } from "../action";
import { useDemoPlanner } from "../../demo-store";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

interface AddTaskDialogProps {
  /** The category the new task belongs to. */
  categoryId: number | null;
  /** Called after a task is created so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function AddTaskDialog({ categoryId, onSuccess }: AddTaskDialogProps) {
  const { createTask } = useDemoPlanner();
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEmptyInput, setIsEmptyInput] = useState(false);

  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function addTask() {
    // Client-side check for instant feedback (the server re-checks this too).
    if (taskName.trim() === '') {
      setIsEmptyInput(true);
      return;
    }

    await runAction('Task added successfully', () => createTask(taskName, taskDate, categoryId))
  }

  return (
    <FormDialog
      id="add-task-dialog"
      title="Add New Task?"
      isLoading={isLoading}
      onSubmit={addTask}
    >
      <Field className="flex w-full text-burg">
        <FieldLabel htmlFor="task-name">Task Name</FieldLabel>
        <Input
          id="task-name"
          type="text"
          placeholder="Task"
          className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(isEmptyInput || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setTaskName(e.target.value);
            if (e.target.value !== '') {
              setIsEmptyInput(false);
            }
            clearServerError();
          }}
        />
        {isEmptyInput && <p className="text-destructive/80 text-xs">Task name cannot be empty</p>}
        {/* name-specific or general (no field) errors show here */}
        {(serverError && (serverErrorField === 'name' || serverErrorField === null)) && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>
      <div className="flex flex-col w-full items-start overflow-y overflow-y-scroll mt-2 text-burg">
        <Field>
          <FieldLabel htmlFor="date-picker-simple">Date</FieldLabel>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date-picker-simple"
                className={`justify-start font-normal bg-popover rounded-sm ${serverErrorField === 'date' ? 'border-destructive' : 'border-input'}`}
              >
                {taskDate ? format(taskDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={taskDate}
                onSelect={(date) => {
                  setTaskDate(date);
                  setIsCalendarOpen(false);
                }}
                defaultMonth={taskDate}
              />
            </PopoverContent>
          </Popover>
        </Field>
        {/* date- or category-specific errors show here */}
        {(serverError && (serverErrorField === 'date' || serverErrorField === 'category')) && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </div>
    </FormDialog>
  );
}
