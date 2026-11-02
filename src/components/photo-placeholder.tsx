import LogoSvg from "@/components/logo-svg";
import { cn } from "@/lib/utils";

/**
 * Stands in for a guest-site photo that hasn't been supplied yet: pale olivine, a faint
 * monogram and a label. Set its size and shape (e.g. `aspect-4/3`) with `className`.
 */
export default function PhotoPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-sm border border-gold/50 bg-olivine-100", className)}>
      <LogoSvg aria-hidden className="h-auto w-12 opacity-40" />
      <p className="guest-label">{label}</p>
    </div>
  );
}
