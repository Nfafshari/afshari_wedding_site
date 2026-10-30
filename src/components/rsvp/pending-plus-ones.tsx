"use client";

import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RsvpHandlers, RsvpPartyRow } from "./types";

interface PendingPlusOnesProps {
  parties: RsvpPartyRow[];
  onSetPlusOneStatus?: RsvpHandlers['onSetPlusOneStatus'];
}

/**
 * Plus-ones guests have named that the couple has not ruled on yet. Renders
 * nothing when the queue is empty, so it only takes up room when there is work.
 */
export default function PendingPlusOnes ({ parties, onSetPlusOneStatus }: PendingPlusOnesProps) {
  const pending = parties.flatMap((party) =>
    party.guests
      .filter((guest) => guest.isPlusOne && guest.plusOneStatus === 'PENDING')
      .map((guest) => ({ guest, party }))
  );

  if (pending.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <h3 className="text-xl font-bold text-left text-gold-ink">PLUS-ONES AWAITING APPROVAL</h3>
      <ul className="flex flex-col mt-2 border-y border-accent divide-y divide-accent/50">
        {pending.map(({ guest, party }) => (
          <li key={guest.id} className="flex items-center gap-3 py-2 px-2">
            <div className="flex flex-col min-w-0">
              <p className="font-bold text-lg truncate">{guest.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                with {party.partyName}
                {guest.dietary ? ` · ${guest.dietary}` : ''}
              </p>
            </div>
            {onSetPlusOneStatus && (
              <div className="flex gap-2 ml-auto shrink-0">
                <Button
                  size={'sm'}
                  variant={'outline'}
                  onClick={() => onSetPlusOneStatus(guest, 'APPROVED')}
                >
                  <Check /> Approve
                </Button>
                <Button
                  size={'sm'}
                  variant={'ghost-destructive'}
                  onClick={() => onSetPlusOneStatus(guest, 'REJECTED')}
                >
                  <X /> Reject
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
