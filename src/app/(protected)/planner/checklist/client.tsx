"use client";

import { useState } from "react";
import { CirclePlus, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button"
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import PlannerPage from "@/components/planner-page";
import { Dialog } from "@/components/ui/dialog"
import AddCategoryDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/add-category-dialog";
import AddTaskDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/add-task-dialog";
import EditCategoryDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/edit-category-dialog";
import RemoveCategoryDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/remove-category-dialog";
import RemoveTaskDialog from "@/app/(protected)/planner/checklist/checklist-dialogs/remove-task-dialog";

import SegmentedFilter from "@/components/segmented-filter";
import { Stat, StatRow } from "@/components/stat";
import { useQueryParams } from "@/hooks/use-query-params";
import { DUE_SOON_DAYS, getChecklistStats, isTaskFilter, matchesTaskFilter } from "@/lib/checklist";
import { getDaysRemaining } from "@/lib/utils";
import { CategoryWithTasks } from "./page";
import TaskList from "./components/task-list";

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

  
  // The query string is untrusted, so an unknown filter falls back to all.
  const { searchParams } = useQueryParams();
  const rawFilter = searchParams.get('show');
  const filter = isTaskFilter(rawFilter) ? rawFilter : 'all';

  const WEDDING_DATE = '2027-09-11';
  const daysToWedding = getDaysRemaining(WEDDING_DATE);

  const stats = getChecklistStats(categories);
  const tasks = categories.flatMap((category) => category.tasks);
  const countFor = (show: 'todo' | 'done') => tasks.filter((task) => matchesTaskFilter(task, show)).length;

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
          subtitle={`${daysToWedding} days to go`}
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
            <StatRow className="grid-cols-3">
              <Stat value={`${stats.done} of ${stats.total}`} caption="Tasks done" />
              <Stat value={stats.overdue} caption="Overdue" tone={stats.overdue > 0 ? 'danger' : 'default'} />
              <Stat value={stats.dueSoon} caption={`Due in ${DUE_SOON_DAYS} days`} tone={stats.dueSoon > 0 ? 'attention' : 'default'} />
            </StatRow>
            <hr className="my-5 bg-accent" />

            <SegmentedFilter
              label="Show tasks"
              param="show"
              defaultValue="all"
              className="mb-4"
              options={[
                { value: 'all', label: 'All', count: tasks.length },
                { value: 'todo', label: 'To do', count: countFor('todo') },
                { value: 'done', label: 'Done', count: countFor('done') },
              ]}
            />

            <TaskList
              categories={categories}
              filter={filter}
              onEditCategory={(categoryId) => {
                setActiveCategoryId(categoryId);
                setActiveDialog(DialogType.Edit);
              }}
              onDeleteCategory={(categoryId) => {
                setActiveCategoryId(categoryId);
                setActiveDialog(DialogType.DeleteCategory);
              }}
              onAddTask={(categoryId) => {
                setActiveCategoryId(categoryId);
                setActiveDialog(DialogType.Task);
              }}
              onDeleteTask={onTaskDelete}
            />
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
