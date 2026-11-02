"use client";

import { useState } from "react";
import { CirclePlus, FileUp, Users } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import PlannerPage from "@/components/planner-page";
import RsvpTable from "@/components/rsvp/rsvp-table";
import RsvpStats from "@/components/rsvp/rsvp-stats";
import type { RsvpGuestRow, RsvpPartyRow } from "@/components/rsvp/types";
import type { Attendance } from "@/generated/prisma/enums";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { formatRsvpDeadline, getRsvpStats, isRsvpOpen } from "@/lib/rsvp";

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

  return (
    <Dialog
      // Form dialogs share this root. Delete confirmations bring their own (ConfirmDialog).
      open={activeDialog !== DialogType.None && activeDialog !== DialogType.RemoveParty}
      onOpenChange={(open) => {
        // Radix calls this with the *next* open state. Only act on close.
        if (!open) {
          closeDialog();
        }
      }}
    >
      <PlannerPage>
        <PageHeader
          title="RSVPs"
          subtitle={`${isRsvpOpen() ? 'RSVPs close' : 'RSVPs closed'} ${formatRsvpDeadline()}`}
          actions={
            <>
              <Button onClick={() => setActiveDialog(DialogType.AddParty)}>
                <CirclePlus />
                Add party
              </Button>
              <Button variant="secondary" onClick={() => setActiveDialog(DialogType.ImportGuests)}>
                <FileUp />
                Import
              </Button>
            </>
          }
        />

        <RsvpStats stats={stats} />
        <hr className="my-5 bg-accent" />

        {invitations.length === 0 ? (
          <EmptyState
            size="page"
            icon={Users}
            title="No one on the guest list yet"
            message="Add a party, or import your whole list from a CSV."
          >
            <Button onClick={() => setActiveDialog(DialogType.AddParty)}>
              <CirclePlus />
              Add party
            </Button>
          </EmptyState>
        ) : (
          <RsvpTable
            parties={invitations}
            onEditParty={onEditParty}
            onRemoveParty={onRemoveParty}
            onSetAttendance={onSetAttendance}
            onSetPlusOneStatus={onSetPlusOneStatus}
          />
        )}
      </PlannerPage>

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
          onCancel={closeDialog}
        />
      }
    </Dialog>
  );
}
