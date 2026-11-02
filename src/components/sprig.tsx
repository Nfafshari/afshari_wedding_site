import { cn } from "@/lib/utils";

/** The gold line, leaf sprig and line divider between guest-site blocks. Decorative. */
export default function Sprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 16"
      fill="none"
      aria-hidden
      className={cn("h-4 w-40 text-gold", className)}
    >
      <path d="M0 8H66M94 8H160" stroke="currentColor" />
      <path d="M80 8C76 8 72 6 70 3C74 3 78 5 80 8Z" fill="currentColor" />
      <path d="M80 8C76 8 72 10 70 13C74 13 78 11 80 8Z" fill="currentColor" />
      <path d="M80 8C84 8 88 6 90 3C86 3 82 5 80 8Z" fill="currentColor" />
      <path d="M80 8C84 8 88 10 90 13C86 13 82 11 80 8Z" fill="currentColor" />
      <circle cx="80" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}
