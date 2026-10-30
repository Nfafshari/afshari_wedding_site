import { cn } from "@/lib/utils";

interface TypeSpecimenProps {
  /** The class to reach for, for example "page-title" or "text-sm". */
  name: string;
  /** Classes applied to the sample. Usually the same as name, plus layout overrides. */
  className: string;
  sample: string;
  /** Font, size and weight, for example "Cormorant 600 · 36px". */
  spec: string;
  usage: string;
}

/** One row of the type scale: the live sample next to what it is and when to use it. */
export default function TypeSpecimen({ name, className, sample, spec, usage }: TypeSpecimenProps) {
  return (
    <div className="grid gap-2 border-b py-4 md:grid-cols-[14rem_1fr] md:gap-6">
      <div className="text-sm leading-tight">
        <p className="font-mono text-xs font-bold">{name}</p>
        <p className="mt-1 text-burg/70">{spec}</p>
        <p className="mt-1 text-burg/70">{usage}</p>
      </div>
      <p className={cn("min-w-0 break-words", className)}>{sample}</p>
    </div>
  );
}
