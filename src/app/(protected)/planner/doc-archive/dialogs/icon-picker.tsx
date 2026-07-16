"use client";

import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** The icons a document can be tagged with. Shared by the add and edit dialogs. */
export const ICON_LIBRARY: LucideIcon[] = [
  Lucide.Columns2, Lucide.FileChartColumn, Lucide.FilePenLine, Lucide.Receipt, Lucide.SquarePen
];

interface IconPickerProps {
  /** The icons a document can be tagged with. */
  icons: LucideIcon[];
  /** displayName of the currently selected icon. */
  value: string;
  /** Called with the newly selected icon's displayName. */
  onChange: (iconName: string) => void;
}

/** "FileChartColumn" -> "File Chart Column", so screen readers don't spell out camelCase. */
function humanize(iconName: string): string {
  return iconName.replace(/([a-z])([A-Z0-9])/g, '$1 $2');
}

/**
 * Single-select icon grid, shared by the add and edit document dialogs.
 *
 * Each tile is a toggle button rather than a `role="radio"`: a radiogroup
 * promises arrow-key navigation, and there is none here, so aria-pressed is the
 * honest description. Tab reaches every tile and Space/Enter picks it natively.
 */
export default function IconPicker({ icons, value, onChange }: IconPickerProps) {
  return (
    <div role="group" aria-label="Document icon" className="grid grid-cols-5 gap-2 w-full">
      {icons.map((Icon) => {
        const iconName = Icon.displayName ?? '';
        const isSelected = value === iconName;

        return (
          <button
            key={iconName}
            type="button"
            aria-label={humanize(iconName)}
            aria-pressed={isSelected}
            className={`flex aspect-square items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-olivine focus-visible:ring-offset-2 ${
              isSelected
                ? 'border-olivine bg-olivine text-popover'
                : 'border-olivine/40 bg-popover text-olivine hover:border-olivine hover:bg-olivine/10'
            }`}
            onClick={() => onChange(iconName)}
          >
            <Icon className="size-8" />
          </button>
        );
      })}
    </div>
  );
}
