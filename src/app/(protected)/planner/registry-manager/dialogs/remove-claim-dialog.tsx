"use client";

import ConfirmDialog from "@/components/confirm-dialog";
import { deleteRegistryClaim, type ErrorField } from "../action";
import type { RegistryClaim } from "../page";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

interface RemoveClaimDialogProps {
  /** The claim to delete. */
  claimToRemove: RegistryClaim | undefined;
  /** Called after the claim is deleted so the parent can close the dialog. */
  onSuccess: () => void;
  /** Called when the user backs out. */
  onCancel: () => void;
}

export default function RemoveClaimDialog({ claimToRemove, onSuccess, onCancel }: RemoveClaimDialogProps) {
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={`Remove ${claimToRemove?.claimedBy}'s claim?`}
      description={`This frees up ${claimToRemove?.quantity} of this item for someone else. You can't undo this.`}
      confirmLabel="Remove"
      isLoading={isLoading}
      error={serverError || undefined}
      onConfirm={() => runAction("Claim removed", () => deleteRegistryClaim(claimToRemove?.id))}
    />
  );
}
