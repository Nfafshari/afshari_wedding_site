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

import { type ErrorField } from "../action";
import { useDemoPlanner } from "../../demo-store";
import type { RegistryClaim } from "../page";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

interface RemoveClaimDialogProps {
  /** The claim to delete. */
  claimToRemove: RegistryClaim | undefined;
  /** Called after the claim is deleted so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function RemoveClaimDialog({ claimToRemove, onSuccess }: RemoveClaimDialogProps) {
  const { deleteRegistryClaim } = useDemoPlanner();
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  async function removeClaim (event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    await runAction("Claim removed", () => deleteRegistryClaim(claimToRemove?.id));
  }

  return (
    <AlertDialogContent id="remove-claim-dialog" className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full text-destructive">
          Remove <span className="font-bold">{claimToRemove?.claimedBy}</span>&apos;s claim?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-destructive">
          You are about to remove {claimToRemove?.claimedBy}&apos;s claim on {claimToRemove?.quantity} of
          this item, freeing it back up for someone else. This cannot be undone. Do you wish to continue?
        </AlertDialogDescription>
        {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
        <AlertDialogCancel variant={'secondary'} className="hover:bg-gold/90">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className={isLoading ? 'bg-destructive/30!' : 'bg-destructive! text-white hover:bg-destructive/90!'}
          onClick={removeClaim}
        >
          {isLoading ? <Spinner /> : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
