"use client";

import ConfirmDialog from "@/components/confirm-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { deleteDocument, type ErrorField } from "../action";
import type { ArchivedDoc } from "../data";

interface DeleteDocDialogProps {
  /** The document to delete. */
  docToDelete: ArchivedDoc | undefined;
  /** Called after the document is deleted so the parent can close the dialog. */
  onSuccess: () => void;
  /** Called when the user backs out. */
  onCancel: () => void;
}

/** The tile's delete. The action removes the row, then its stored file. */
export default function DeleteDocDialog({ docToDelete, onSuccess, onCancel }: DeleteDocDialogProps) {
  const { isLoading, serverError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title={`Delete ${docToDelete?.name}?`}
      description="This also removes its uploaded file. You can't undo this."
      isLoading={isLoading}
      error={serverError || undefined}
      onConfirm={() => runAction("Document deleted", () => deleteDocument(docToDelete?.id))}
    />
  );
}
