"use client";

import { useState } from "react";
import { Circle, CirclePlus, LucideIcon, SquarePen, Trash2 } from "lucide-react";
import * as Lucide from "lucide-react"

import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button"
import FilterButton from "@/components/filter-button";
import { AlertDialog } from "@/components/ui/alert-dialog"
import AddCategoryDialog from "@/components/checklist-dialogs/add-category-dialog";
import AddTaskDialog from "@/components/checklist-dialogs/add-task-dialog";

import { getDaysRemaining } from "@/lib/utils";
import { CategoryWithTasks } from "./page";
import EditCategoryDialog from "@/components/checklist-dialogs/edit-category-dialog";
import RemoveTaskDialog from "@/components/checklist-dialogs/remove-task-dialog";

interface ChecklistProps {
  categories: CategoryWithTasks[]
}

enum DialogType {
  None =     'none',
  Category = 'category',
  Task =     'task',
  Edit =     'edit',
  Delete =   'delete'
}

export default function Checklist({
  categories
}: ChecklistProps) {
  /** States */
  const [activeTab, setActiveTab] = useState('All');
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.None);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const WEDDING_DATE = '2027-09-11';
  const daysToWedding = getDaysRemaining(WEDDING_DATE);
  const dateOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  } as const;

  // filter array or set to all
  const filteredCategories = activeTab === 'All' ? categories : categories.filter((cat) => cat.name === activeTab);

  // Close any open dialog. Each dialog owns its own form state, so unmounting it resets that state.
  function closeDialog () {
    setActiveDialog(DialogType.None);
    setActiveCategoryId(null);
    setActiveTaskId(null);
  }

  return (
    <AlertDialog
      open={activeDialog !== DialogType.None}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          closeDialog();
        }
      }}
    >
      <div className="flex flex-col w-full p-5 min-h-full">
        {/** Header */}
        <div className="w-full">
          <div className="flex w-full">
            <h1 className="page-title font-bold text-start">Checklist</h1>
            <h2 className="page-subtitle ml-auto">5 of 10 done</h2>
          </div>
          <Field className="w-full">
            <FieldLabel htmlFor="task-progress" className="text-(--burg)/70 font-bold">
              <span className="ml-auto">50% | {daysToWedding} Days Remaining</span>
            </FieldLabel>
            <Progress
              id="task-progress"
              value={50}
            />
          </Field>
          <hr className="flex w-full border border-(--gold) mt-3" />
        </div>

        {/** Filter buttons */}
        <div className="flex flex-col w-full h-auto mt-2 py-2">
          <div className="flex flex-wrap w-full justify-center px-5 py-2 gap-2 md:px-10">
            {categories.map((category, idx) => (
              <FilterButton
                isActive={category.name === activeTab}
                key={`${category.name}-${idx}`}
                onClick={() => {
                  setActiveTab(category.name)
                }}
              >
                {category.name}
              </FilterButton>
            ))}
            <FilterButton
              isActive={activeTab === 'All'}
              key={'all'}
              onClick={() => {
                setActiveTab('All')
              }}
            >
              All
            </FilterButton>
          </div>

          {/** Category Cards */}
          <div className="grid gap-3 w-full h-full pt-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category, idx) => {
              const CategoryIcon = (Lucide[category.icon as keyof typeof Lucide] ?? Lucide.Astroid) as LucideIcon;

              return (
                <div
                  key={`${category.name}-${idx}`}
                  className="flex flex-col mx-5 p-2 rounded-sm border border-(--olivine)/20 "
                >
                  <div className="p-2 flex items-center border-b border-b-(--burg)/50">
                    <CategoryIcon className="mr-2" />
                    <h2 className="page-title text-2xl">{category.name}</h2>
                    <h3 className="ml-auto page-subtitle">5/10</h3>
                  </div>

                  {/** Tasks */}
                  <div className="p-2 flex-col">
                    {category.tasks.map((task, idx) => (
                      <div
                        className="flex py-2 w-full border-b border-b-(--burg)/50 text-(--burg)/70 items-center"
                        key={`${task.name}-${idx}`}
                      >
                        <button>
                          <Circle className="mx-3 cursor-pointer w-5 h-5"/>
                        </button>
                        <p>{task.name}</p>
                        <p className="text-(--burg)/30 ml-auto">{task.goalDate.toLocaleDateString('en-US', dateOptions)}</p>
                        <Button
                          variant={'ghost'}
                          className="text-(--gold)/40  ml-1 p-1 hover:bg-red-500 hover:text-background"
                          onClick={() => {
                            setActiveDialog(DialogType.Delete);
                            setActiveTaskId(task.id);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="ml-1 px-1 flex items-center">
                    <Button
                      variant={'ghost'}
                      className="text-(--burg)/40 hover:bg-(--burg) hover:text-background"
                      onClick={() => {
                        setActiveDialog(DialogType.Task);
                        setActiveCategoryId(category.id);
                      }}
                    >
                      Add Task
                      <CirclePlus/>
                    </Button>
                  </div>
                  <Button
                    variant={'ghost'}
                    className=" ml-auto mt-auto text-(--gold)/40 hover:bg-(--olivine) hover:text-background"
                    onClick={() => {
                      setActiveDialog(DialogType.Edit);
                      setActiveCategoryId(category.id);
                    }}
                  >
                    <SquarePen />
                  </Button>
                </div>
              )
            })}
            <button
              className="flex justify-center items-center mx-5 border border-(--olivine)/20 rounded-sm p-2 bg-(--olivine)/5 cursor-pointer text-(--burg)/50 hover:text-(--burg) hover:shadow-sm"
              onClick={() => {
                setActiveDialog(DialogType.Category)
              }}
            >
              <div className="p-2 flex flex-col items-center justify-center text-center hover:cursor-pointer">
                <CirclePlus className="w-10 h-10" />
                <h2 className="page-subtitle text-inherit">Add Category</h2>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Each dialog owns its own form state; rendering it conditionally mounts/unmounts (and resets) it. */}
      {activeDialog === DialogType.Category && (
        <AddCategoryDialog
          categories={categories}
          onSuccess={closeDialog}
        />
      )}

      {activeDialog === DialogType.Task && (
        <AddTaskDialog
          categoryId={activeCategoryId}
          onSuccess={closeDialog}
        />
      )}

      {activeDialog === DialogType.Edit && (
        <EditCategoryDialog 
          categories={categories}
          categoryToUpdate={categories.find((cat) => cat.id === activeCategoryId)}
          onSuccess={closeDialog}
        />
      )}

      {activeDialog === DialogType.Delete && (
        <RemoveTaskDialog
          taskToRemove={categories.flatMap((cat) => cat.tasks).find((task) => task.id === activeTaskId)}
          onSuccess={closeDialog}
        />
      )}
    </AlertDialog>
  );
}
