"use client";

import { useState } from "react";
import { CirclePlus, FileUp, Users } from "lucide-react";

import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import RsvpTable from "@/components/rsvp/rsvp-table";
import RsvpStats from "@/components/rsvp/rsvp-stats";
import PendingPlusOnes from "@/components/rsvp/pending-plus-ones";
import type { RsvpGuestRow, RsvpPartyRow } from "@/components/rsvp/types";
import type { Attendance } from "@/generated/prisma/enums";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { getPartyGroup, getRsvpStats } from "@/lib/rsvp";

import { setAttendance, setPlusOneStatus, type ErrorField } from "./action";
import PartyDialog from "./dialogs/party-dialog";
import RemovePartyDialog from "./dialogs/remove-party-dialog";
import ImportGuestsDialog from "./dialogs/import-guests-dialog";
import type { Invitations } from "./page";

interface RsvpProps {
  invitations: Invitations[];
}

enum DialogType {
  None = 'none',
  AddParty = 'addParty',
  EditParty = 'editParty',
  RemoveParty = 'removeParty',
  ImportGuests = 'importGuests',
}

export default function Rsvp({ invitations }: RsvpProps) {
  /** States */
  const [activeDialog, setActiveDialog] = useState<DialogType>(DialogType.None);
  const [activePartyId, setActivePartyId] = useState<number | undefined>(undefined);

  // The inline selects and approve buttons have no dialog to close, but they still
  // want the same toast + expired-session handling every dialog gets.
  const { runAction } = useDialogSubmit<ErrorField>(() => { });

  // Looked up by id rather than held in state, so a dialog always edits the
  // current row after a revalidation rather than a stale copy of it.
  const activeParty = invitations.find((invitation) => invitation.id === activePartyId);

  const stats = getRsvpStats(invitations);
  const attending = invitations.filter((invitation) => getPartyGroup(invitation) === 'attending');
  const declined = invitations.filter((invitation) => getPartyGroup(invitation) === 'declined');
  const awaiting = invitations.filter((invitation) => getPartyGroup(invitation) === 'awaiting');

  // Close any open dialog. Each dialog owns its own form state, so unmounting it resets that state.
  function closeDialog() {
    setActiveDialog(DialogType.None);
    setActivePartyId(undefined);
  }

  function onEditParty(party: RsvpPartyRow) {
    setActivePartyId(party.id);
    setActiveDialog(DialogType.EditParty);
  }

  function onRemoveParty(party: RsvpPartyRow) {
    setActivePartyId(party.id);
    setActiveDialog(DialogType.RemoveParty);
  }

  function onSetAttendance(guest: RsvpGuestRow, attendance: Attendance) {
    runAction(`${guest.name} updated`, () => setAttendance(guest.id, attendance));
  }

  function onSetPlusOneStatus(guest: RsvpGuestRow, status: 'APPROVED' | 'REJECTED') {
    runAction(
      status === 'APPROVED' ? `${guest.name} approved` : `${guest.name} rejected`,
      () => setPlusOneStatus(guest.id, status)
    );
  }

  const handlers = { onEditParty, onRemoveParty, onSetAttendance, onSetPlusOneStatus };

  return (
    <AlertDialog
      open={activeDialog !== DialogType.None}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          closeDialog();
        }
      }}
    >
      <div className="relative w-full min-h-full bg-background font-sans text-burg px-6 pb-10 md:py-2 md:px-12 lg:px-16">
        {/** title */}
        <div className="flex flex-col w-full md:flex-row">
          <h1 className="page-title w-full text-center translate-y-3 md:text-start">RSVP Tracker</h1>
          <div className="flex flex-col mt-4 md:w-1/2 md:ml-auto md:mt-0">
            <h2 className="page-title text-xl text-center md:text-2xl md:text-end">{stats.respondedParties} of {invitations.length} Parties Responded</h2>
            <h3 className="section-title text-sm text-center md:text-end">{stats.invited} Guests Invited</h3>
          </div>
        </div>
        <hr className="mb-5 mt-2 bg-accent md:my-5" />

        <RsvpStats stats={stats} />
        <hr className="mb-5 mt-2 bg-accent md:my-5" />

        {invitations.length === 0 ? (
          <div className="flex flex-col w-full items-center justify-center gap-2 py-16 text-center text-burg/70">
            <Users className="w-12 h-12 text-gold/50" strokeWidth={1} />
            <h2 className="page-subtitle text-lg md:text-2xl">No one on the guest list yet</h2>
            <p className="text-sm text-muted">Add a party below, or import your whole list from a CSV.</p>
          </div>
        ) : (
          <>
            <PendingPlusOnes parties={invitations} onSetPlusOneStatus={onSetPlusOneStatus} />

            <h3 className="text-xl font-bold text-left text-olivine-ink">ATTENDING</h3>
            <RsvpTable parties={attending} emptyMessage="No one has said yes yet." {...handlers} />

            <h3 className="text-xl font-bold text-left text-destructive mt-10">DECLINED</h3>
            <RsvpTable parties={declined} emptyMessage="No one has declined." {...handlers} />

            <h3 className="text-xl font-bold text-left text-burg/70 mt-10">AWAITING RESPONSE</h3>
            <RsvpTable parties={awaiting} emptyMessage="Everyone has responded!" {...handlers} />
          </>
        )}

        {/** Add / import buttons at the end of the list */}
        <div className="flex w-full justify-start gap-2 mt-4">
          <Button
            variant={'ghost'}
            className="ml-5"
            onClick={() => {
              setActiveDialog(DialogType.AddParty);
            }}
          >
            Add Party
            <CirclePlus />
          </Button>
          <Button
            variant={'ghost'}
            onClick={() => {
              setActiveDialog(DialogType.ImportGuests);
            }}
          >
            Import CSV
            <FileUp />
          </Button>
        </div>
      </div>

      {activeDialog === DialogType.AddParty &&
        <PartyDialog
          invitations={invitations}
          onSuccess={closeDialog}
        />
      }

      {activeDialog === DialogType.EditParty &&
        <PartyDialog
          invitations={invitations}
          partyToUpdate={activeParty}
          onSuccess={closeDialog}
        />
      }

      {activeDialog === DialogType.ImportGuests &&
        <ImportGuestsDialog
          onSuccess={closeDialog}
        />
      }

      {activeDialog === DialogType.RemoveParty &&
        <RemovePartyDialog
          partyToRemove={activeParty}
          onSuccess={closeDialog}
        />
      }
    </AlertDialog>
  );
}
