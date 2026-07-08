"use client";

import CategoryTable, { Category } from "@/app/(protected)/dashboard/budget/components/category-table";
import {StackedProgressBar, type ProgressBarLegend} from "@/components/stacked-progress-bar";
import { toCurrency } from "@/lib/utils";

export default function Budget () {
  const LIMITS = { target: 15000, cap: 20000 };

  /** TEMP CATEGORY PLACEHOLDER */
  const categoryBreakdown: Category[] = [
    { categoryName: 'Venue & Rentals', 
      items: [
        { name: 'Venue', estimatedCost: 4000, paidAmount: 500 },
        { name: 'Tables, Chairs, Linens (rental)', estimatedCost: 4000, paidAmount: 0 },
        { name: 'Lighting & Heating', estimatedCost: 500, paidAmount: 0 }
      ]
    },
    { categoryName: 'Food & Drink', 
      items: [
        { name: 'Catering', estimatedCost: 3200, paidAmount: 0 },
        { name: 'Bar/Alcohol', estimatedCost: 1000, paidAmount: 0 },
        { name: 'Snacks', estimatedCost: 200, paidAmount: 0 }
      ]
    },
  ]

  const progressLegend: ProgressBarLegend = {
    primary: { label: 'Estimated', value: 16000, color: 'var(--gold)' },
    secondary: { label: 'Spent', value: 10000, color: 'var(--foreground)' }
  }

  return (
    <div className="w-full min-h-full bg-background font-sans text-burg px-6 py-2 md:px-12 lg:px-16">
      {/** title */}
      <div className="flex w-full">
        <h1 className="page-title w-full text-center translate-y-3 md:text-start">Budget Tracker</h1>
        <div className="hidden flex-col w-1/2 ml-auto md:flex">
          <h2 className="page-title text-2xl text-end">{toCurrency(10000)} Paid</h2>
          <h3 className="section-title text-end text-sm">{toCurrency(6000)} Remaining</h3>
        </div>
      </div>
      <hr className="my-5 bg-accent"/>

      <div className="flex flex-col justify-center items-center md:hidden">
        <h2 className="page-title text-6xl text-olivine">{toCurrency(10000)}</h2>
        <h3 className="section-title text-sm text-accent-foreground font-normal">Paid of {toCurrency(16000)} Estimated</h3>
      </div>

      {/** overview */}
      <div className="grid pt-3 lg:grid-cols-2 lg:gap-10">
        <div className="flex flex-col w-full px-2">
          <h3 className="hidden section-title font-normal text-accent-foreground ml-1 mb-3 md:flex">Estimated/Spent vs. Soft/Hard Caps</h3>
          <StackedProgressBar 
            limits={LIMITS}
            legend={progressLegend}
          />
        </div>
        <div className="hidden flex-col w-full mt-5 md:mt-0 md:flex">
          <div className="flex py-4 items-center border-b border-b-accent">
            <p className="text-gold mt-1 text-xl">ESTIMATED TOTAL</p>
            <p className="ml-auto text-3xl md:text-4xl">{toCurrency(16000)}</p>
          </div>
          <div className="flex py-4 items-center border-b border-b-accent">
            <p className="text-gold mt-1 text-xl">PAID TO DATE</p>
            <p className="ml-auto text-3xl text-olivine md:text-4xl">{toCurrency(10000)}</p>
          </div>
          <div className="flex py-4 items-center border-b border-b-accent">
            <p className="text-gold mt-1 text-xl">BALANCE DUE</p>
            <p className="ml-auto text-red-800 text-3xl md:text-4xl">{toCurrency(6000)}</p>
          </div>
        </div>
      </div>

      {/** Category breakdown */}
      <div className="mt-10 w-full">
        <h3 className="text-accent-foreground text-lg mb-2">By Category Breakdown</h3>
        <CategoryTable data={categoryBreakdown} />
      </div>
    </div>
  );
}