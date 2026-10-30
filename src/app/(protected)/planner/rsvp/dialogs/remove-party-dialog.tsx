"use client";

import ConfirmDialog from "@/components/confirm-dialog";
import { deleteInvitation, type ErrorField } from "../action";
import type { Invitations } from "../page";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

interface RemovePartyDialogProps {
  /** The party to delete. */
  partyToRemove: Invitations | undefined;
  /** Called after the party is deleted so the parent can close the dialog. */
  onSuccess: () => void;
  /** Called when the user backs out. */
  onCancel: () => void;
}

export default function RemovePartyDialog({ partyToRemove, onSuccess, onCancel }: RemovePartyDialogProps) {
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={`Remove ${partyToRemove?.partyName}?`}
      description={
        <>
          This takes {partyToRemove?.partyName} off the guest list
          {partyToRemove?.respondedAt
            ? ', along with the response they already sent and any plus-ones they named'
            : ''}
          . They won&apos;t be able to find their invitation on the RSVP page. You can&apos;t undo this.
        </>
      }
      confirmLabel="Remove"
      isLoading={isLoading}
      error={serverError || undefined}
      onConfirm={() => runAction("Party removed", () => deleteInvitation(partyToRemove?.id))}
    />
  );
}
