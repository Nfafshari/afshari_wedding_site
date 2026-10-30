"use client";

import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteInvitation, type ErrorField } from "../action";
import type { Invitations } from "../page";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

interface RemovePartyDialogProps {
  /** The party to delete. */
  partyToRemove: Invitations | undefined;
  /** Called after the party is deleted so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function RemovePartyDialog({ partyToRemove, onSuccess }: RemovePartyDialogProps) {
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  async function removeParty (event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    await runAction("Party removed", () => deleteInvitation(partyToRemove?.id));
  }

  return (
    <AlertDialogContent id="remove-party-dialog" className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full text-destructive">
          Remove <span className="font-bold">{partyToRemove?.partyName}</span>?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-destructive">
          This takes {partyToRemove?.partyName} off the guest list
          {partyToRemove?.respondedAt
            ? ', along with the response they already sent and any plus-ones they named'
            : ''}
          . They will no longer be able to find their invitation on the RSVP page. This cannot be
          undone. Do you wish to continue?
        </AlertDialogDescription>
        {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
        <AlertDialogCancel variant={'secondary'} className="hover:bg-gold/90">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className={isLoading ? 'bg-destructive/30!' : 'bg-destructive! text-destructive-foreground hover:bg-destructive/90!'}
          onClick={removeParty}
        >
          {isLoading ? <Spinner /> : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
