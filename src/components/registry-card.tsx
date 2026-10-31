"use client";

import Link from "next/link";
import { Gift } from "lucide-react";

import EmptyState from "@/components/empty-state";
import SummaryCard from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { countFullyClaimedItems, getLatestClaim } from "@/lib/registry";
import type { RegistryItem } from "../app/(protected)/planner/registry-manager/page";

interface RegistryCardProps {
  registryItems: RegistryItem[];
}

export default function RegistryCard({ registryItems }: RegistryCardProps) {
  const totalItems = registryItems.length;
  // Partly claimed is not claimed — someone still has to buy the rest. Same definition
  // the registry manager's own "Fully Claimed" stat uses.
  const claimedItems = countFullyClaimedItems(registryItems);
  const progress = totalItems === 0 ? 0 : (claimedItems / totalItems) * 100;
  const latestClaim = getLatestClaim(registryItems);

  return (
    <SummaryCard title="Registry" href="/planner/registry-manager" linkLabel="View registry">

      {totalItems === 0 ? (
        <EmptyState icon={Gift} title="Nothing on the registry yet.">
          <Button asChild variant="ghost" size="sm">
            <Link href="/planner/registry-manager">Add your first item</Link>
          </Button>
        </EmptyState>
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
            <p className="text-center text-sm text-burg/70">
              <span className="font-bold text-burg/80">{latestClaim.claimedBy}</span>
              {' claimed '}
              <span className="font-bold text-burg/80">{latestClaim.itemName}</span>
              <span className="text-burg/70"> · {latestClaim.createdAt.toLocaleDateString()}</span>
            </p>
          )}
        </div>
      )}
    </SummaryCard>
  );
}
