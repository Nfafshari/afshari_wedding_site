import { cn } from "@/lib/utils";

interface TokenTileProps {
  /** The utility class, for example "rounded-lg" or "shadow-md". */
  name: string;
  /** Classes applied to the sample box (the token being shown, plus its surface). */
  className: string;
  /** What the step is for. */
  note: string;
}

/** A sample box for a radius or shadow step, with its class name and role. */
export default function TokenTile({ name, className, note }: TokenTileProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("h-20 w-full", className)} />
      <div className="text-sm leading-tight">
        <p className="font-mono text-xs font-bold">{name}</p>
        <p className="mt-0.5 text-xs text-burg/70">{note}</p>
      </div>
    </div>
  );
}
