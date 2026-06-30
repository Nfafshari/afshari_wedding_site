"use client";

import { useState } from "react";
import { format } from "date-fns"; 
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";

import { getDaysRemaining } from "@/lib/utils";
import { CategoryWithTasks } from "./page";
import { addNewCategory, addNewTask, type ErrorField } from "./action";

interface ChecklistProps {
  categories: CategoryWithTasks[]
}

enum DialogType { 
  None =     'none',
  Category = 'category',
  Task =     'task'
}

export default function Checklist({
  categories 
}: ChecklistProps) {
  /** States */
  const [activeTab, setActiveTab] = useState('All');
  const [activeIcon, setActiveIcon] = useState('Astroid');
  const [categoryName, setCategoryName] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState<Date | undefined>();
  const [isEmptyInput, setIsEmptyInput] = useState(false);
  const [isUniqueCategory, setIsUniqueCategory] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.None);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverErrorField, setServerErrorField] = useState<ErrorField | null>(null);

  const WEDDING_DATE = '2027-09-11';
  const daysToWedding = getDaysRemaining(WEDDING_DATE);
  const dateOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  } as const;

  const iconsLibrary: LucideIcon[] = [Lucide.HandCoins, Lucide.CalendarDays, Lucide.Gift, Lucide.Car, Lucide.Store, Lucide.Timer, Lucide.Utensils, Lucide.Cake, Lucide.Astroid, ]

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
    setIsLoading(true);
    event.preventDefault();

    // Client-side checks for instant feedback (the server re-checks these too).
    if (name.trim() === '') {
      setIsEmptyInput(true);
      setIsLoading(false);
      return;
    }

    // Check if category name already exists and exit if it is
    for (let i = 0; i < categories.length; i++) {
      if (name.toLowerCase().trim() === categories[i].name.toLowerCase().trim()) {
        setIsUniqueCategory(false);
        setIsLoading(false);
        return;
      }
    }

    const result = await addNewCategory(name, icon);

    // check if adding a new category failed
    if (!result.ok) {
      setServerError(result.error);
      setServerErrorField(result.field ?? null);
      setIsLoading(false);
      return;
    }

    closeDialog(activeDialog);
    setIsLoading(false);
  }

  /**
   * Validates input, then calls the server action to create a task.
   * Keeps the dialog open on any error; closes it only on success.
   * @param event - Add button click event
   * @param name - Name of new task
   * @param goalDate - Goal date of new task, if it is undefined it will default to '2027-09-11'
   * @param categoryId - ID of the category the new task is connected (number)
   */
  async function addTask (event: React.MouseEvent, name: string, goalDate: Date | undefined, categoryId: number | null) {
    setIsLoading(true);
    event.preventDefault();

    // Client-side checks for instant feedback (the server re-checks these too).
    if (name.trim() === '') {
      setIsEmptyInput(true);
      setIsLoading(false);
      return;
    }

    const result = await addNewTask(name, goalDate, categoryId);

    // check if adding a new category failed
    if (!result.ok) {
      setServerError(result.error);
      setServerErrorField(result.field ?? null);
      setIsLoading(false);
      return;
    }

    closeDialog(activeDialog);
    setIsLoading(false);
  }

  function closeDialog (dialog: DialogType) {
    // Reset states according to dialog that is closing
    if (dialog === DialogType.Category) {  
      setActiveIcon('Astroid');
      setCategoryName('');
    } else if (dialog === DialogType.Task) {
      setActiveCategoryId(null);
      setTaskName('');
      setTaskDate(undefined);
    }

    // reset error states
    setIsEmptyInput(false);
    setIsUniqueCategory(true);
    setServerError('');
    setServerErrorField(null);

    // close active dialog
    setActiveDialog(DialogType.None)
  }

  return (
    <AlertDialog
      open={activeDialog !== DialogType.None}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only reset on close.
        if (!open) {
          closeDialog(activeDialog);
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

      {/* Modal for adding new category */}
      {activeDialog === DialogType.Category &&
        <AlertDialogContent id={'add-category-dialog'} className="bg-white rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className={`page-title border-b border-b-(--burg) w-full `}>Add New Category?</AlertDialogTitle>
            <Field className='flex w-full text-(--burg)'>
              <FieldLabel htmlFor="category-name">Category Name</FieldLabel>
              <Input 
                id="category-name"
                type="text"
                placeholder="Category"
                className={`bg-white text-(--burg) rounded-sm ${(isEmptyInput || !isUniqueCategory || serverErrorField === 'name') ? 'border-red-600' : 'border-gray-400'}`}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  // Typing clears any previous error so the user gets a fresh start.
                  if (e.target.value !== '') {
                    setIsEmptyInput(false);
                  }
                  setIsUniqueCategory(true);
                  setServerError('');
                  setServerErrorField(null);
                }}
              />
              {isEmptyInput && <p className="text-red-600/50 text-xs">Category name cannot be empty</p>}
              {!isUniqueCategory && <p className="text-red-600/50 text-xs">Category already exists!</p>}
              {serverError && <p className="text-red-600/50 text-xs">{serverError}</p>}
            </Field>
            <div className="flex flex-col w-full items-start overflow-y overflow-y-scroll mt-2 text-(--burg)">
              Icon:
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full">
                {iconsLibrary.map((icon, idx) => {
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
          <AlertDialogFooter className="bg-gray-50 rounded-sm rounded-t-none">
            <AlertDialogCancel className="bg-gray-50 border-red-600 text-red-600 hover:bg-red-600 hover:text-background">
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
      }


      {/* Modal for adding new tasks */}
      {activeDialog === DialogType.Task &&
        <AlertDialogContent id={'add-task-dialog'} className="bg-white rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className={`page-title border-b border-b-(--burg) w-full`}>Add New Task?</AlertDialogTitle>
            <Field className='flex w-full text-(--burg)'>
              <FieldLabel htmlFor="task-name">Task Name</FieldLabel>
              <Input 
                id="task-name"
                type="text"
                placeholder="Task"
                className={`bg-white text-(--burg) placeholder:text-gray-500 rounded-sm ${(isEmptyInput || serverErrorField === 'name') ? 'border-red-600' : 'border-gray-200'}`}
                onChange={(e) => {
                  setTaskName(e.target.value);
                  if (e.target.value !== '') {
                    setIsEmptyInput(false);
                  }
                  setServerError('');
                  setServerErrorField(null);
                }}
              />
              {isEmptyInput && <p className="text-red-600/50 text-xs">Task name cannot be empty</p>}
              {/* name-specific or general (no field) errors show here */}
              {(serverError && (serverErrorField === 'name' || serverErrorField === null)) && <p className="text-red-600/50 text-xs">{serverError}</p>}
            </Field>
            <div className="flex flex-col w-full items-start overflow-y overflow-y-scroll mt-2 text-(--burg)">
              <Field className="">
                <FieldLabel htmlFor="date-picker-simple">Date</FieldLabel>
                <Popover
                  open={isCalendarOpen}
                  onOpenChange={setIsCalendarOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date-picker-simple"
                      className={`justify-start font-normal bg-white rounded-sm ${serverErrorField === 'date' ? 'border-red-600' : 'border-gray-200'}`}
                    >
                      {taskDate ? format(taskDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={taskDate}
                      onSelect={(date) => {
                        setTaskDate(date)
                        setIsCalendarOpen(false);
                      }}
                      defaultMonth={taskDate}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              {/* date- or category-specific errors show here */}
              {(serverError && (serverErrorField === 'date' || serverErrorField === 'category')) && <p className="text-red-600/50 text-xs">{serverError}</p>}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="bg-gray-50 rounded-sm rounded-t-none">
            <AlertDialogCancel className="bg-gray-50 border-red-600 text-red-600 hover:bg-red-600 hover:text-background">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className={isLoading ? 'bg-red-950/30' : 'bg-red-950 text-white hover:bg-red-900'}
              onClick={(e: React.MouseEvent) => {
                addTask(e, taskName, taskDate, activeCategoryId);
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
      }
    </AlertDialog>
  );
}