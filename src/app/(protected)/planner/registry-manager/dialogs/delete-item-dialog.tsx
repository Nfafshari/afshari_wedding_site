"use client";

import ConfirmDialog from "@/components/confirm-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { deleteRegistryItem, type ErrorField } from "../action";
import type { RegistryItem } from "../page";

interface DeleteItemDialogProps {
  /** The item to delete. */
  itemToDelete: RegistryItem | undefined;
  /** Called after the item is deleted so the parent can close the dialog. */
  onSuccess: () => void;
  /** Called when the user backs out. */
  onCancel: () => void;
}

/**
 * The row's delete. Blocked while anyone has claimed the item: a claim is a real person
 * buying a real gift, so the couple removes the claims first. The action re-checks.
 */
export default function DeleteItemDialog({ itemToDelete, onSuccess, onCancel }: DeleteItemDialogProps) {
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);
  const claims = itemToDelete?.claimed ?? [];
  const claimCount = claims.length;

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={`Delete ${itemToDelete?.name}?`}
      description={claimCount > 0
        ? `${claimCount === 1 ? 'A guest has' : `${claimCount} guests have`} already claimed this item (${claims.map((claim) => claim.claimedBy).join(', ')}). Remove their ${claimCount === 1 ? 'claim' : 'claims'} first if you really want it gone.`
        : "You can't undo this."}
      isLoading={isLoading}
      confirmDisabled={claimCount > 0}
      error={serverError || undefined}
      onConfirm={() => runAction("Item deleted", () => deleteRegistryItem(itemToDelete?.id))}
    />
  );
}
