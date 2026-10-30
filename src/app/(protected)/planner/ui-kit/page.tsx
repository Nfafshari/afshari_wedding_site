import { Plus, SquarePen, Trash2 } from "lucide-react";

import { requireUser } from "@/lib/require-user";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import ColorSwatch from "@/components/ui-kit/color-swatch";
import DialogDemo from "@/components/ui-kit/dialog-demo";
import ContrastTable, { type ContrastPair } from "@/components/ui-kit/contrast-table";
import KitSection from "@/components/ui-kit/kit-section";
import TokenTile from "@/components/ui-kit/token-tile";
import TypeSpecimen from "@/components/ui-kit/type-specimen";

/**
 * The planner's UI kit: a living reference built from the real tokens and components, so it
 * can't drift from the code. Reachable by URL only (not in the nav). Each kit issue adds a section.
 */

const RAMPS = [
  {
    name: "Neutrals",
    steps: [
      { name: "cream-50", note: "Page canvas: off-white", textVar: "--burgundy-800" },
      { name: "stone-300", note: "Muted surfaces", textVar: "--burgundy-800" },
    ],
  },
  {
    name: "Olivine",
    steps: [
      { name: "olivine-50", note: "Input fields, sidebar", textVar: "--burgundy-800" },
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
  { name: "field", fg: "--foreground", note: "Inputs, textareas, selects" },
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
  { label: "Text in a field", foreground: "--foreground", background: "--field", kind: "text" },
  { label: "Placeholder in a field", foreground: "--muted-foreground", background: "--field", kind: "text" },
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
  { label: "Input border on field", foreground: "--input", background: "--field", kind: "ui" },
  { label: "Focus ring on page", foreground: "--ring", background: "--background", kind: "ui" },
  { label: "Badge: neutral", foreground: "--muted-foreground", background: "--neutral-soft", kind: "text" },
  { label: "Badge: success", foreground: "--olivine-ink", background: "--success-soft", kind: "text" },
  { label: "Badge: warning", foreground: "--gold-ink", background: "--warning-soft", kind: "text" },
  { label: "Badge: danger, and delete hover", foreground: "--destructive", background: "--destructive-soft", kind: "text" },
  {
    label: "Brand gold on page (script title, logo)",
    foreground: "--gold",
    background: "--background",
    kind: "large-text",
    exception: "Decorative: the couple's names and the logo. Use gold ink for any real text.",
  },
];

// Class names are written out in full so Tailwind generates them.
const TYPE_SCALE = [
  { name: "script-title", className: "script-title text-left", sample: "Piper & Nathen", spec: "Pinyon Script · 36–60px", usage: "The couple's names only." },
  { name: "page-title", className: "page-title text-left", sample: "Budget", spec: "Cormorant 600 · 36px", usage: "One per page." },
  { name: "page-subtitle", className: "page-subtitle text-left", sample: "Paid of $32,000 estimated", spec: "Cormorant 500 · 24px", usage: "The line under a page title." },
  { name: "section-title", className: "section-title", sample: "By category", spec: "Cormorant 700 · 18px", usage: "Headings inside a page." },
  { name: "stat-number", className: "stat-number", sample: "$12,400", spec: "Cormorant 700 · 48–60px, even digits", usage: "Big numbers. Set the color per use." },
  { name: "muted-caption", className: "muted-caption", sample: "Attending", spec: "Lora · 18px, uppercase", usage: "Short label under a stat, three words at most." },
  { name: "text-base", className: "text-base", sample: "Kindly respond by August 1, 2027. We can't wait to celebrate with you.", spec: "Lora 400 · 16px", usage: "Body text and paragraphs." },
  { name: "text-sm", className: "text-sm", sample: "Venue & catering · $18,500.00 · Save changes", spec: "Lora · 14px", usage: "Tables, buttons, labels, most interface text." },
  { name: "text-xs", className: "text-xs", sample: "Updated October 30, 2026", spec: "Lora · 12px", usage: "Timestamps and helper text. The smallest size we use." },
];

const RADII = [
  { name: "rounded-xs", className: "rounded-xs border bg-card", note: "Tiny details" },
  { name: "rounded-sm", className: "rounded-sm border bg-card", note: "Tags, small inline parts" },
  { name: "rounded-md", className: "rounded-md border bg-card", note: "Controls: buttons, inputs" },
  { name: "rounded-lg", className: "rounded-lg border bg-card", note: "Cards" },
  { name: "rounded-xl", className: "rounded-xl border bg-card", note: "Dialogs" },
  { name: "rounded-full", className: "rounded-full border bg-card", note: "Pills, avatars" },
];

const SHADOWS = [
  { name: "shadow-xs", className: "shadow-xs rounded-lg bg-popover", note: "Resting cards" },
  { name: "shadow-sm", className: "shadow-sm rounded-lg bg-popover", note: "Cards, hovered cards" },
  { name: "shadow-md", className: "shadow-md rounded-lg bg-popover", note: "Menus, popovers" },
  { name: "shadow-lg", className: "shadow-lg rounded-lg bg-popover", note: "Dialogs" },
  { name: "shadow-xl", className: "shadow-xl rounded-lg bg-popover", note: "Reserved" },
];

const BUTTON_VARIANTS = [
  { variant: "default", label: "Save changes", usage: "The main action. One per view." },
  { variant: "secondary", label: "Cancel", usage: "Supporting actions next to a main one." },
  { variant: "outline", label: "Pick a date", usage: "Choices, pickers and toggles (with aria-pressed)." },
  { variant: "ghost", label: "Add task", usage: "Quiet actions and edit icons. Olivine on hover." },
  { variant: "ghost-destructive", label: "Delete", usage: "Trash icons and Delete entry points. Red only on hover." },
  { variant: "destructive", label: "Delete", usage: "Confirms a delete, inside the confirm dialog." },
  { variant: "link", label: "Start over", usage: "Inline text actions." },
] as const;

const BADGE_TONES = [
  { variant: "neutral", label: "Due", usage: "No reply, not started, nothing paid" },
  { variant: "success", label: "Paid", usage: "Done, attending, approved" },
  { variant: "warning", label: "Deposit", usage: "In between, needs approval" },
  { variant: "danger", label: "Declined", usage: "Declined, rejected, failed" },
] as const;

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

      <KitSection
        id="type"
        title="Type"
        description="Cormorant for headings, titles and big numbers. Lora for everything you read or click: body, tables, forms and buttons. Pinyon only for the couple's names."
      >
        <div className="border-t">
          {TYPE_SCALE.map((row) => (
            <TypeSpecimen key={row.name} {...row} />
          ))}
        </div>
      </KitSection>

      <KitSection id="radius" title="Radius" description="Every step scales from one --radius token. Pick by what the element is, not by taste.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {RADII.map((tile) => (
            <TokenTile key={tile.name} {...tile} />
          ))}
        </div>
      </KitSection>

      <KitSection id="elevation" title="Elevation" description="Shadows are tinted with burgundy instead of grey, so they sit warmly on the off-white canvas.">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {SHADOWS.map((tile) => (
            <TokenTile key={tile.name} {...tile} />
          ))}
        </div>
      </KitSection>

      <KitSection
        id="primitives"
        title="Primitives"
        description="Pick a variant by purpose and leave colors to the component. Every control shows a solid focus ring when reached by keyboard (press Tab), and small buttons get a 44px tap area on touch screens."
      >
        <div className="flex flex-col gap-10">
          <div>
            <h3 className="mb-3 font-bold">Buttons</h3>
            <div className="flex flex-col">
              {BUTTON_VARIANTS.map(({ variant, label, usage }) => (
                <div key={variant} className="grid gap-3 border-b py-3 md:grid-cols-[14rem_1fr] md:items-center">
                  <div className="text-sm leading-tight">
                    <p className="font-mono text-xs font-bold">{variant}</p>
                    <p className="mt-1 text-burg/70">{usage}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant={variant} size="sm">{label}</Button>
                    <Button variant={variant}>{label}</Button>
                    <Button variant={variant} size="lg">{label}</Button>
                    <Button variant={variant} disabled>Disabled</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button disabled><Spinner /> Saving</Button>
              <Button variant="ghost"><Plus /> Add task</Button>
              <Button variant="ghost" size="icon-sm" aria-label="Edit (example)"><SquarePen /></Button>
              <Button variant="ghost-destructive" size="icon-sm" aria-label="Delete (example)"><Trash2 /></Button>
              <Button variant="outline" aria-pressed={false}>Not selected</Button>
              <Button variant="outline" aria-pressed>Selected</Button>
            </div>
            <p className="mt-2 text-xs text-burg/70">Loading, icon with label, icon-only (always with an aria-label), and a toggle off and on.</p>
          </div>

          <div>
            <h3 className="mb-3 font-bold">Fields</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium">Default
                <Input placeholder="Party name" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">Filled
                <Input defaultValue="The Okafor family" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">Disabled
                <Input defaultValue="Can't edit this" disabled />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">Invalid
                <Input defaultValue="not-an-email" aria-invalid />
                <span className="text-xs font-normal text-destructive">Enter an email like name@example.com.</span>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">With an addon
                <InputGroup>
                  <InputGroupAddon><InputGroupText>$</InputGroupText></InputGroupAddon>
                  <InputGroupInput placeholder="0.00" />
                </InputGroup>
              </label>
              <div className="flex flex-col gap-1.5 text-sm font-medium">Select
                <Select>
                  <SelectTrigger className="w-full" aria-label="Status (example)">
                    <SelectValue placeholder="Choose a status" />
                  </SelectTrigger>
                </Select>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">Text area
                <Textarea placeholder="Dietary notes" />
              </label>
            </div>
            <p className="mt-2 text-xs text-burg/70">Fields get their olivine fill from the component; focus turns the border burgundy. Mark errors with aria-invalid.</p>
          </div>

          <div>
            <h3 className="mb-3 font-bold">Badges</h3>
            <div className="flex flex-wrap gap-6">
              {BADGE_TONES.map(({ variant, label, usage }) => (
                <div key={variant} className="flex flex-col gap-1.5">
                  <Badge variant={variant}>{label}</Badge>
                  <p className="font-mono text-xs font-bold">{variant}</p>
                  <p className="max-w-40 text-xs text-burg/70">{usage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </KitSection>

      <KitSection
        id="modals"
        title="Modals"
        description="Forms use FormDialog: Enter submits, Esc or a click outside closes, and nothing closes while it saves. Deletes use ConfirmDialog, which only closes on Cancel or when the delete succeeds. From an edit form, the confirm opens on top and Cancel keeps your edits."
      >
        <DialogDemo />
        <ul className="mt-4 flex max-w-prose list-disc flex-col gap-1 pl-5 text-sm">
          <li>Titles are noun phrases in title case: &ldquo;Add Category&rdquo;, &ldquo;Edit Flowers&rdquo;. Confirms ask: &ldquo;Delete Flowers?&rdquo;</li>
          <li>Buttons say what happens: Add, Save changes, Delete, Remove, Import. The toast repeats the verb: &ldquo;Category added&rdquo;.</li>
          <li>Mark a field with an error using aria-invalid and put the message right under it.</li>
        </ul>
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
