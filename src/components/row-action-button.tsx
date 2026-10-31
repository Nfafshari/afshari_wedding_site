import { SquarePen, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RowActionButtonProps extends Omit<React.ComponentProps<typeof Button>, "variant" | "size" | "children"> {
  action: "edit" | "delete";
  /** Names the row: "Edit Flowers", "Remove The Okafor family". */
  "aria-label": string;
}

/** The edit and delete icons at the end of a table row. Always visible, so touch and keyboard users can reach them. */
export default function RowActionButton({ action, ...props }: RowActionButtonProps) {
  return (
    <Button variant={action === "edit" ? "ghost" : "ghost-destructive"} size="icon-sm" {...props}>
      {action === "edit" ? <SquarePen /> : <Trash2 />}
    </Button>
  );
}
