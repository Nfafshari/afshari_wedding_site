"use client";

import { useState } from "react";
import { Circle, CirclePlus } from "lucide-react";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button"
import FilterButton from "@/components/filter-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getDaysRemaining } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Checklist() {
  const [activeTab, setActiveTab] = useState('All');
  const daysToWedding = getDaysRemaining('2027-09-11');

  const exampleCategories: string[] = ['Catering', 'Garments', 'Guests', 'Wedding Party', 'Venue']
  // filter array or set to all
  const filteredCategories = activeTab === 'All' ? exampleCategories : exampleCategories.filter((cat) => cat === activeTab);

  return (
    <AlertDialog>
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
            {exampleCategories.map((category, idx) => (
              <FilterButton
                isActive={category === activeTab}
                key={`${category}-${idx}`}
                onClick={() => {
                  setActiveTab(category)
                }}
              >
                {category}
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
            {filteredCategories.map((cat, idx) => {
              return (
                <div 
                  key={`${cat}-${idx}`}
                  className="flex flex-col mx-5 border border-(--olivine)/20 rounded-sm p-2"
                >
                  <div className="p-2 flex items-center border-b border-b-(--burg)/50">
                    <h2 className="page-title text-2xl">{cat}</h2>
                    <h3 className="ml-auto page-subtitle">5/10</h3>
                  </div>
                  <div className="p-2 flex-col">
                    <div className="flex py-2 w-full border-b border-b-(--burg)/50 text-(--burg)/70 items-center">
                      <button>
                        <Circle className="mx-3 cursor-pointer w-5 h-5"/>
                      </button>
                      <p>Task 1</p>
                      <p className="text-(--burg)/30 ml-auto">Jan 1st, 2027</p>
                    </div>
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
              <button 
                className="p-2 flex flex-col items-center justify-center text-center hover:cursor-pointer"
                onClick={() => {

                }}
              >
                <CirclePlus className="w-10 h-10" />
                <h2 className="page-subtitle">Add Category</h2>
              </button>
            </AlertDialogTrigger>
          </div>
        </div>
      </div>

      <AlertDialogContent className="bg-(--gold)/10 rounded-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="page-title border-b border-b-(--burg) w-full">Add New Category?</AlertDialogTitle>
          <AlertDialogDescription className="page-title w-full">
            <Field className="flex w-full">
              <FieldLabel htmlFor="category-name">Category Name</FieldLabel>
              <Input 
                id="category-name"
                type="text"
                placeholder="Category"
                className="bg-white"
              />
            </Field>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-(--gold)/30 rounded-sm rounded-t-none">
          <AlertDialogCancel className="bg-red-300 border-red-600 text-red-600 hover:bg-red-600 hover:text-background">Cancel</AlertDialogCancel>
          <AlertDialogAction className="text-black">Add</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}