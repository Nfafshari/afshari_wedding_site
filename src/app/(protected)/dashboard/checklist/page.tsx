import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Circle, CirclePlus } from "lucide-react";

/**
 * Calculates the number of days between the current day and the target date
 * @param endDate - target date as a string in format "YYYY-MM-DD"
 * @returns difference of days
 */
function getDaysRemaining (endDate: string) {
  const today = new Date();
  const ourDay = new Date(endDate);

  // Get difference between times which is in ms
  const timeInMs = ourDay.getTime() - today.getTime();

  // Convert to days and return
  return Math.ceil(timeInMs / (1000 * 60 * 60 * 24));
}

export default function Checklist() {
  const daysToWedding = getDaysRemaining('2027-09-11');

  const exampleCategories: string[] = ['Catering', 'Garments', 'Guests', 'Wedding Party', 'Venue']

  return (
    <div className="flex flex-col w-full p-5">
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
            <Button 
              variant={'outline'}
              key={idx}
              className="border-(--olivine) rounded-full text-(--olivine) hover:bg-(--olivine) hover:text-background md:text-xl md:px-5 md:py-4"
            >
              {category}
            </Button>
          ))}
          <Button 
            variant={'outline'}
            key={'add-category'}
            className="border-(--olivine) rounded-full text-(--olivine) hover:bg-(--olivine) hover:text-background md:text-xl md:px-5 md:py-4"
          >
            All
          </Button>
        </div>
        <div className="grid gap-3 w-full h-full pt-5 md:grid-cols-2 lg:grid-cols-3">
          {exampleCategories.map((cat, idx) => {
            return (
              <div className="grid grid-rows-3 mx-5 border border-(--olivine)/20 rounded-sm p-2">
                <div className="p-2 flex items-center border-b border-b-(--gold)/50">
                  <h1 className="page-title text-2xl">{cat}</h1>
                  <h2 className="ml-auto page-subtitle">5/10</h2>
                </div>
                <div className="p-2 flex-col">
                  <div className="flex py-2 w-full border-b border-b-(--gold)/50 text-(--burg)/70 items-center">
                    <Circle className="mx-3 cursor-pointer w-5 h-5"/>
                    <p>Task 1</p>
                    <p className="text-(--burg)/30 ml-auto">Jan 1st, 2027</p>
                  </div>
                </div>
                <div className="ml-5 px-1 flex items-center items-center">
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
          <div className="flex justify-center items-center mx-5 border border-(--olivine)/20 rounded-sm p-2 bg-(--olivine)/5 cursor-pointer hover:shadow-sm">
            <div className="p-2 flex flex-col items-center justify-center text-center">
              <CirclePlus className="w-10 h-10 text-(--burg)/50" />
              <h2 className="page-subtitle">Add Category</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}