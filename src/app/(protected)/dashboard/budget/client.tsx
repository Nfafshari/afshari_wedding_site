"use client";

import {StackedProgressBar, type ProgressBarLegend} from "@/components/stacked-progress-bar";

export default function Budget () {
  const LIMITS = { target: 15000, cap: 20000 };

  const progressLegend: ProgressBarLegend = {
    primary: { label: 'Estimated', value: 16000, color: 'var(--gold)' },
    secondary: { label: 'Spent', value: 10000, color: 'var(--foreground)' }
  }

  return (
    <div className="w-full min-h-full bg-background font-sans text-burg px-6 py-10 md:px-12 lg:px-16">
      <div>
        <StackedProgressBar 
          limits={LIMITS}
          legend={progressLegend}
        />
      </div>
    </div>
  );
}