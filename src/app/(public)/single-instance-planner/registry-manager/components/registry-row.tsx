"use client";

import { useState } from "react";
import { ChevronDown, CirclePlus, ExternalLink, SquarePen, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import type { RegistryClaim, RegistryItem } from "../page";
import { DEMO_BASE } from "../../constants";
import Link from "next/link";

/** The placeholder the DB falls back to, reused here when a pasted image URL 404s. */
const FALLBACK_IMAGE = '/window.svg';

interface ClaimMeterProps {
  claimedTotal: number;
  quantityWanted: number;
  className?: string;
}

/** The bar plus its caption. Rendered twice — once in the row, once under it on mobile. */
function ClaimMeter({ claimedTotal, quantityWanted, className }: ClaimMeterProps) {
  const remaining = quantityWanted - claimedTotal;
  // Guard the divide: quantityWanted should never be 0, but 0/0 would render NaN.
  const percentClaimed = quantityWanted === 0
    ? 0
    : Math.min(100, (claimedTotal / quantityWanted) * 100);
  // Shouldn't happen — the actions guard both ways in — but if it ever does, say so
  // rather than clamping it out of sight where it can't be noticed or fixed.
  const isOverClaimed = remaining < 0;

  return (
    // cn, not a template string: callers pass `hidden`/`md:hidden` to place this, and
    // those collide with the `flex` below. Only tailwind-merge settles that by intent
    // rather than leaving both classes in and letting CSS source order decide.
    <div className={cn("flex flex-col gap-1", className)}>
      <Progress
        value={percentClaimed}
        aria-label={`${claimedTotal} of ${quantityWanted} claimed`}
        // Progress hardcodes bg-olivine on its indicator and only spreads className onto
        // the root, so reach the indicator through its data-slot rather than editing the
        // shared component and rippling into checklist/planner.
        className={isOverClaimed ? '**:data-[slot=progress-indicator]:bg-destructive' : ''}
      />
      <p className="text-xs text-muted">
        {claimedTotal} of {quantityWanted}
        {isOverClaimed
          ? <span className="text-destructive"> · over-claimed by {Math.abs(remaining)}</span>
          : remaining === 0
            ? <span className="text-olivine"> · fully claimed</span>
            : ` · ${remaining} remaining`}
      </p>
    </div>
  );
}

interface RegistryRowProps {
  /** The item this row renders, with its claims. */
  item: RegistryItem;
  /** Opens the edit/delete dialog for this item. */
  onEdit: (item: RegistryItem) => void;
  /** Opens the "who claimed it" dialog for this item. */
  onAddClaim: (item: RegistryItem) => void;
  /** Opens the confirm dialog for removing one claim. */
  onRemoveClaim: (claim: RegistryClaim) => void;
}

export default function RegistryRow({ item, onEdit, onAddClaim, onRemoveClaim }: RegistryRowProps) {
  // Remember *which* URL failed, not merely that one did: the row keeps its state when
  // the image is edited, so a bare boolean would condemn the replacement URL too.
  const [brokenImageSource, setBrokenImageSource] = useState<string | null>(null);

  const claimedTotal = item.claimed.reduce((sum, claim) => sum + claim.quantity, 0);
  const remaining = item.quantityWanted - claimedTotal;

  const hasUsableImage = item.image !== null && item.image !== brokenImageSource;
  const imageSource = hasUsableImage ? item.image! : FALLBACK_IMAGE;

  return (
    <Collapsible className="w-full border-b border-border last:border-b-0">
      {/** Collapsed: everything needed to answer "how many are left, and who claimed them?" */}
      <div className="flex w-full items-center gap-3 py-3 md:gap-4 md:py-4">
        {/*
          A plain <img>, not next/image: registry pictures come from whatever CDN the
          couple happened to shop at, so images.remotePatterns would have to be '**' —
          which turns /_next/image into an open resizing proxy anyone can aim anywhere.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSource}
          alt={item.name}
          loading="lazy"
          // Some retailers block hotlinking when they see a foreign referrer.
          referrerPolicy="no-referrer"
          onError={() => setBrokenImageSource(item.image)}
          className="w-14 h-14 shrink-0 rounded-sm border border-border bg-muted/10 object-contain p-1 md:w-20 md:h-20"
        />

        {/** Name, link and claimants */}
        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit max-w-full items-center gap-1 font-bold text-burg hover:text-olivine active:translate-y-px md:text-lg"
            aria-label={`${item.name} (opens in a new tab)`}
          >
            <span className="truncate">{item.name}</span>
            <ExternalLink className="w-5 h-5 ml-1 shrink-0 text-muted" />
          </a>

          {item.claimed.length === 0 ? (
            <p className="text-xs text-muted">Nobody has claimed this yet</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {item.claimed.map((claim) => (
                <Link
                  key={claim.id}
                  href={`${DEMO_BASE}/rsvp`}
                >
                  <Badge 
                    variant="outline" 
                    className="text-burg/80"
                  >
                    {claim.claimedBy}{claim.quantity > 1 && ` x${claim.quantity}`}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        <ClaimMeter
          claimedTotal={claimedTotal}
          quantityWanted={item.quantityWanted}
          className="hidden w-40 shrink-0 md:flex lg:w-56"
        />

        {/** Actions */}
        <div className="flex shrink-0 items-center">
          <Button
            variant={'ghost'}
            aria-label={`Edit ${item.name}`}
            className="text-gold/50 hover:bg-olivine hover:text-background"
            onClick={() => onEdit(item)}
          >
            <SquarePen />
          </Button>
          <CollapsibleTrigger
            className="group flex h-9 w-9 items-center justify-center rounded-sm text-burg/50 cursor-pointer hover:bg-muted/30 hover:text-burg"
            aria-label={`Manage claims for ${item.name}`}
          >
            <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </div>
      </div>

      {/** The meter column above is hidden on mobile, so fold it under the row instead. */}
      <ClaimMeter
        claimedTotal={claimedTotal}
        quantityWanted={item.quantityWanted}
        className="pb-3 md:hidden"
      />

      {/** Expanded: the management surface. Collapsed tells you who; this lets you act. */}
      <CollapsibleContent>
        <div className="flex flex-col gap-1 border-t border-border/60 bg-muted/10 px-3 py-3 md:px-4">
          {item.claimed.map((claim) => (
            <div key={claim.id} className="flex items-center gap-3 pb-1 text-sm border-b border-border">
              <span className="font-bold text-burg truncate">{claim.claimedBy}</span>
              <span className="text-muted shrink-0">×{claim.quantity}</span>
              <span className="ml-auto shrink-0 text-xs text-muted sm:inline">
                {claim.createdAt.toLocaleDateString()}
              </span>
              <Button
                variant={'ghost'}
                aria-label={`Remove ${claim.claimedBy}'s claim on ${item.name}`}
                className="h-8 w-8 shrink-0 text-muted hover:bg-destructive hover:text-white"
                onClick={() => onRemoveClaim(claim)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <div className="flex w-full justify-start">
            <Button
              variant={'ghost'}
              className="text-burg/40 hover:bg-burg hover:text-background"
              disabled={remaining <= 0}
              onClick={() => onAddClaim(item)}
            >
              <CirclePlus className="w-4 h-4" />
              {remaining <= 0 ? 'Nothing left to claim' : 'Add a claim'}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
