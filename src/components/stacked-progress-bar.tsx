"use client";

export interface ProgressBarLegend { 
  primary: { label: string, value: number, color: string };
  secondary: { label: string, value: number, color: string };
}

interface StackedProgressBarProps {
  /** target and cap limits of the full bar 
   * @example
   * target = 5, cap = 10
   * target is a tick mark that shows where goal value is on the progress bar,
   * cap is the full length of the bar and highest limit
   *          |+++++++++|+++++++++|
   *          0         5        10
   */
  limits: { target: number, cap: number };
  legend: ProgressBarLegend
}

/** gets the percentage of value to max */
function getProgress (value: number, max: number) {
  // guard divide by 0
  if (value === 0 || max === 0) {
    return 0;
  }

  const progress = ((value / max) * 100).toFixed(0)
  return Math.min(100, Number(progress));
}

/** Helper function to compact the format of larger numbers (i.e. 1200 to 1.2k) */
function compactNumber(num: number) {
  return new Intl.NumberFormat('en-us', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  }).format(num);
}

/**
 * A stacked progress bar that tracks 4 values. 2 progress values and 2 limits. (target and cap)
 * 
 * There are 3 ticks, one at the start (0), the target value (adjusts on a percentage), and the cap which is the max value.
 * There are 2 progress bars which display the primary and secondary values. The secondary bar overlaps the primary bar.
 * if the secondary bar is ever larger than the primary bar, the primary bar will overlap the secondary bar.
 * 
 * @example
 * <StackedProgressBar
 *    limits={{ target: 15000, cap: 20000 }}
 *    legend={{ 
 *      primary: { label: 'Estimated Cost', value: 18000, color: #ff0000 },
 *      secondary: { label: 'Spend', value: 10000, color: #fffb00 }
 *    }}
 * />
 */
export function StackedProgressBar ({ limits, legend }: StackedProgressBarProps) {
  const targetPercentage = getProgress(limits.target, limits.cap);
  const primaryBarPercentage = getProgress(legend.primary.value, limits.cap);
  const secondaryBarPercentage = getProgress(legend.secondary.value, limits.cap);

  return (
    <div 
      className="relative w-full"
      role="progressbar"
    >
      {/** progress bars */}
      <div className="relative mx-1.5 mb-2 h-4 rounded-xs bg-muted">
        <div className='absolute left-0 top-0 h-full rounded-xs' style={{ width: `${primaryBarPercentage}%`, backgroundColor: legend.primary.color, zIndex: `${legend.secondary.value > legend.primary.value ? 15 : 5}` }} />
        <div className='absolute z-10 left-0 top-0 h-full rounded-xs' style={{ width: `${secondaryBarPercentage}%`, backgroundColor: legend.secondary.color }} />
        <div className="absolute z-20 -top-1.5 h-8 w-0.5 bg-black border border-accent" style={{ left: `${targetPercentage}%` }} />
        <div className="absolute z-20 -top-1.5 left-0 h-8 w-0.5 bg-black border border-accent" />
        <div className="absolute z-20 -top-1.5 right-0 h-8 w-0.5 bg-black border border-accent" />
      </div>

      {/** labels */}
      <div className="absolute text-sm left-1.5 -translate-x-1/2">$0</div>
      <div className="absolute text-sm -translate-x-1/2" style={{ left: `${targetPercentage}%` }}>${compactNumber(limits.target)}</div>
      <div className="absolute text-sm right-1.5 translate-x-1/2" >${compactNumber(limits.cap)}</div>
    
      {/** Keys */}
      <div className="flex mt-8 ml-1.5 gap-8 text-sm text-accent-foreground">
        <div className="flex items-center tracking-wide">
          <div className='w-2 h-2 mr-2' style={{ backgroundColor: legend.primary.color }} />
          <p>{legend.primary.label} • ${compactNumber(legend.primary.value)}</p>
        </div>
        <div className="flex items-center tracking-wide">
          <div className='w-2 h-2 mr-2' style={{ backgroundColor: legend.secondary.color }} />
          <p>{legend.secondary.label} • ${compactNumber(legend.secondary.value)}</p>
        </div>
      </div>
    </div>
  );
}