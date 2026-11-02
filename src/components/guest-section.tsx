import { cn } from "@/lib/utils";

const TONES = {
  cream: "bg-background text-burg",
  olivine: "bg-olivine-100 text-burg",
  burg: "bg-burg text-cream",
} as const;

interface GuestSectionProps extends React.ComponentProps<"section"> {
  /** The band's colour. On `burg`, use bright `text-gold` for labels instead of the gold ink. */
  tone?: keyof typeof TONES;
}

/** A full-width band of a guest page, with its content centred and capped at max-w-5xl. */
export default function GuestSection({ tone = "cream", className, children, ...props }: GuestSectionProps) {
  return (
    <section className={cn("w-full px-4 py-16 md:px-8 md:py-24", TONES[tone], className)} {...props}>
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
