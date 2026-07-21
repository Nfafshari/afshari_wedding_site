"use client";

/**
 * Demo fork of `src/components/registry-card.tsx`. Identical rendering; the only
 * differences are the type source (demo-types, not the real registry page) and the
 * links, which stay inside the demo tree. Fixes to the real card do not reach this
 * one — keep the two in step by hand.
 */

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { countFullyClaimedItems, getLatestClaim } from "@/lib/registry";
import type { RegistryItem } from "../demo-types";
import { DEMO_BASE } from "../constants";

interface RegistryCardProps {
  registryItems: RegistryItem[];
}

export default function RegistryCard ({ registryItems }: RegistryCardProps) {
  const totalItems = registryItems.length;
  // Partly claimed is not claimed — someone still has to buy the rest. Same definition
  // the registry manager's own "Fully Claimed" stat uses.
  const claimedItems = countFullyClaimedItems(registryItems);
  const progress = totalItems === 0 ? 0 : (claimedItems / totalItems) * 100;
  const latestClaim = getLatestClaim(registryItems);

  return (
    <div className="flex flex-col gap-3 p-4 border border-burg/8 rounded-lg bg-olivine/15">
      <div className="flex items-baseline justify-between gap-2">
        <p className="section-title pr-2">Registry Manager</p>
        <Link
          href={`${DEMO_BASE}/registry-manager`}
          className="inline-flex items-center gap-0.5 text-sm text-burg/60 whitespace-nowrap rounded-sm hover:text-burg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="underline">View registry</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {totalItems === 0 ? (
        <div className="flex flex-col flex-1 gap-3 items-center justify-center py-6">
          <p className="text-center text-sm text-burg/60">Nothing on the registry yet.</p>
          <Link
            href={`${DEMO_BASE}/registry-manager`}
            className="text-sm underline text-burg/60 rounded-sm hover:text-burg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Add your first item
          </Link>
        </div>
      ) : (
        <div className="flex flex-col flex-1 gap-4 justify-center">
          <div className="flex flex-col items-center">
            <p className="stat-number">{claimedItems}</p>
            <p className="muted-caption text-base">Claimed of {totalItems}</p>
          </div>

          {/* A ratio against a limit is a meter, not a chart. Matches the checklist
              progress bar at the top of this page. */}
          <Progress
            value={progress}
            aria-label={`${claimedItems} of ${totalItems} items fully claimed`}
          />

          {latestClaim && (
            <p className="text-center text-sm text-burg/60">
              <span className="font-bold text-burg/80">{latestClaim.claimedBy}</span>
              {' claimed '}
              <span className="font-bold text-burg/80">{latestClaim.itemName}</span>
              <span className="text-burg/40"> · {latestClaim.createdAt.toLocaleDateString()}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
