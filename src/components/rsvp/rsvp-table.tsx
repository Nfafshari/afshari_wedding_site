"use client";

import { ChevronDown, GitCommitVertical, LineDotRightHorizontal, MessageSquareText, Pencil, Trash2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Attendance } from "@/generated/prisma/enums";
import { getMembers, getPlusOnes, isCountedAttending } from "@/lib/rsvp";

import { ATTENDANCE_LABEL, AttendanceChip, PLUS_ONE_LABEL, PlusOneChip } from "./status-chips";
import type { RsvpGuestRow, RsvpHandlers, RsvpPartyRow } from "./types";

interface RsvpTableProps extends RsvpHandlers {
  parties: RsvpPartyRow[];
  /** Shown in place of the table when there are no parties in this group. */
  emptyMessage: string;
}

const ATTENDANCE_OPTIONS: Attendance[] = ['ATTENDING', 'DECLINED', 'PENDING'];

/**
 * Column sizing, shared by the heading table and every party table so they align.
 *
 * The contact column is never `hidden` on mobile. Hiding a cell removes it from
 * the row and shifts every later cell one column left, so instead its <col>
 * collapses to zero width and the cell's *content* is hidden.
 */
function RsvpColumns ({ hasActions }: { hasActions: boolean }) {
  return (
    <colgroup>
      {/* chevron */}
      <col className="w-6" />
      {/* name — wider on mobile, since contact folds into a subline beneath it */}
      <col className="w-[52%] md:w-[30%]" />
      {/* headcount (party) / status (guest) */}
      <col className="w-[40%] md:w-[20%]" />
      {/* contact (party) / dietary (guest), desktop only */}
      <col className="w-0 md:w-[34%]" />
      {/* notes */}
      <col className="w-8" />
      {/* edit / remove */}
      <col className={hasActions ? 'w-16' : 'w-0'} />
    </colgroup>
  );
}

/** "3 coming" for a party that has answered, "3 invited" for one that hasn't. */
function headcountLabel (party: RsvpPartyRow): string {
  if (party.respondedAt === null) {
    return `${getMembers(party).length} invited`;
  }

  return `${party.guests.filter(isCountedAttending).length} coming`;
}

function contactLabel (party: RsvpPartyRow): string {
  const parts = [party.email, party.phoneNumber].filter(Boolean);
  return parts.length > 0 ? parts.join(' • ') : 'No contact info';
}

export default function RsvpTable ({
  parties,
  emptyMessage,
  onEditParty,
  onRemoveParty,
  onSetAttendance,
  onSetPlusOneStatus,
}: RsvpTableProps) {
  const hasActions = onEditParty !== undefined || onRemoveParty !== undefined;

  if (parties.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      {/** custom heading */}
      <Table className="w-full table-fixed mb-1">
        <RsvpColumns hasActions={hasActions} />
        <TableHeader>
          <TableRow className="hover:bg-background border-b border-b-accent">
            <TableHead className="h-6"/>
            <TableHead className="h-6 text-xs text-accent">PARTY</TableHead>
            <TableHead className="h-6 text-xs text-accent">GUESTS</TableHead>
            <TableHead className="h-6 p-0 text-xs text-accent md:p-2"><span className="hidden md:inline">CONTACT</span></TableHead>
            <TableHead className="h-6"/>
            <TableHead className="h-6"/>
          </TableRow>
        </TableHeader>
      </Table>

      {parties.map((party) => {
        const members = getMembers(party);
        const plusOnes = getPlusOnes(party);
        const pendingPlusOnes = plusOnes.filter((guest) => guest.plusOneStatus === 'PENDING').length;
        const hasNotes = party.noteToCouple || party.songRequest;
        const guests = [...members, ...plusOnes];

        return (
          <Collapsible key={party.id}>
            <Table className="table-fixed">
              <RsvpColumns hasActions={hasActions} />
              <TableHeader>
                <TableRow className="group/category hover:bg-muted/20 has-aria-expanded:bg-muted/20">
                  <TableHead className="pt-2 w-7">
                    <CollapsibleTrigger className="group" aria-label={`Show guests in ${party.partyName}`}>
                      <ChevronDown className="w-4 h-4 group-data-[state=open]:rotate-180 transition-transform"/>
                    </CollapsibleTrigger>
                  </TableHead>
                  <TableHead className="font-bold text-lg pb-1 md:pb-0">
                    <span className="block truncate">{party.partyName}</span>
                    {/* Mobile: the contact column is collapsed, so fold it into a subline here. */}
                    <p className="text-xs font-normal text-accent-foreground truncate pb-2 md:hidden">
                      {contactLabel(party)}
                    </p>
                  </TableHead>
                  <TableHead className="font-bold text-base pb-1 md:pb-0">
                    <div className="flex flex-wrap items-center gap-1">
                      <span>{headcountLabel(party)}</span>
                      {pendingPlusOnes > 0 && <PlusOneChip status="PENDING" className="font-normal" />}
                    </div>
                  </TableHead>
                  <TableHead className="p-0 font-normal pb-1 md:p-2 md:pb-0">
                    <span className="hidden truncate md:block">{contactLabel(party)}</span>
                  </TableHead>
                  <TableHead className="p-0">
                    {hasNotes && (
                      <Popover>
                        <PopoverTrigger aria-label={`Notes from ${party.partyName}`}>
                          <MessageSquareText className="w-5 h-5 cursor-pointer hover:text-gold"/>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                          <div className="flex flex-col gap-2 px-1 py-1 text-sm">
                            {party.noteToCouple && (
                              <div>
                                <h4 className="font-bold">Note from {party.respondedByName ?? party.partyName}</h4>
                                <p className="mt-1 px-2 py-2 rounded-xs border border-border/70 bg-muted/5 whitespace-pre-wrap">{party.noteToCouple}</p>
                              </div>
                            )}
                            {party.songRequest && (
                              <div>
                                <h4 className="font-bold">Song request</h4>
                                <p className="mt-1">{party.songRequest}</p>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </TableHead>
                  <TableHead className="p-0">
                    {hasActions && (
                      <div className="flex justify-end">
                        {onEditParty && (
                          <Button variant={'ghost'} size={'icon-sm'} aria-label={`Edit ${party.partyName}`} onClick={() => onEditParty(party)}>
                            <Pencil />
                          </Button>
                        )}
                        {onRemoveParty && (
                          <Button variant={'ghost'} size={'icon-sm'} className="hover:text-destructive" aria-label={`Remove ${party.partyName}`} onClick={() => onRemoveParty(party)}>
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <CollapsibleContent asChild>
                <TableBody className="last:border-b-2 border-burg">
                  {guests.map((guest, idx) => (
                    <GuestRow
                      key={guest.id}
                      guest={guest}
                      isLast={idx === guests.length - 1}
                      onSetAttendance={onSetAttendance}
                      onSetPlusOneStatus={onSetPlusOneStatus}
                    />
                  ))}
                  {party.respondedAt && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell/>
                      {/* pl-8 lines this up with the guest names, which sit after a tree icon. */}
                      <TableCell colSpan={5} className="pt-1 pb-3 pl-8 text-xs text-muted-foreground whitespace-normal">
                        Responded {party.respondedByName ? `by ${party.respondedByName} ` : ''}on {party.respondedAt.toLocaleDateString()}
                        {party.plusOnesAllowed > 0 && ` · ${party.plusOnesAllowed} plus-one${party.plusOnesAllowed === 1 ? '' : 's'} allowed`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </CollapsibleContent>
            </Table>
          </Collapsible>
        );
      })}
    </>
  );
}

interface GuestRowProps extends Pick<RsvpHandlers, 'onSetAttendance' | 'onSetPlusOneStatus'> {
  guest: RsvpGuestRow;
  isLast: boolean;
}

function GuestRow ({ guest, isLast, onSetAttendance, onSetPlusOneStatus }: GuestRowProps) {
  return (
    <TableRow>
      <TableCell/>
      <TableCell className="font-bold text-lg pb-1">
        <div className="flex items-center">
          {isLast ? (
            <LineDotRightHorizontal strokeWidth={2} className="h-5 mb-2 rotate-90 text-muted shrink-0" />
          ) : (
            <GitCommitVertical strokeWidth={2} className="h-5 text-muted shrink-0" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="truncate">
              {guest.name}
              {guest.isPlusOne && <span className="ml-2 text-xs font-normal text-accent-foreground">plus-one</span>}
            </span>
            {/* Mobile: the dietary column is collapsed, so fold it into a subline. */}
            {guest.dietary && (
              <p className="text-xs font-normal text-accent-foreground truncate md:hidden">{guest.dietary}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {guest.isPlusOne ? (
          guest.plusOneStatus && (
            onSetPlusOneStatus ? (
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
                    {guest.plusOneStatus === 'PENDING' && (
                      <SelectItem value="PENDING" disabled>{PLUS_ONE_LABEL.PENDING}</SelectItem>
                    )}
                    <SelectItem value="APPROVED">{PLUS_ONE_LABEL.APPROVED}</SelectItem>
                    <SelectItem value="REJECTED">{PLUS_ONE_LABEL.REJECTED}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <PlusOneChip status={guest.plusOneStatus} />
            )
          )
        ) : onSetAttendance ? (
          <Select
            value={guest.attendance}
            onValueChange={(value: Attendance) => onSetAttendance(guest, value)}
          >
            <SelectTrigger size="sm" aria-label={`Attendance for ${guest.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ATTENDANCE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{ATTENDANCE_LABEL[option]}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : (
          <AttendanceChip attendance={guest.attendance} />
        )}
      </TableCell>
      <TableCell className="p-0 md:p-2">
        <span className="hidden truncate text-sm md:block">{guest.dietary ?? <span className="text-muted">No dietary notes</span>}</span>
      </TableCell>
      <TableCell/>
      <TableCell/>
    </TableRow>
  );
}
