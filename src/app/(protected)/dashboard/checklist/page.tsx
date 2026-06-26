import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";

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

  return (
    <div className="flex flex-col w-full h-full p-5">
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
    </div>
  );
}