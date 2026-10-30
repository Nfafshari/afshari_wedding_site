"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormDialogProps {
  /** DOM id for the dialog content (handy for labelling/testing). Optional. */
  id?: string;
  /** Noun phrase, title case: "Add Category", "Edit {name}". No question mark. */
  title: React.ReactNode;
  /** Optional one line under the title. */
  description?: React.ReactNode;
  /** The form fields. Each concrete dialog supplies its own inputs here. */
  children: React.ReactNode;
  /** True while the server action is in flight: spinner, no closing, no double submit. */
  isLoading: boolean;
  /** Runs on submit (button or Enter). The shell has already called preventDefault. */
  onSubmit: () => void;
  /** Says what happens: "Add", "Save changes", "Import". Defaults to "Add". */
  submitLabel?: string;
  /** A server error that isn't about one field. Field errors stay next to their field. */
  error?: string;
}

/**
 * The shared chrome for every add/edit form dialog: a centered title, the fields, an
 * optional general error, and a Cancel / submit footer. Render it inside the page's
 * <Dialog> root. Inner buttons that don't submit need type="button".
 *
 * It owns only the layout and the submit lifecycle. Each caller still owns its own
 * fields, client-side validation, and which server action to call. Compose (pass
 * fields as children), don't configure (no field schema).
 */
export default function FormDialog({
  id,
  title,
  description,
  children,
  isLoading,
  onSubmit,
  submitLabel = "Add",
  error,
}: FormDialogProps) {
  // While saving, nothing closes the dialog, so a submit in flight is never lost.
  const blockWhileSaving = (event: Event) => {
    if (isLoading) event.preventDefault();
  };

  return (
    <DialogContent
      id={id}
      closeDisabled={isLoading}
      onEscapeKeyDown={blockWhileSaving}
      onInteractOutside={blockWhileSaving}
      {...(description ? {} : { "aria-describedby": undefined })}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <form
        className="grid gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!isLoading) onSubmit();
        }}
      >
        <div className="grid gap-4">{children}</div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Spinner /> : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
