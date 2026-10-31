import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  /** A second line saying what will show up here. */
  message?: string;
  /** "page" stands in for a whole page's content; "inline" for a table group or a card. */
  size?: "page" | "inline";
  /** The next step, usually the same "Add …" button the page header has. */
  children?: React.ReactNode;
}

/** Stands in for a page, table or card that has nothing in it yet. */
export default function EmptyState({ icon: Icon, title, message, size = "inline", children }: EmptyStateProps) {
  const isPage = size === "page";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-accent text-center whitespace-normal",
        isPage ? "px-6 py-16" : "px-4 py-6"
      )}
    >
      <Icon className={cn("text-gold-ink", isPage ? "size-12" : "size-6")} strokeWidth={isPage ? 1 : 1.5} aria-hidden />
      {isPage ? (
        <h2 className="page-subtitle text-lg md:text-2xl">{title}</h2>
      ) : (
        <p className="text-sm text-muted-foreground">{title}</p>
      )}
      {message && <p className="max-w-prose text-sm text-muted-foreground">{message}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
