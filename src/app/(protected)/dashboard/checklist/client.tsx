"use client";

import { useState } from "react";
import { Circle, CirclePlus, LucideIcon } from "lucide-react";
import * as Lucide from "lucide-react"

import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button"
import FilterButton from "@/components/filter-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { getDaysRemaining } from "@/lib/utils";
import { CategoryWithTasks } from "./page";
import { addNewCategory } from "./action";

interface ChecklistProps {
  categories: CategoryWithTasks[]
}

export default function Checklist({
  categories 
}: ChecklistProps) {
  /** States */
  const [activeTab, setActiveTab] = useState('All');
  const [activeIcon, setActiveIcon] = useState('Astroid');
  const [categoryName, setCategoryName] = useState('');
  const [isEmptyCategoryName, setIsEmptyCategoryName] = useState(false);
  const [isUniqueCategory, setIsUniqueCategory] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [serverError, setServerError] = useState('');

  const daysToWedding = getDaysRemaining('2027-09-11');
  const dateOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  } as const;

  const icons: LucideIcon[] = [Lucide.HandCoins, Lucide.CalendarDays, Lucide.Gift, Lucide.Car, Lucide.Store, Lucide.Timer, Lucide.Utensils, Lucide.Cake, Lucide.Astroid, ]

  // filter array or set to all
  const filteredCategories = activeTab === 'All' ? categories : categories.filter((cat) => cat.name === activeTab);

  /**
   * Validates input, then calls the server action to create a category.
   * Keeps the dialog open on any error; closes it only on success.
   * @param event - Add button click event
   * @param name - Name of new category
   * @param icon - Name of new category icon (Lucide Icons)
   */
  async function addCategory (event: React.MouseEvent, name: string, icon: string) {
    // Always stop the dialog's built-in auto-close. We decide when to close it
    // ourselves (only on success) — the server's answer arrives *after* this
    // click handler finishes, which is too late to call preventDefault().
    event.preventDefault();

    // Client-side checks for instant feedback (the server re-checks these too).
    if (name.trim() === '') {
      setIsEmptyCategoryName(true);
      return;
    }

    const isDuplicate = categories.some(
      (cat) => cat.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (isDuplicate) {
      setIsUniqueCategory(false);
      return;
    }

    // Hand off to the server action and react to its result.
    setIsLoading(true);
    const result = await addNewCategory(name, icon);
    setIsLoading(false);

    if (!result.ok) {
      // The server rejected it (e.g. a race with another add, or a DB problem).
      // Keep the dialog open and show why.
      setServerError(result.error);
      return;
    }

    // Success: close the dialog. onOpenChange (below) resets the form for us.
    setIsDialogOpen(false);
  }

  function closeDialog () {
    setActiveIcon('Astroid');
    setCategoryName('');
    setIsEmptyCategoryName(false);
    setIsUniqueCategory(true);
    setServerError('');
  }

  return (
    <AlertDialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        // reset whenever it closes (Cancel, Esc, overlay, or our success)
        if (!open) {
          closeDialog();
        } 
      }}
    >
      <div className="flex flex-col w-full p-5 min-h-full">
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
          <div className="grid gap-3 w-full h-full pt-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category, idx) => {
              const CategoryIcon = (Lucide[category.icon as keyof typeof Lucide] ?? Lucide.Astroid) as LucideIcon;

              return (
                <div 
                  key={`${category.name}-${idx}`}
                  className="flex flex-col mx-5 border border-(--olivine)/20 rounded-sm p-2"
                >
                  <div className="p-2 flex items-center border-b border-b-(--burg)/50">
                    <CategoryIcon className="mr-2" />
                    <h2 className="page-title text-2xl">{category.name}</h2>
                    <h3 className="ml-auto page-subtitle">5/10</h3>
                  </div>
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
                      </div>
                    ))}
                  </div>
                  <div className="ml-5 px-1 flex items-center">
                    <Button
                      variant={'ghost'}
                      className="text-(--burg)/40 hover:bg-(--burg) hover:text-background"
                    >
                      Add Task
                      <CirclePlus/>
                    </Button>
                  </div>
                </div>
              )
            })}
            <AlertDialogTrigger className="flex justify-center items-center mx-5 border border-(--olivine)/20 rounded-sm p-2 bg-(--olivine)/5 cursor-pointer text-(--burg)/50 hover:text-(--burg) hover:shadow-sm">
              <div className="p-2 flex flex-col items-center justify-center text-center hover:cursor-pointer">
                <CirclePlus className="w-10 h-10" />
                <h2 className="page-subtitle">Add Category</h2>
              </div>
            </AlertDialogTrigger>
          </div>
        </div>
      </div>

      {/* Modal for adding new category */}
      <AlertDialogContent className="bg-white rounded-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className={`page-title border-b border-b-(--burg) w-full `}>Add New Category?</AlertDialogTitle>
          <Field className={`flex w-full text-(--burg) ${(isEmptyCategoryName || !isUniqueCategory) ? 'text-red-600' : 'text-(--burg)'}`}>
            <FieldLabel htmlFor="category-name">Category Name</FieldLabel>
            <Input 
              id="category-name"
              type="text"
              placeholder="Category"
              className={`bg-white text-(--burg) ${(isEmptyCategoryName || !isUniqueCategory) ? 'border-red-600' : 'border-gray-400'}`}
              onChange={(e) => {
                setCategoryName(e.target.value);
                // Typing clears any previous error so the user gets a fresh start.
                if (e.target.value !== '') {
                  setIsEmptyCategoryName(false);
                }
                setIsUniqueCategory(true);
                setServerError('');
              }}
            />
            {isEmptyCategoryName && <p className="text-red-600/50 text-xs">Category name cannot be empty</p>}
            {!isUniqueCategory && <p className="text-red-600/50 text-xs">Category already exists!</p>}
            {serverError && <p className="text-red-600/50 text-xs">{serverError}</p>}
          </Field>
          <div className="flex flex-col w-full items-start overflow-y overflow-y-scroll mt-2 text-(--burg)">
            Icon:
            <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full">
              {icons.map((icon, idx) => {
                const Icon = icon;
                return (
                  <Button
                    variant={'outline'}
                    className={`bg-white border-(--olivine) text-(--olivine) hover:bg-(--olivine) hover:text-background ${activeIcon === icon.displayName ? 'bg-(--olivine) text-background' : 'bg-white'}`}
                    key={idx}
                    onClick={() => {
                      setActiveIcon(icon.displayName ?? '')
                    }}
                  >
                    <Icon className=""/>
                  </Button>
                )
              })}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
          <AlertDialogCancel
            className="bg-background border-red-600 text-red-600 hover:bg-red-600 hover:text-background"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            className={isLoading ? 'bg-red-950/30' : 'bg-red-950 text-white hover:bg-red-900'}
            onClick={(e: React.MouseEvent) => {
              addCategory(e, categoryName, activeIcon);
            }}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              'Add'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}