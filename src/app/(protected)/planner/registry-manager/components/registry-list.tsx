"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GroupedList, ListAddRow, ListCell, ListEmpty, ListGroup, ListHeadCell, ListHeader, ListRow } from "@/components/grouped-list";
import RowActionButton from "@/components/row-action-button";
import StatusChip from "@/components/status-chip";
import { claimantsLabel, getClaimedQuantity } from "@/lib/registry";
import { registryItemStatus } from "@/lib/status";
import { cn, formatDate } from "@/lib/utils";

import type { RegistryClaim, RegistryItem } from "../page";
import ItemThumbnail from "./item-thumbnail";

interface RegistryListProps {
  items: RegistryItem[];
  onEditItem: (item: RegistryItem) => void;
  onDeleteItem: (item: RegistryItem) => void;
  onAddClaim: (item: RegistryItem) => void;
  onRemoveClaim: (claim: RegistryClaim) => void;
}

/**
 * Items A to Z, each with its claims as rows. The item row answers "how many are left,
 * and who has them?"; opening it is for adding or removing a claim.
 */
export default function RegistryList ({ items, onEditItem, onDeleteItem, onAddClaim, onRemoveClaim }: RegistryListProps) {
  return (
    <GroupedList label="Registry items" columns="minmax(0,1.4fr) minmax(0,1fr) 9rem 8rem">
      <ListHeader>
        <ListHeadCell>Item</ListHeadCell>
        <ListHeadCell>Claimed by</ListHeadCell>
        <ListHeadCell>Claimed</ListHeadCell>
        <ListHeadCell>Status</ListHeadCell>
      </ListHeader>

      {items.map((item) => {
        const claimed = getClaimedQuantity(item);

        return (
          <ListGroup
            key={item.id}
            title={
              <span className="flex items-center gap-3">
                <ItemThumbnail image={item.image} />
                <span className="min-w-0 break-words">{item.name}</span>
              </span>
            }
            aside={
              <Button asChild variant="ghost" size="icon-sm" className="shrink-0">
                <a href={item.link} target="_blank" rel="noopener noreferrer" aria-label={`${item.name} product page (opens in a new tab)`}>
                  <ExternalLink />
                </a>
              </Button>
            }
            // Always a cell, even when empty, so the meter lands in its own column from md.
            meta={<ListCell className="truncate font-normal">{claimantsLabel(item.claimed)}</ListCell>}
            end={
              <>
                <ListCell className="font-normal"><ClaimMeter claimed={claimed} wanted={item.quantityWanted} /></ListCell>
                <ListCell><StatusChip status={registryItemStatus(claimed, item.quantityWanted)} /></ListCell>
              </>
            }
            actions={
              <>
                <RowActionButton action="edit" aria-label={`Edit ${item.name}`} onClick={() => onEditItem(item)} />
                <RowActionButton action="delete" aria-label={`Delete ${item.name}`} onClick={() => onDeleteItem(item)} />
              </>
            }
          >
            {item.claimed.map((claim) => (
              <ListRow
                key={claim.id}
                name={claim.claimedBy}
                meta={<ListCell>{claim.source === 'BY_HAND' ? 'Added by hand' : 'On the website'} · {formatDate(claim.createdAt)}</ListCell>}
                end={
                  <>
                    <ListCell className="lining-nums tabular-nums">×{claim.quantity}</ListCell>
                    <ListCell />
                  </>
                }
                actions={
                  <RowActionButton action="delete" aria-label={`Remove ${claim.claimedBy}'s claim on ${item.name}`} onClick={() => onRemoveClaim(claim)} />
                }
              />
            ))}
            {item.claimed.length === 0 && <ListEmpty>No claims yet.</ListEmpty>}
            <ListAddRow disabled={claimed >= item.quantityWanted} onClick={() => onAddClaim(item)}>
              {claimed >= item.quantityWanted ? 'Fully claimed' : 'Add a claim by hand'}
            </ListAddRow>
          </ListGroup>
        );
      })}
    </GroupedList>
  );
}

/** A slim bar with "1 of 2". Over-claimed shouldn't happen, but if it does it turns red and says so. */
function ClaimMeter ({ claimed, wanted }: { claimed: number; wanted: number }) {
  const isOverClaimed = claimed > wanted;
  // Guard the divide: quantityWanted should never be 0, but 0/0 would render NaN.
  const percent = wanted === 0 ? 0 : Math.min(100, (claimed / wanted) * 100);

  return (
    <div className="flex w-24 flex-col gap-1 md:w-full">
      <Progress
        value={percent}
        aria-label={`${claimed} of ${wanted} claimed`}
        // Progress only spreads className onto its root, so reach the indicator through its data-slot.
        className={cn("rounded-full", isOverClaimed && "**:data-[slot=progress-indicator]:bg-destructive")}
      />
      <span className={cn("text-sm lining-nums tabular-nums", isOverClaimed ? "text-destructive" : "text-burgundy-600")}>
        {claimed} of {wanted}{isOverClaimed && ` · over by ${claimed - wanted}`}
      </span>
    </div>
  );
}
