import { Calendar, CalendarClock, ChartPie, ChessKing, CircleArrowRight, Gift, LucideIcon, Podium, SendHorizonal } from "lucide-react";
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field"
import { getDaysRemaining } from "@/lib/utils";

export default function Planner() {
  // days until our wedding date
  const daysTilWedding = getDaysRemaining('2027-09-11');

  const exampleUpNextTask: { taskName: string, goalDate: Date, icon: LucideIcon}[] = [
    { taskName: 'Book Venue', goalDate: new Date('2026-07-01'), icon: Calendar},
    { taskName: 'Send Invites', goalDate: new Date('2026-12-15'), icon: SendHorizonal},
    { taskName: 'Nathen\'s Dress', goalDate: new Date('2027-06-10'), icon: ChessKing}
  ];

  const tabs: { tabName: string, link: string, icon: LucideIcon }[] = [
    { tabName: 'Budget Breakdown', link: '/planner/budget', icon: ChartPie },
    { tabName: 'Choice Knockout', link: '/planner', icon: Podium },
    { tabName: 'Registry Purchases', link: '/planner', icon: Gift },
    { tabName: 'Timeline', link: '/planner', icon: CalendarClock }
  ];

  return (
    <div className="flex flex-col w-full items-center font-serif">
      <h1 className="page-title p-2 pb-0"> Sept. 11th 2027 </h1>
      <h2 className="page-subtitle p-2 pt-0"> {daysTilWedding} Days to &ldquo;I Do&rdquo; </h2>
      <div className="flex-col w-full h-auto">
        <div className="flex flex-col items-center w-full h-full pt-2 font-serif">
          <Field className="w-2/3">
            <FieldLabel htmlFor="task-progress" className="text-burg/70 font-bold">
              <span className="section-title">Checklist Progress</span>
              <span className="ml-auto">50%</span>
            </FieldLabel>
            <Progress
              id="task-progress"
              value={50}
            />
          </Field>
          <p className="section-title hidden mt-3 md:flex">Next Steps:</p>
          <div className="hidden w-full h-full justify-center items-center md:flex">
            <div className="w-1/2 h-full pt-2 m-1 grid grid-cols-3 gap-3 mt-1">
              {exampleUpNextTask.map(({taskName, goalDate, icon}, idx) => {
                const Icon = icon;
                return (
                  <Link 
                    className="grid grid-rows-3 w-full h-full justify-center items-center border border-burg/10 bg-olivine/15 rounded-md text-burg/65 cursor-pointer hover:shadow active:bg-olivine/20"
                    href={'/planner/checklist'}
                    key={idx}  
                  >
                    <p className="text-center">{taskName}</p>
                    <div className="flex w-full h-auto justify-center items-center">
                      <Icon
                        className="w-10 h-10 text-gold"
                        strokeWidth={1}
                      />
                    </div>
                    <p className="text-center">{goalDate.toLocaleDateString()}</p>
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center">
              <CircleArrowRight className="text-burg/30 cursor-pointer hover:text-burg/50"/>
            </div>
          </div>
          <div className="flex w-full h-full justify-center items-center md:hidden">
            <div className="w-1/2 h-full pt-2 m-1 grid grid-cols-3 gap-3 mt-1">
              <Link 
                className="grid grid-rows-2 col-span-3 w-full h-full justify-center items-center border border-burg/10 bg-olivine/15 rounded-md text-burg/65 cursor-pointer hover:shadow active:bg-olivine/20"
                href={'/planner/checklist'}
                key={`${exampleUpNextTask[0].taskName}`}  
              >
                <h1 className="page-subtitle row-span-2 text-burg text-center">{exampleUpNextTask[0].taskName}</h1>
                <p className="text-center pb-2">{exampleUpNextTask[0].goalDate.toLocaleDateString()}</p>
              </Link>
            </div>
            <div className="flex items-center">
              <CircleArrowRight className="text-burg/30 cursor-pointer hover:text-burg/50"/>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full h-1/4 justify-center px-10 py-5 text-burg md:px-20">
        <p className="uppercase tracking-[0.16em]">RSVPs</p>
        <Link 
          href={'/planner'}
          className="w-full h-full border-2 border-s-0 border-e-0 border-gold/50 hover:shadow cursor-pointer"
        >
          <div className="grid grid-cols-2 h-full md:grid-cols-4">
            <div className="hidden flex-col w-full h-auto border-e-2 border-e-gold/50 justify-center pl-5 md:flex">
              <p className="stat-number">150</p>
              <p className="muted-caption pt-2">Invited</p>
            </div>
            <div className="hidden flex-col w-full h-auto justify-center pl-5 md:border-e-2 md:border-e-gold/50 md:flex">
              <p className="stat-number">90</p>
              <p className="muted-caption pt-2">Responded</p>
            </div>
            <div className="flex flex-col w-full h-auto justify-center pl-5">
              <p className="stat-number text-olivine">72</p>
              <p className="muted-caption pt-2">Accepted</p>
            </div>
            <div className="flex flex-col w-full h-auto border-s-2 border-s-gold/50 justify-center pl-5">
              <p className="stat-number text-destructive">18</p>
              <p className="muted-caption pt-2">Rejected</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex h-2/5 w-full mb-10 px-10 py-5 lg:px-50 xl:px-80 lg:mb-0">
        <div className="grid grid-cols-2 grid-rows-2 gap-3 w-full justify-center lg:grid-cols-4 lg:grid-rows-none lg:h-1/4">
          {tabs.map(({tabName, link, icon}, idx) => {
            const Icon = icon;
            return (
              <Link 
                className="grid grid-rows-4 w-full h-full border border-burg/8 rounded-lg bg-olivine/10 cursor-pointer hover:shadow active:bg-olivine/15"
                href={link}
                key={`tab-${idx}`}
              >
                <div className="row-span-2 flex justify-center items-end">
                  <Icon 
                    className="w-1/2 h-1/2 text-gold" 
                    strokeWidth={1}
                  />
                </div>
                <div className="flex w-full h-full justify-center items-center text-center text-burg text-lg xl:text-2xl">
                  {tabName}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}