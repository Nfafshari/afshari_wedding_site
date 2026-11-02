"use client";

import { useState } from "react";
import { CirclePlus, FileUp, SearchX, Users } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import PlannerPage from "@/components/planner-page";
import SearchField from "@/components/search-field";
import SegmentedFilter from "@/components/segmented-filter";
import RsvpTable from "@/components/rsvp/rsvp-table";
import RsvpStats from "@/components/rsvp/rsvp-stats";
import type { RsvpGuestRow, RsvpPartyRow } from "@/components/rsvp/types";
import type { Attendance } from "@/generated/prisma/enums";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useQueryParams } from "@/hooks/use-query-params";
import { countPartiesByFilter, filterParties, formatRsvpDeadline, getRsvpStats, isRsvpFilter, isRsvpOpen } from "@/lib/rsvp";

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

  // The query string is untrusted, so an unknown filter falls back to all.
  const { searchParams, setParams } = useQueryParams();
  const rawFilter = searchParams.get('show');
  const filter = isRsvpFilter(rawFilter) ? rawFilter : 'all';
  const query = searchParams.get('q') ?? '';
  const counts = countPartiesByFilter(invitations);
  const shownParties = filterParties(invitations, filter, query);
  // SearchField keeps its own text, so Clear filters remounts it to empty it.
  const [searchKey, setSearchKey] = useState(0);

  function clearFilters() {
    setParams((params) => {
      params.delete('show');
      params.delete('q');
    });
    setSearchKey((key) => key + 1);
  }

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
          <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <SegmentedFilter
                label="Show parties"
                param="show"
                defaultValue="all"
                options={[
                  { value: 'all', label: 'All', count: counts.all },
                  { value: 'waiting', label: 'Waiting', count: counts.waiting },
                  { value: 'attending', label: 'Attending', count: counts.attending },
                  { value: 'declined', label: 'Declined', count: counts.declined },
                  { value: 'plus-ones', label: 'Plus-one requests', count: counts['plus-ones'] },
                ]}
              />
              <SearchField key={searchKey} label="Find a guest" />
            </div>

            {shownParties.length === 0 ? (
              <EmptyState icon={SearchX} title="No parties match" message="Try another name, or show everyone.">
                <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
              </EmptyState>
            ) : (
              <RsvpTable
                parties={shownParties}
                openAll={query.trim() !== ''}
                onEditParty={onEditParty}
                onRemoveParty={onRemoveParty}
                onSetAttendance={onSetAttendance}
                onSetPlusOneStatus={onSetPlusOneStatus}
              />
            )}
          </>
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
