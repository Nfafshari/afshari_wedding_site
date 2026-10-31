import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  /** One line summing up the page: "12 of 40 parties responded". */
  subtitle?: React.ReactNode;
  /**
   * "below" sits under the title. "end" sits on the title's line, right-aligned, for a
   * page with no actions (the Dashboard). Both stack under the title on phones.
   */
  subtitlePlacement?: "below" | "end";
  /** The page's main buttons, primary first. Stacks under the title on phones. */
  actions?: React.ReactNode;
}

/** The title block at the top of every planner page. */
export default function PageHeader({ title, subtitle, subtitlePlacement = "below", actions }: PageHeaderProps) {
  const subtitleAtEnd = subtitlePlacement === "end";
  const subtitleLine = subtitle && (
    <p className={cn("page-subtitle mt-1 text-left text-lg md:text-xl", subtitleAtEnd && "md:mt-0 md:text-right")}>{subtitle}</p>
  );

  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-3 border-b border-accent pb-4 md:flex-row md:justify-between",
        // A subtitle on the title's line sits on its baseline; buttons sit on its bottom edge.
        subtitleAtEnd ? "md:items-baseline" : "md:items-end"
      )}
    >
      <div>
        <h1 className="page-title text-left">{title}</h1>
        {!subtitleAtEnd && subtitleLine}
      </div>
      {subtitleAtEnd && subtitleLine}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
