"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { GUEST_CSV_TEMPLATE, describeImport, parseGuestCsv, type CsvParty } from "@/lib/guest-import";

import { importGuestList, type ErrorField } from "../action";

interface ImportGuestsDialogProps {
  /** Called after a successful import so the parent can close the dialog. */
  onSuccess: () => void;
}

const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(GUEST_CSV_TEMPLATE + '\n')}`;

export default function ImportGuestsDialog({ onSuccess }: ImportGuestsDialogProps) {
  const [csvText, setCsvText] = useState<string | null>(null);
  const [preview, setPreview] = useState<CsvParty[] | null>(null);
  const [fileError, setFileError] = useState('');
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  /**
   * Reads and parses the chosen file in the browser, so a bad row is caught before
   * upload. The server parses it again; this is only for instant feedback.
   */
  async function onFileChosen (file: File | undefined) {
    setCsvText(null);
    setPreview(null);
    setFileError('');
    clearServerError();

    if (file === undefined) {
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      setFileError("That file couldn't be read. Try saving it again as CSV.");
      return;
    }

    const parsed = parseGuestCsv(text);
    if (!parsed.ok) {
      setFileError(parsed.error);
      return;
    }

    setCsvText(text);
    setPreview(parsed.parties);
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function importGuests () {
    if (csvText === null) {
      setFileError(fileError || 'Choose a CSV file to import.');
      return;
    }

    await runAction(
      (result) => {
        const duplicates = result.summary.duplicateNames;
        return duplicates.length === 0
          ? describeImport(result.summary)
          : `${describeImport(result.summary)} Heads up: ${duplicates.join(', ')} ${duplicates.length === 1 ? 'is' : 'are'} on more than one party.`;
      },
      () => importGuestList(csvText)
    );
  }

  const guestCount = preview?.reduce((sum, party) => sum + party.members.length, 0) ?? 0;
  const hasError = fileError !== '' || serverErrorField === 'file';

  return (
    <FormDialog
      id="import-guests-dialog"
      title="Import Guest List?"
      isLoading={isLoading}
      onSubmit={importGuests}
      submitLabel="Import"
    >
      <Field className="flex w-full text-burg">
        <FieldLabel htmlFor="guest-csv">CSV File</FieldLabel>
        <FieldDescription className="text-xs">
          One row per guest with the columns <code>party,name,plus_ones</code>. Guests in the same
          party share a party name; plus-ones are read from each party&apos;s first row. Importing
          only adds — existing parties and responses are never removed, so it&apos;s safe to
          import an updated file again.
        </FieldDescription>
        <a
          href={TEMPLATE_HREF}
          download="guest-list-template.csv"
          className="inline-flex w-fit items-center gap-1 text-sm text-burg/70 underline hover:text-burg"
        >
          <Download className="w-3.5 h-3.5" /> Download a template
        </a>
        <Input
          id="guest-csv"
          type="file"
          accept=".csv,text/csv"
          className={`bg-popover text-burg rounded-sm cursor-pointer ${hasError ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => onFileChosen(e.target.files?.[0])}
        />
        {fileError && <p className="text-destructive/80 text-xs">{fileError}</p>}
        {(serverError && serverErrorField === 'file') && <p className="text-destructive/80 text-xs">{serverError}</p>}
        {preview && (
          <p className="text-xs text-burg/70">
            Ready to import {preview.length === 1 ? '1 party' : `${preview.length} parties`} with{' '}
            {guestCount === 1 ? '1 guest' : `${guestCount} guests`}.
          </p>
        )}
      </Field>

      {/* general / no-field errors show at the bottom */}
      {(serverError && serverErrorField !== 'file') && (
        <p className="text-destructive/80 text-xs">{serverError}</p>
      )}
    </FormDialog>
  );
}
