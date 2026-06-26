import { Calendar, CalendarClock, ChartPie, ChessKing, CircleArrowRight, Gift, LucideIcon, Podium, SendHorizonal } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field"

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

export default function Dashboard() {
  // days until our wedding date
  const daysTilWedding = getDaysRemaining('2027-09-11');

  const exampleUpNextTask: { taskName: string, goalDate: Date, icon: LucideIcon}[] = [
    { taskName: 'Book Venue', goalDate: new Date('2026-07-01'), icon: Calendar},
    { taskName: 'Send Invites', goalDate: new Date('2026-12-15'), icon: SendHorizonal},
    { taskName: 'Nathen\'s Dress', goalDate: new Date('2027-06-10'), icon: ChessKing}
  ];

  const tabs: { tabName: string, icon: LucideIcon }[] = [
    { tabName: 'Budget Breakdown', icon: ChartPie },
    { tabName: 'Choice Knockout', icon: Podium },
    { tabName: 'Registry Purchases', icon: Gift },
    { tabName: 'Timeline', icon: CalendarClock }
  ];

  return (
    <div className="flex flex-col w-full h-full items-center font-serif">
      <h1 className="page-title p-2 pb-0"> Sept. 11th 2027 </h1>
      <h2 className="page-subtitle p-2 pt-0"> {daysTilWedding} Days to "I Do" </h2>
      <div className="flex-col w-full h-auto">
        <div className="flex flex-col items-center w-full h-full pt-2 font-serif">
          <Field className="w-2/3">
            <FieldLabel htmlFor="task-progress" className="text-(--burg)/70 font-bold">
              <span className="section-title">Checklist Progress</span>
              <span className="ml-auto">50%</span>
            </FieldLabel>
            <Progress
              id="task-progress"
              value={50}
            />
          </Field>
          <p className="section-title hidden mt-3 md:flex">Next Steps</p>
          <div className="hidden w-full h-full justify-center items-center md:flex">
            <div className="w-1/2 h-full pt-2 m-1 grid grid-cols-3 gap-3 mt-1">
              {exampleUpNextTask.map(({taskName, goalDate, icon}, idx) => {
                const Icon = icon;
                return (
                  <div 
                    className="grid grid-rows-3 w-full h-full justify-center items-center border border-gray-700/10 bg-(--olivine)/15 rounded-md text-(--burg)/65 cursor-pointer hover:shadow active:bg-(--olivine)/20"
                    key={idx}  
                  >
                    <p className="text-center">{taskName}</p>
                    <div className="flex w-full h-auto justify-center items-center">
                      <Icon
                        className="w-10 h-10 text-(--gold)"
                        strokeWidth={1}
                      />
                    </div>
                    <p className="text-center">{goalDate.toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center">
              <CircleArrowRight className="text-gray-700/30 cursor-pointer hover:text-gray-700/50"/>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full h-1/4 justify-center px-10 py-5 text-(--burg) md:px-20">
        RSVPs
        <div className="w-full h-full border-2 border-s-0 border-e-0 border-(--gold)/50 hover:shadow cursor-pointer">
          <div className="grid grid-cols-2 h-full md:grid-cols-4">
            <div className="hidden flex-col w-full h-auto border-e-2 border-e-(--gold)/50 justify-center pl-5 md:flex">
              <p className="stat-number">150</p>
              <p className="muted-caption pt-2">Invited</p>
            </div>
            <div className="hidden flex-col w-full h-auto justify-center pl-5 md:border-e-2 md:border-e-(--gold)/50 md:flex">
              <p className="stat-number">90</p>
              <p className="muted-caption pt-2">Responded</p>
            </div>
            <div className="flex flex-col w-full h-auto justify-center pl-5">
              <p className="stat-number text-(--olivine)">72</p>
              <p className="muted-caption pt-2">Accepted</p>
            </div>
            <div className="flex flex-col w-full h-auto border-s-2 border-s-(--gold)/50 justify-center pl-5">
              <p className="stat-number text-red-800/90">18</p>
              <p className="muted-caption pt-2">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-1/2 w-full mb-10 px-10 py-5 md:px-80 md:mb-0">
        <div className="grid grid-cols-2 grid-rows-2 gap-3 w-full justify-center md:grid-cols-4 md:grid-rows-none md:h-1/4">
          {tabs.map(({tabName, icon}, idx) => {
            const Icon = icon;
            return (
              <div 
                className="grid grid-rows-4 w-full h-full border border-gray-600/8 rounded-lg bg-(--olivine)/10 cursor-pointer hover:shadow active:bg-(--olivine)/15"
                key={`tab-${idx}`}
              >
                <div className="row-span-2 flex justify-center items-end">
                  <Icon 
                    className="w-1/2 h-1/2 text-(--gold)" 
                    strokeWidth={1}
                  />
                </div>
                <div className="flex w-full h-full justify-center items-center text-(--burg) text-lg md:text-2xl">
                  {tabName}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}