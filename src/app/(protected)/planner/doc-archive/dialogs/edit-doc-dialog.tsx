"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/confirm-dialog";
import FormDialog from "@/components/form-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { updateDocument, deleteDocument, type ErrorField } from "../action";
import type { ArchivedDoc } from "../data";
import IconPicker, { ICON_LIBRARY } from "./icon-picker";

interface EditDocDialogProps {
  /** Existing documents, used for the client-side duplicate-name check. */
  docs: ArchivedDoc[];
  /** The document being edited. */
  docToUpdate: ArchivedDoc | undefined;
  /** Called after a successful rename/delete so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function EditDocDialog({ docs, docToUpdate, onSuccess }: EditDocDialogProps) {
  const [newDocName, setNewDocName] = useState('');
  const [newIcon, setNewIcon] = useState(docToUpdate?.icon ?? 'FileChartColumn');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  // Flips this dialog between the "edit" view and the "confirm delete" view.
  const [isDeleteDocActive, setIsDeleteDocActive] = useState(false);
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  /**
   * Validates the document name by checking if it is empty or already taken.
   *
   * @param value - string value of the name
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function nameValidator(value: string): string | null {
    if (value.trim() === '') {
      return 'Document name cannot be empty.';
    }

    // Reject a name already used by *another* document (skip the one being edited).
    const isDuplicate = docs.some(
      (doc) =>
        doc.id !== docToUpdate?.id &&
        doc.name.toLowerCase().trim() === value.toLowerCase().trim()
    );
    if (isDuplicate) {
      return 'Document already exists!';
    }

    // return null if validation succeeded
    return null;
  }

  async function editDoc() {
    // Client-side checks for instant feedback (the server re-checks these too).
    const nameError = nameValidator(newDocName);
    if (nameError) {
      setFieldErrors({ name: nameError });
      return;
    }

    await runAction("Document saved", () => updateDocument(docToUpdate?.id, newDocName, newIcon));
  }

  async function removeDoc() {
    await runAction("Document deleted", () => deleteDocument(docToUpdate?.id));
  }

  return (
    <>
      <FormDialog
        id="edit-document-dialog"
        title={`Edit ${docToUpdate?.name ?? "Document"}`}
        submitLabel="Save changes"
        isLoading={isLoading && !isDeleteDocActive}
        error={!isDeleteDocActive && serverError && !serverErrorField ? serverError : undefined}
        onSubmit={editDoc}
      >
          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="edit-document-name">New Document Name</FieldLabel>
            <Input
              id="edit-document-name"
              type="text"
              placeholder={docToUpdate?.name}
              aria-invalid={Boolean(fieldErrors.name || serverErrorField === 'name')}
              onChange={(e) => {
                setNewDocName(e.target.value);
                // Typing clears any previous error so the user gets a fresh start.
                if (e.target.value.trim() !== '') {
                  setFieldErrors(({ name, ...rest }) => rest);
                }
                clearServerError();
              }}
              onBlur={(e) => {
                const msg = nameValidator(e.target.value);
                if (msg) {
                  setFieldErrors(prev => ({ ...prev, name: msg }));
                } else {
                  setFieldErrors(({ name, ...rest }) => rest);
                }
              }}
            />
            {fieldErrors.name && <p className="text-destructive/80 text-xs">{fieldErrors.name}</p>}
            {(serverError && serverErrorField === 'name') && <p className="text-destructive/80 text-xs">{serverError}</p>}
          </Field>
          <div className="flex flex-col w-full items-start gap-2 mt-2 text-burg">
            <p className="text-sm font-medium">Icon</p>
            <IconPicker icons={ICON_LIBRARY} value={newIcon} onChange={setNewIcon} />
          </div>
          <Button
            type="button"
            variant={'ghost-destructive'}
            className="w-full"
            onClick={() => {
              clearServerError();
              setIsDeleteDocActive(true)
            }}
            >
            Delete {docToUpdate?.name}
          </Button>
      </FormDialog>
      <ConfirmDialog
        open={isDeleteDocActive}
        onOpenChange={setIsDeleteDocActive}
        title={`Delete ${docToUpdate?.name}?`}
        description="This also removes its uploaded file. You can't undo this."
        isLoading={isLoading}
        error={serverError || undefined}
        onConfirm={removeDoc}
      />
    </>
  );
}
