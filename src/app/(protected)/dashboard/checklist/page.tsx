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
import { CirclePlus } from "lucide-react";

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

      <div className="flex flex-col w-full h-auto mt-2 p-5 border border-blue-600">
        <div className="flex flex-wrap w-full justify-center px-10 py-5 gap-2 border border-red-500">
          {exampleCategories.map((category, idx) => (
            <Button 
              variant={'outline'}
              key={idx}
              className="border-(--olivine) text-(--olivine) hover:bg-(--olivine)/50 rounded-full hover:text-(--olivine) md:text-xl md:px-5 md:py-4"
            >
              {category}
            </Button>
          ))}

          <Button 
            variant={'outline'}
            key={'add-category'}
            className="border-(--olivine) text-(--olivine) hover:bg-(--olivine)/50 hover:text-(--olivine) md:text-xl md:px-5 md:py-4"
          >
            Add Category
            <CirclePlus/>
          </Button>
        </div>
        <div className="grid gap-3 w-full h-full border border-red-600 p-4">
          {exampleCategories.map((cat, idx) => {
            return (
              <Card className="mx-auto w-full max-w-sm">
                <CardHeader>
                  <CardTitle>Terms of Service</CardTitle>
                  <CardDescription>
                    Review the terms before accepting the agreement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="-mb-(--card-spacing)">
                  <div className="-mx-(--card-spacing) max-h-48 space-y-4 overflow-y-scroll border-t bg-muted/50 px-(--card-spacing) py-4 text-sm leading-relaxed">
                    <p>
                      These terms govern your use of the workspace, including access to
                      shared documents, project files, and collaboration tools.
                    </p>
                    <p>
                      You are responsible for the content you upload and for ensuring that
                      your team has the appropriate permissions to view or edit it.
                    </p>
                    <p>
                      We may update features or limits as the service evolves. When those
                      changes materially affect your workflow, we will notify your
                      workspace administrators.
                    </p>
                    <p>
                      By continuing, you agree to keep your account credentials secure and
                      to follow your organization&apos;s acceptable use policies.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button variant="outline">Decline</Button>
                  <Button>Accept</Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  );
}