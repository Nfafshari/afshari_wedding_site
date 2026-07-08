"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CirclePlus, LucideIcon, SquarePen } from "lucide-react";
import * as Lucide from "lucide-react"

import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button"
import FilterButton from "@/components/filter-button";
import { AlertDialog } from "@/components/ui/alert-dialog"
import AddCategoryDialog from "@/app/(protected)/dashboard/checklist/checklist-dialogs/add-category-dialog";
import AddTaskDialog from "@/app/(protected)/dashboard/checklist/checklist-dialogs/add-task-dialog";
import EditCategoryDialog from "@/app/(protected)/dashboard/checklist/checklist-dialogs/edit-category-dialog";
import RemoveTaskDialog from "@/app/(protected)/dashboard/checklist/checklist-dialogs/remove-task-dialog";

import { getDaysRemaining } from "@/lib/utils";
import { CategoryWithTasks } from "./page";
import Task from "@/components/task";

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
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.None);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // tab filtering using url parameters
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('category') ?? 'All';
  const pathname = usePathname();
  const router = useRouter();

  // Build a URL for the current path with the query string mutated by `update`.
  // Starts from the current params so any other query values are preserved.
  function buildHref (update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams);
    update(params);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const WEDDING_DATE = '2027-09-11';
  const daysToWedding = getDaysRemaining(WEDDING_DATE);

  // filter array or set to all
  const filteredCategories = activeTab === 'All' ? categories : categories.filter((category) => category.name === activeTab);

  // get total number of tasks across all categories
  let totalTasks = 0;
  for (let i = 0; i < categories.length; i++) {
    totalTasks += categories[i].tasks.length;
  }

  // get total number of tasks done across all categories
  let totalTasksDone = 0;
  for (let i = 0; i < categories.length; i++) {
    for(let j = 0; j < categories[i].tasks.length; j++) {
      if (categories[i].tasks[j].status) {
        totalTasksDone += 1;
      }
    }
  }

  const progress = totalTasks === 0 ? 0 : ((totalTasksDone / totalTasks) * 100).toFixed(1);

  // Close any open dialog. Each dialog owns its own form state, so unmounting it resets that state.
  function closeDialog () {
    setActiveDialog(DialogType.None);
    setActiveCategoryId(null);
    setActiveTaskId(null);
  }

  function onTaskDelete (taskId: number) {
    setActiveDialog(DialogType.Delete);
    setActiveTaskId(taskId);
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
            <h2 className="page-subtitle ml-auto">{totalTasksDone} of {totalTasks} done</h2>
          </div>
          <Field className="w-full">
            <FieldLabel htmlFor="task-progress" className="text-burg/70 font-bold">
              <span className="ml-auto uppercase tracking-widest">{progress}% | {daysToWedding} Days Remaining</span>
            </FieldLabel>
            <Progress
              id="task-progress"
              value={Number(progress)}
            />
          </Field>
          <hr className="flex w-full border border-gold mt-3" />
        </div>

        {/** Filter buttons */}
        <div className="flex flex-col w-full h-auto mt-2 py-2">
          <div className="flex flex-wrap w-full justify-center px-5 py-2 gap-2 md:px-10">
            {categories.map((category, idx) => (
              <FilterButton
                isActive={category.name === activeTab}
                key={`${category.name}-${idx}`}
                onClick={() => {
                  router.replace(buildHref((params) => params.set('category', category.name)));
                }}
              >
                {category.name}
              </FilterButton>
            ))}
            <FilterButton
              isActive={activeTab === 'All'}
              key={'all'}
              onClick={() => {
                router.replace(buildHref((params) => params.delete('category')));
              }}
            >
              All
            </FilterButton>
          </div>

          {/** Category Cards */}
          <div className="grid gap-3 w-full h-full pt-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category, idx) => {
              const CategoryIcon = (Lucide[category.icon as keyof typeof Lucide] ?? Lucide.Astroid) as LucideIcon;
              
              // calculate the number of tasks that are done in this category
              let numOfTasksDone = 0;
              for (let i = 0; i < category.tasks.length; i++) {
                if (category.tasks[i].status) {
                  numOfTasksDone += 1;
                }
              }

              return (
                <div
                  key={`${category.name}-${idx}`}
                  className="flex flex-col mx-5 p-2 rounded-sm border border-olivine/20 "
                >
                  <div className="p-2 flex items-center border-b border-b-burg/50">
                    <CategoryIcon className="mr-2" />
                    <h2 className="page-title text-2xl">{category.name}</h2>
                    <h3 className="ml-auto page-subtitle">{numOfTasksDone}/{category.tasks.length}</h3>
                  </div>

                  {/** Tasks */}
                  <div className="p-2 flex-col">
                    {category.tasks.map((task, idx) => (
                      <Task
                        key={task.id}
                        task={task}
                        onDelete={() => {
                          onTaskDelete(task.id)
                        }}
                      />
                    ))}
                  </div>
                  <div className="ml-1 px-1 flex items-center">
                    <Button
                      variant={'ghost'}
                      className="text-burg/40 hover:bg-burg hover:text-background"
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
                    className=" ml-auto mt-auto text-gold/40 hover:bg-olivine hover:text-background"
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
              className="flex justify-center items-center mx-5 border border-olivine/20 rounded-sm p-2 bg-olivine/5 cursor-pointer text-burg/50 hover:text-burg hover:shadow-sm"
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
          categoryToUpdate={categories.find((category) => category.id === activeCategoryId)}
          onSuccess={closeDialog}
        />
      )}

      {activeDialog === DialogType.Delete && (
        <RemoveTaskDialog
          taskToRemove={categories.flatMap((category) => category.tasks).find((task) => task.id === activeTaskId)}
          onSuccess={closeDialog}
        />
      )}
    </AlertDialog>
  );
}
