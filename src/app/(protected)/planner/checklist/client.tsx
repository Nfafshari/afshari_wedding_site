"use client";

import { useState } from "react";
import { CirclePlus, ListChecks, LucideIcon } from "lucide-react";
import * as Lucide from "lucide-react"

import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button"
import FilterButton from "@/components/filter-button";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import PlannerPage from "@/components/planner-page";
import { Dialog } from "@/components/ui/dialog"
import AddCategoryDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/add-category-dialog";
import AddTaskDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/add-task-dialog";
import EditCategoryDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/edit-category-dialog";
import RemoveCategoryDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/remove-category-dialog";
import RemoveTaskDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/remove-task-dialog";

import { getDaysRemaining } from "@/lib/utils";
import { CategoryWithTasks } from "./page";
import RowActionButton from "@/components/row-action-button";
import Task from "@/components/task";
import { useQueryParams } from "@/hooks/use-query-params";

interface ChecklistProps {
  categories: CategoryWithTasks[]
}

enum DialogType {
  None =     'none',
  Category = 'category',
  Task =     'task',
  Edit =     'edit',
  Delete =   'delete',
  DeleteCategory = 'deleteCategory'
}

export default function Checklist({ categories }: ChecklistProps) {
  /** States */
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.None);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  
  const { searchParams, setParams } = useQueryParams();
  // A filter can outlive its category (renamed or deleted), which would leave the page blank; fall back to All.
  const requestedTab = searchParams.get('category');
  const activeTab = categories.some((category) => category.name === requestedTab) ? requestedTab! : 'All';

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
    <Dialog
      // Form dialogs share this root. Delete confirmations bring their own (ConfirmDialog).
      open={activeDialog !== DialogType.None && activeDialog !== DialogType.Delete && activeDialog !== DialogType.DeleteCategory}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          closeDialog();
        }
      }}
    >
      <PlannerPage>
        <PageHeader
          title="Checklist"
          subtitle={`${totalTasksDone} of ${totalTasks} done`}
          actions={
            <Button onClick={() => setActiveDialog(DialogType.Category)}>
              <CirclePlus />
              Add category
            </Button>
          }
        />

        {categories.length === 0 ? (
          <EmptyState
            size="page"
            icon={ListChecks}
            title="Nothing on the checklist yet"
            message="Add a category, like Venue or Attire, then the tasks inside it."
          >
            <Button onClick={() => setActiveDialog(DialogType.Category)}>
              <CirclePlus />
              Add category
            </Button>
          </EmptyState>
        ) : (
          <>
            <div className="w-full">
              <Field className="w-full">
                <FieldLabel htmlFor="task-progress" className="text-burg/70 font-bold">
                  <span className="ml-auto uppercase tracking-widest">{progress}% | {daysToWedding} Days Remaining</span>
                </FieldLabel>
                <Progress
                  id="task-progress"
                  value={Number(progress)}
                />
              </Field>
            </div>

            {/** Filter buttons */}
            <div className="flex flex-col w-full h-auto mt-2 py-2">
              <div className="flex flex-wrap w-full justify-center px-5 py-2 gap-2 md:px-10">
                {categories.map((category, idx) => (
                  <FilterButton
                    isActive={category.name === activeTab}
                    key={`${category.name}-${idx}`}
                    onClick={() => {
                      setParams((params) => params.set('category', category.name))
                    }}
                  >
                    {category.name}
                  </FilterButton>
                ))}
                <FilterButton
                  isActive={activeTab === 'All'}
                  key={'all'}
                  onClick={() => {
                    setParams((params) => params.delete('category'))
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
                      <div className="p-2 flex items-center gap-2 border-b border-b-burg/50">
                        <CategoryIcon className="shrink-0" />
                        <h2 className="page-title min-w-0 truncate text-2xl">{category.name}</h2>
                        <p className="ml-auto page-subtitle">{numOfTasksDone}/{category.tasks.length}</p>
                        <div className="flex shrink-0">
                          <RowActionButton
                            action="edit"
                            aria-label={`Edit ${category.name}`}
                            onClick={() => {
                              setActiveDialog(DialogType.Edit);
                              setActiveCategoryId(category.id);
                            }}
                          />
                          <RowActionButton
                            action="delete"
                            aria-label={`Delete ${category.name}`}
                            onClick={() => {
                              setActiveDialog(DialogType.DeleteCategory);
                              setActiveCategoryId(category.id);
                            }}
                          />
                        </div>
                      </div>

                      {/** Tasks */}
                      <div className="p-2 flex-col">
                        {category.tasks.map((task) => (
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
                          onClick={() => {
                            setActiveDialog(DialogType.Task);
                            setActiveCategoryId(category.id);
                          }}
                        >
                          Add task
                          <CirclePlus/>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </PlannerPage>

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

      {activeDialog === DialogType.DeleteCategory && (
        <RemoveCategoryDialog
          categoryToRemove={categories.find((category) => category.id === activeCategoryId)}
          onSuccess={closeDialog}
          onCancel={closeDialog}
        />
      )}

      {activeDialog === DialogType.Delete && (
        <RemoveTaskDialog
          taskToRemove={categories.flatMap((category) => category.tasks).find((task) => task.id === activeTaskId)}
          onSuccess={closeDialog}
          onCancel={closeDialog}
        />
      )}
    </Dialog>
  );
}
