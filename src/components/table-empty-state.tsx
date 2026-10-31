import type { LucideIcon } from "lucide-react";

interface TableEmptyStateProps {
  icon: LucideIcon;
  message: string;
  /** An optional next step, such as an "Add …" button. */
  children?: React.ReactNode;
}

/** Stands in for a table, or a group inside one, that has no rows yet. */
export default function TableEmptyState({ icon: Icon, message, children }: TableEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-accent px-4 py-6 text-center whitespace-normal">
      <Icon className="size-6 text-gold-ink" strokeWidth={1.5} aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}
