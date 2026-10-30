"use client";

import * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names what goes: "Delete Flowers?". */
  title: React.ReactNode;
  /** The consequence, in plain words: "This can't be undone." */
  description: React.ReactNode;
  /** Defaults to "Delete". */
  confirmLabel?: string;
  /** True while the delete is in flight: spinner, no closing, no double click. */
  isLoading: boolean;
  /** Blocks the confirm when the description already explains why it can't go ahead. */
  confirmDisabled?: boolean;
  /** Shown if the delete fails. */
  error?: string;
  onConfirm: () => void;
}

/**
 * The one confirmation for destructive actions. It has its own root, so it works
 * standalone (a row's trash icon) or on top of an open edit dialog (Cancel returns
 * to the form with its edits intact).
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  isLoading,
  confirmDisabled = false,
  error,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isLoading) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary" disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isLoading || confirmDisabled}
            onClick={(event) => {
              // The action closes the dialog by default. Close only when the delete succeeds.
              event.preventDefault();
              onConfirm();
            }}
          >
            {isLoading ? <Spinner /> : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
