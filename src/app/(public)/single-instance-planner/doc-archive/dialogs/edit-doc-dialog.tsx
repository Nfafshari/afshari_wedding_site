"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { type ErrorField } from "../action";
import { useDemoPlanner } from "../../demo-store";
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
  const { updateDocument, deleteDocument } = useDemoPlanner();
  const [newDocName, setNewDocName] = useState('');
  const [newIcon, setNewIcon] = useState(docToUpdate?.icon.displayName ?? 'FileChartColumn');
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

  async function editDoc(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    // Client-side checks for instant feedback (the server re-checks these too).
    const nameError = nameValidator(newDocName);
    if (nameError) {
      setFieldErrors({ name: nameError });
      return;
    }

    await runAction("Document updated", () => updateDocument(docToUpdate?.id, newDocName, newIcon));
  }

  async function removeDoc(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    await runAction("Document removed", () => deleteDocument(docToUpdate?.id));
  }

  if (!isDeleteDocActive) {
    return (
      <AlertDialogContent id="edit-document-dialog" className="bg-popover rounded-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="page-title border-b border-b-burg w-full">Edit <span className="font-bold">{docToUpdate?.name}</span>?</AlertDialogTitle>
          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="edit-document-name">New Document Name</FieldLabel>
            <Input
              id="edit-document-name"
              type="text"
              placeholder={docToUpdate?.name}
              className={`bg-popover text-burg rounded-sm placeholder:text-muted-foreground ${(fieldErrors.name || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
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
            variant={'destructive'}
            className="w-full mt-4 border border-destructive hover:bg-destructive hover:text-white"
            onClick={() => {
              setIsDeleteDocActive(true)
            }}
          >
            Delete {docToUpdate?.name}?
          </Button>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-muted/20 rounded-sm rounded-t-none">
          <AlertDialogCancel variant={'secondary'} className="hover:bg-gold/90">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={isLoading ? 'bg-primary/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
            onClick={editDoc}
          >
            {isLoading ? <Spinner /> : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  }

  return (
    <AlertDialogContent id="delete-document-dialog" className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full text-destructive">Delete <span className="font-bold">{docToUpdate?.name}</span>?</AlertDialogTitle>
        <AlertDialogDescription className="text-destructive">
          You are about to delete {docToUpdate?.name}. This will remove the document and its uploaded file from the archive. This cannot be undone. Do you wish to continue?
        </AlertDialogDescription>
        {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-muted/20 rounded-sm rounded-t-none">
        <AlertDialogCancel
          variant={'secondary'}
          className="hover:bg-gold/90"
          onClick={(e) => {
            // Go back to the edit view instead of closing the whole dialog.
            e.preventDefault();
            setIsDeleteDocActive(false);
          }}
        >
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className={isLoading ? 'bg-destructive/30!' : 'bg-destructive! text-white hover:bg-destructive/80!'}
          onClick={removeDoc}
        >
          {isLoading ? <Spinner /> : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
