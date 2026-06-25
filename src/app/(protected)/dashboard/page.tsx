import RadialChart from "@/components/radial-chart";
import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field"

export default function Dashboard() {
  function getDaysRemaining (endDate: string) {
    const today = new Date();
    const ourDay = new Date(endDate);

    const timeInMs = ourDay.getTime() - today.getTime();
    return Math.ceil(timeInMs / (1000 * 60 * 60 * 24));
  }

  const daysTilWedding = getDaysRemaining('2027-08-11');

  return (
    <div className="flex-col w-full h-full justify-center items-center font-serif">
      <h1 className="text-4xl text-(--burg) p-2 pb-0 font-serif text-center"> Sept. 11th 2026 </h1>
      <h1 className="text-2xl text-(--burg)/50 p-2 pt-0 font-serif text-center"> {daysTilWedding} Days to "I Do" </h1>
      <div className="flex-col w-full h-1/4">
        <div className="flex-col justify-center items-center w-full h-full pt-2 md:hidden">
          <p className="text-center py-2 text-(--burg)">Timeline Progress</p>
          <div className="w-full h-2/3 flex justify-center items-center">
            <RadialChart />
          </div>
        </div>

        <div className="hidden justify-center w-full h-full pt-2 border-2 border-red-600 font-serif md:flex">
          <Field className="w-2/3">
            <FieldLabel htmlFor="task-progress" className="text-(--burg)/70 font-bold">
              <span className="text-(--burg)/70">Timeline Progress</span>
              <span className="ml-auto">50%</span>
            </FieldLabel>
            <Progress
              id="task-progress"
              value={50}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}