"use client";

import { Check, MessageSquareText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GroupedList, ListCell, ListGroup, ListHeadCell, ListHeader, ListRow } from "@/components/grouped-list";
import RowActionButton from "@/components/row-action-button";
import StatusChip from "@/components/status-chip";
import type { Attendance } from "@/generated/prisma/enums";
import { getMembers, getPartyGroup, getPlusOnes, partyHeadcountLabel } from "@/lib/rsvp";
import { ATTENDANCE_STATUS, PARTY_STATUS, PLUS_ONE_STATUS } from "@/lib/status";
import { formatDate } from "@/lib/utils";

import type { RsvpGuestRow, RsvpHandlers, RsvpPartyRow } from "./types";

interface RsvpTableProps extends RsvpHandlers {
  parties: RsvpPartyRow[];
}

const ATTENDANCE_OPTIONS: Attendance[] = ['ATTENDING', 'DECLINED', 'PENDING'];

function contactLabel (party: RsvpPartyRow): string | null {
  const parts = [party.email, party.phoneNumber].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function hasNotes (party: RsvpPartyRow): boolean {
  return Boolean(party.noteToCouple || party.songRequest);
}

function hasPendingPlusOne (party: RsvpPartyRow): boolean {
  return getPlusOnes(party).some((guest) => guest.plusOneStatus === 'PENDING');
}

/**
 * Every party in one list, A to Z, with its guests as rows. The details column holds
 * a party's contact and notes, and a guest's dietary notes. A party with a plus-one to review
 * starts open, so the Approve and Reject buttons are already in view.
 */
export default function RsvpTable ({ parties, onEditParty, onRemoveParty, onSetAttendance, onSetPlusOneStatus }: RsvpTableProps) {
  const sorted = parties.toSorted((a, b) => a.partyName.localeCompare(b.partyName));

  return (
    <GroupedList label="Guest list by party" columns="minmax(0,1fr) minmax(0,1fr) 10rem">
      <ListHeader>
        <ListHeadCell>Party</ListHeadCell>
        <ListHeadCell>Details</ListHeadCell>
        <ListHeadCell>Status</ListHeadCell>
      </ListHeader>

      {sorted.map((party) => {
        const guests = [...getMembers(party), ...getPlusOnes(party)];
        const contact = contactLabel(party);

        return (
          <ListGroup
            key={party.id}
            title={party.partyName}
            defaultOpen={hasPendingPlusOne(party)}
            // Always a cell, even when empty, so the status lands in its own column from md.
            meta={
              <ListCell className="flex min-w-0 items-center gap-1 font-normal">
                {contact && <span className="truncate">{contact}</span>}
                <PartyNotes party={party} />
              </ListCell>
            }
            end={
              <ListCell className="flex flex-col items-end gap-0.5 font-normal md:items-start">
                <StatusChip status={PARTY_STATUS[getPartyGroup(party)]} />
                <span className="text-sm text-burgundy-600">{partyHeadcountLabel(party)}</span>
              </ListCell>
            }
            actions={
              <>
                <RowActionButton action="edit" aria-label={`Edit ${party.partyName}`} onClick={() => onEditParty(party)} />
                <RowActionButton action="delete" aria-label={`Remove ${party.partyName}`} onClick={() => onRemoveParty(party)} />
              </>
            }
          >
            {guests.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                onSetAttendance={onSetAttendance}
                onSetPlusOneStatus={onSetPlusOneStatus}
              />
            ))}
            {party.respondedAt && (
              <div role="row" className="border-b">
                <div role="cell" className="py-2.5 pl-14 text-sm text-burgundy-600">
                  Responded {party.respondedByName ? `by ${party.respondedByName} ` : ''}on {formatDate(party.respondedAt)}
                  {party.plusOnesAllowed > 0 && ` · ${party.plusOnesAllowed} plus-one${party.plusOnesAllowed === 1 ? '' : 's'} allowed`}
                </div>
              </div>
            )}
          </ListGroup>
        );
      })}
    </GroupedList>
  );
}

/** The note to the couple and the song request, behind an icon after the contact details. */
function PartyNotes ({ party }: { party: RsvpPartyRow }) {
  if (!hasNotes(party)) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="-my-1 shrink-0" aria-label={`Notes from ${party.partyName}`}>
          <MessageSquareText />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-2 px-1 py-1 text-sm font-normal">
          {party.noteToCouple && (
            <div>
              <h4 className="font-semibold">Note from {party.respondedByName ?? party.partyName}</h4>
              <p className="mt-1 whitespace-pre-wrap">{party.noteToCouple}</p>
            </div>
          )}
          {party.songRequest && (
            <div>
              <h4 className="font-semibold">Song request</h4>
              <p className="mt-1">{party.songRequest}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface GuestRowProps extends Pick<RsvpHandlers, 'onSetAttendance' | 'onSetPlusOneStatus'> {
  guest: RsvpGuestRow;
}

/**
 * A member's status is the attendance dropdown, so the couple can mark someone by hand.
 * A plus-one waiting on the couple gets Approve and Reject in the row; once decided,
 * the dropdown lets them change their mind.
 */
function GuestRow ({ guest, onSetAttendance, onSetPlusOneStatus }: GuestRowProps) {
  const isPending = guest.isPlusOne && guest.plusOneStatus === 'PENDING';

  return (
    <ListRow
      name={
        <span className="break-words">
          {guest.name}
          {guest.isPlusOne && <span className="ml-2 text-sm text-burgundy-600">Plus-one</span>}
        </span>
      }
      meta={<ListCell className="truncate">{guest.dietary}</ListCell>}
      end={
        <ListCell>
          {!guest.isPlusOne && (
            <Select value={guest.attendance} onValueChange={(value: Attendance) => onSetAttendance(guest, value)}>
              <SelectTrigger size="sm" aria-label={`Attendance for ${guest.name}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ATTENDANCE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{ATTENDANCE_STATUS[option].label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          {isPending && <StatusChip status={PLUS_ONE_STATUS.PENDING} />}
          {guest.isPlusOne && !isPending && guest.plusOneStatus && (
            <Select
              value={guest.plusOneStatus}
              onValueChange={(value: 'APPROVED' | 'REJECTED') => onSetPlusOneStatus(guest, value)}
            >
              <SelectTrigger size="sm" aria-label={`Plus-one status for ${guest.name}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {/* PENDING is only ever set by the guest, so it isn't offered here. */}
                  <SelectItem value="APPROVED">{PLUS_ONE_STATUS.APPROVED.label}</SelectItem>
                  <SelectItem value="REJECTED">{PLUS_ONE_STATUS.REJECTED.label}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </ListCell>
      }
      actions={isPending && (
        <>
          <Button variant="ghost" size="icon-sm" aria-label={`Approve ${guest.name}`} title="Approve" onClick={() => onSetPlusOneStatus(guest, 'APPROVED')}>
            <Check />
          </Button>
          <Button variant="ghost-destructive" size="icon-sm" aria-label={`Reject ${guest.name}`} title="Reject" onClick={() => onSetPlusOneStatus(guest, 'REJECTED')}>
            <X />
          </Button>
        </>
      )}
    />
  );
}
