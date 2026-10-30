interface ColorSwatchProps {
  /** Short label, for example "olivine-500" or "primary". */
  name: string;
  /** The CSS custom property that holds the color, for example "--olivine-500". */
  cssVar: string;
  /** Custom property for the sample text drawn on the swatch. Defaults to the foreground color. */
  textVar?: string;
  /** One line on what the color is for. */
  note?: string;
}

/** A color tile that reads the live token, so it can never drift from globals.css. */
export default function ColorSwatch({ name, cssVar, textVar = "--foreground", note }: ColorSwatchProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-20 items-end rounded-md border p-2 text-lg font-bold"
        style={{ backgroundColor: `var(${cssVar})`, color: `var(${textVar})` }}
      >
        Aa
      </div>
      <div className="text-sm leading-tight">
        <p className="font-bold">{name}</p>
        <p className="font-mono text-xs text-burg/70">{cssVar}</p>
        {note && <p className="mt-0.5 text-xs text-burg/70">{note}</p>}
      </div>
    </div>
  );
}
