"use client";

import { useState } from "react";
import { CircleCheck, ExternalLink, Gift } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { REGISTRY } from "@/lib/guest-content";
import { cn } from "@/lib/utils";

import { claimRegistryItem } from "./action";

/** What guests see of an item: counts only, never who claimed it. */
export type PublicRegistryItem = {
  id: number;
  name: string;
  link: string;
  image: string | null;
  quantityWanted: number;
  claimedCount: number;
};

// The guest site's deep-olive button, as on the RSVP page.
const PRIMARY = "guest-label inline-flex items-center justify-center gap-2 rounded-sm bg-olivine-ink px-8 py-3 text-cream hover:bg-olivine-ink/85 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const TEXT_LINK = "guest-label inline-flex items-center gap-1.5 rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Claimed = { itemName: string; quantity: number };

export default function RegistryList({ items }: { items: PublicRegistryItem[] }) {
  // Remembered for the visit, so a second claim only asks how many.
  const [name, setName] = useState("");
  const [active, setActive] = useState<PublicRegistryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<{ message: string; field?: "name" | "quantity" } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [claimed, setClaimed] = useState<Claimed | null>(null);
  // Store images are links to other sites and can break; those show the gift icon instead.
  const [brokenImages, setBrokenImages] = useState<Set<number>>(() => new Set());

  function open (item: PublicRegistryItem) {
    setActive(item);
    setQuantity(1);
    setError(null);
    setClaimed(null);
  }

  async function claim () {
    if (active === null) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await claimRegistryItem(name, active.id, quantity);
      if (result.ok) {
        setClaimed({ itemName: active.name, quantity: result.quantity });
      } else {
        setError({ message: result.error, field: result.field });
      }
    } catch (err) {
      // A rejection means the call never completed (dropped connection, deploy).
      console.error(`*ERROR - registry claim failed to complete, see below:\n${err}`);
      setError({ message: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  const remaining = active ? active.quantityWanted - active.claimedCount : 0;

  return (
    <>
      <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const left = item.quantityWanted - item.claimedCount;
          const isFull = left <= 0;
          return (
            <li key={item.id} className={cn("flex flex-col items-center text-center", isFull && "opacity-60")}>
              <div className="flex aspect-square w-full items-center justify-center rounded-sm border border-gold/50 bg-popover p-6">
                {item.image && !brokenImages.has(item.id) ? (
                  // Plain <img>, like the planner: images are links to any store's site.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImages((prev) => new Set(prev).add(item.id))}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Gift strokeWidth={1} className="size-16 text-gold-ink" aria-hidden />
                )}
              </div>
              <h2 className="guest-display mt-5 text-xl">{item.name}</h2>
              <p className="mt-1 text-sm text-burg/70">
                {isFull ? REGISTRY.fullyClaimed : item.quantityWanted > 1 ? `${item.claimedCount} of ${item.quantityWanted} claimed` : "Not yet claimed"}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
                  {REGISTRY.viewItem}
                  <ExternalLink className="size-3.5" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                {!isFull && (
                  <button type="button" className={cn(PRIMARY, "px-6 py-2.5")} onClick={() => open(item)}>
                    {REGISTRY.claim}
                    <span className="sr-only"> {item.name}</span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={active !== null} onOpenChange={(isOpen) => { if (!isOpen) setActive(null); }}>
        <DialogContent className="rounded-sm border-gold/60 bg-popover p-8 font-guest outline outline-gold/30 -outline-offset-8 sm:max-w-md">
          {claimed ? (
            <div className="flex flex-col items-center text-center">
              <CircleCheck className="size-10 text-olivine-ink" strokeWidth={1.5} aria-hidden />
              <DialogTitle className="guest-display mt-3 text-2xl">{REGISTRY.thanks}</DialogTitle>
              <DialogDescription className="mt-2 text-burg">
                You claimed {claimed.quantity > 1 ? `${claimed.quantity} of ` : ""}{claimed.itemName}.
              </DialogDescription>
              <p className="mt-3 text-sm text-burg/70">{REGISTRY.changedMind}</p>
            </div>
          ) : (
            <form
              className="flex flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                claim();
              }}
            >
              <div className="text-center">
                <DialogTitle className="guest-display text-2xl">{REGISTRY.dialogTitle}</DialogTitle>
                <DialogDescription className="mt-1 text-burg/70">{active?.name}</DialogDescription>
              </div>
              <Field>
                <FieldLabel htmlFor="registry-name">{REGISTRY.nameLabel}</FieldLabel>
                <Input
                  id="registry-name"
                  type="text"
                  autoComplete="name"
                  className="h-10"
                  value={name}
                  aria-invalid={error?.field === "name"}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                />
              </Field>
              {remaining > 1 && (
                <Field>
                  <FieldLabel htmlFor="registry-quantity">{REGISTRY.quantityLabel} (up to {remaining})</FieldLabel>
                  <Input
                    id="registry-quantity"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={remaining}
                    step={1}
                    className="h-10 w-28"
                    value={quantity}
                    aria-invalid={error?.field === "quantity"}
                    onChange={(e) => {
                      setQuantity(e.target.valueAsNumber);
                      setError(null);
                    }}
                  />
                </Field>
              )}
              {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
              <button type="submit" disabled={isLoading || name.trim() === ""} className={cn(PRIMARY, "w-full")}>
                {isLoading ? <Spinner /> : REGISTRY.submit}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
