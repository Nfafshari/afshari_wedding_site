import { requireUser } from "@/lib/require-user";

import ColorSwatch from "@/components/ui-kit/color-swatch";
import ContrastTable, { type ContrastPair } from "@/components/ui-kit/contrast-table";
import KitSection from "@/components/ui-kit/kit-section";

/**
 * The planner's UI kit: a living reference built from the real tokens and components, so it
 * can't drift from the code. Reachable by URL only (not in the nav). Each kit issue adds a section.
 */

const RAMPS = [
  {
    name: "Cream",
    steps: [
      { name: "cream-50", note: "Page canvas", textVar: "--burgundy-800" },
      { name: "cream-200", note: "Sidebar", textVar: "--burgundy-800" },
      { name: "cream-300", note: "Muted surfaces", textVar: "--burgundy-800" },
    ],
  },
  {
    name: "Olivine",
    steps: [
      { name: "olivine-100", note: "Cards", textVar: "--burgundy-800" },
      { name: "olivine-200", note: "Borders, hover and selected", textVar: "--burgundy-800" },
      { name: "olivine-500", note: "Brand olivine. Fills only, never text", textVar: "--burgundy-800" },
      { name: "olivine-600", note: "Input borders and focus ring", textVar: "--cream-50" },
      { name: "olivine-700", note: "Ink: olivine text and icons", textVar: "--cream-50" },
    ],
  },
  {
    name: "Gold",
    steps: [
      { name: "gold-500", note: "Brand gold. Fills, logo, script title", textVar: "--burgundy-900" },
      { name: "gold-700", note: "Ink: gold text and icons", textVar: "--cream-50" },
    ],
  },
  {
    name: "Burgundy",
    steps: [
      { name: "burgundy-600", note: "Secondary text", textVar: "--cream-50" },
      { name: "burgundy-800", note: "Brand burgundy. Text, primary actions", textVar: "--cream-50" },
      { name: "burgundy-900", note: "Text on gold", textVar: "--cream-50" },
    ],
  },
];

const ROLES = [
  { name: "background", fg: "--foreground", note: "Page canvas" },
  { name: "card", fg: "--card-foreground", note: "Cards and panels" },
  { name: "popover", fg: "--popover-foreground", note: "Dialogs and menus" },
  { name: "primary", fg: "--primary-foreground", note: "Main actions" },
  { name: "secondary", fg: "--secondary-foreground", note: "Supporting actions, highlights" },
  { name: "accent", fg: "--accent-foreground", note: "Hover and selected states" },
  { name: "muted", fg: "--muted-foreground", note: "Quiet surfaces and secondary text" },
  { name: "destructive", fg: "--destructive-foreground", note: "Delete and errors" },
  { name: "success", fg: "--success-foreground", note: "Done, saved" },
  { name: "warning", fg: "--warning-foreground", note: "Needs attention" },
];

const PAIRS: ContrastPair[] = [
  { label: "Text on page (foreground on background)", foreground: "--foreground", background: "--background", kind: "text" },
  { label: "Text on card", foreground: "--card-foreground", background: "--card", kind: "text" },
  { label: "Text on muted surface", foreground: "--foreground", background: "--muted", kind: "text" },
  { label: "Text on hover and selected (accent)", foreground: "--accent-foreground", background: "--accent", kind: "text" },
  { label: "Secondary text on page", foreground: "--muted-foreground", background: "--background", kind: "text" },
  { label: "Secondary text on card", foreground: "--muted-foreground", background: "--card", kind: "text" },
  { label: "Secondary text on muted surface", foreground: "--muted-foreground", background: "--muted", kind: "text" },
  { label: "Primary button", foreground: "--primary-foreground", background: "--primary", kind: "text" },
  { label: "Secondary button (on gold)", foreground: "--secondary-foreground", background: "--secondary", kind: "text" },
  { label: "Text on brand olivine", foreground: "--foreground", background: "--olivine", kind: "text" },
  { label: "Destructive text on page", foreground: "--destructive", background: "--background", kind: "text" },
  { label: "Destructive text on card", foreground: "--destructive", background: "--card", kind: "text" },
  { label: "Destructive text on dialog", foreground: "--destructive", background: "--popover", kind: "text" },
  { label: "Filled destructive", foreground: "--destructive-foreground", background: "--destructive", kind: "text" },
  { label: "Filled success", foreground: "--success-foreground", background: "--success", kind: "text" },
  { label: "Filled warning", foreground: "--warning-foreground", background: "--warning", kind: "text" },
  { label: "Olivine ink on page", foreground: "--olivine-ink", background: "--background", kind: "text" },
  { label: "Olivine ink on card", foreground: "--olivine-ink", background: "--card", kind: "text" },
  { label: "Gold ink on page", foreground: "--gold-ink", background: "--background", kind: "text" },
  { label: "Gold ink on card", foreground: "--gold-ink", background: "--card", kind: "text" },
  { label: "Gold text on burgundy (footer)", foreground: "--gold", background: "--foreground", kind: "text" },
  { label: "Input border on page", foreground: "--input", background: "--background", kind: "ui" },
  { label: "Input border on dialog", foreground: "--input", background: "--popover", kind: "ui" },
  { label: "Input border on card", foreground: "--input", background: "--card", kind: "ui" },
  { label: "Focus ring on page", foreground: "--ring", background: "--background", kind: "ui" },
  {
    label: "Brand gold on page (script title, logo)",
    foreground: "--gold",
    background: "--background",
    kind: "large-text",
    exception: "Decorative: the couple's names and the logo. Use gold ink for any real text.",
  },
];

export default async function UiKitPage() {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-6">
      <header>
        <h1 className="page-title text-left">UI Kit</h1>
        <p className="mt-1 max-w-prose text-burg/70">
          The planner&apos;s colors, components and rules, rendered from the real code. Reach for these before adding
          anything new.
        </p>
      </header>

      <KitSection
        id="palette"
        title="Palette"
        description="Four brand colors. Burgundy carries text and primary actions, cream is the canvas, olivine is structure and surfaces, gold is highlights and secondary actions. Higher step numbers are darker."
      >
        <div className="flex flex-col gap-8">
          {RAMPS.map((ramp) => (
            <div key={ramp.name}>
              <h3 className="mb-3 font-bold">{ramp.name}</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {ramp.steps.map((step) => (
                  <ColorSwatch key={step.name} name={step.name} cssVar={`--${step.name}`} textVar={step.textVar} note={step.note} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </KitSection>

      <KitSection
        id="roles"
        title="Roles"
        description="Components use these names, never the ramp steps. Change a role here and every component follows."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ROLES.map((role) => (
            <ColorSwatch key={role.name} name={role.name} cssVar={`--${role.name}`} textVar={role.fg} note={role.note} />
          ))}
        </div>
      </KitSection>

      <KitSection
        id="contrast"
        title="Contrast"
        description="Measured in your browser from the live colors. Text needs 4.5:1, large text and interface parts such as input borders and focus rings need 3:1. Borders and dividers that only decorate are exempt."
      >
        <ContrastTable pairs={PAIRS} />
      </KitSection>

      <KitSection id="rules" title="Color rules">
        <ul className="flex max-w-prose list-disc flex-col gap-1.5 pl-5">
          <li>Use roles (<code>bg-card</code>, <code>text-muted-foreground</code>), not hex values or ramp steps.</li>
          <li>Brand olivine and brand gold are for fills and borders. For text and icons on light backgrounds use <code>text-olivine-ink</code> or <code>text-gold-ink</code>.</li>
          <li>Brand gold works as text only on burgundy, and in the logo and script title.</li>
          <li>Text transparency stops at <code>text-burg/70</code>. Anything lighter fails contrast.</li>
          <li>Never rely on color alone. Pair status colors with a word or an icon.</li>
        </ul>
      </KitSection>
    </div>
  );
}
