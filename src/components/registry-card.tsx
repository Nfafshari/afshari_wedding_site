"use client";

import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { countFullyClaimedItems, getLatestClaim } from "@/lib/registry";
import type { RegistryItem } from "../app/(protected)/planner/registry-manager/page";

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
          href={'/planner/registry-manager'}
          className="text-sm text-burg/60 underline whitespace-nowrap hover:text-burg"
        >
          View registry
        </Link>
      </div>

      {totalItems === 0 ? (
        <div className="flex flex-col flex-1 gap-3 items-center justify-center py-6">
          <p className="text-center text-sm text-burg/60">Nothing on the registry yet.</p>
          <Link
            href={'/planner/registry-manager'}
            className="text-sm underline text-burg/60 hover:text-burg"
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
