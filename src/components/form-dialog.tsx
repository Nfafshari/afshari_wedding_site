"use client";

import * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FormDialogProps {
  /** DOM id for the dialog content (handy for labelling/testing). Optional. */
  id?: string;
  /** Text shown in the dialog's title bar. */
  title: string;
  /** The form fields. Each concrete dialog supplies its own inputs here. */
  children: React.ReactNode;
  /** True while the server action is in flight; swaps the button for a spinner. */
  isLoading: boolean;
  /** Runs when the user confirms. The shell has already called preventDefault. */
  onSubmit: () => void;
  /** Confirm-button label. Defaults to "Add". */
  submitLabel?: string;
}

/**
 * The shared chrome for every add/edit form dialog: a title, a slot for fields,
 * and a Cancel / confirm footer that shows a spinner while submitting.
 *
 * It owns only the layout and the submit *button* lifecycle. Each caller still
 * owns its own fields, client-side validation, and which server action to call —
 * those are the parts that actually differ, so they stay in the concrete dialog.
 * Compose (pass fields as children), don't configure (no field schema).
 */
export default function FormDialog({
  id,
  title,
  children,
  isLoading,
  onSubmit,
  submitLabel = "Add",
}: FormDialogProps) {
  return (
    <AlertDialogContent id={id} className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full">
          {title}
        </AlertDialogTitle>
        {children}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
        <AlertDialogCancel variant={"secondary"} className="hover:bg-gold/90">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          disabled={isLoading}
          className={isLoading ? "bg-primary/30" : "bg-primary text-primary-foreground hover:bg-primary/90"}
          onClick={(event) => {
            // AlertDialogAction auto-closes the dialog on click. Stop that here so
            // the dialog only closes on a successful submit (via the caller's onSuccess).
            event.preventDefault();
            onSubmit();
          }}
        >
          {isLoading ? <Spinner /> : submitLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
