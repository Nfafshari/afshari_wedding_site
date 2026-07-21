"use client";

import { useState } from "react";
import Dropzone from "react-dropzone";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { useDemoPlanner } from "../../demo-store";
import type { ArchivedDoc } from "../data";
import type { ErrorField } from "../action";
import IconPicker, { ICON_LIBRARY } from "./icon-picker";

interface AddDocDialogProps {
  /** Existing documents, used for the client-side duplicate-name check. */
  docs: ArchivedDoc[];
  /** Called after a successful add so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function AddDocDialog({ docs, onSuccess }: AddDocDialogProps) {
  const { createDocument } = useDemoPlanner();
  const [activeIcon, setActiveIcon] = useState('FileChartColumn');
  const [docName, setDocName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
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

    const isDuplicate = docs.some(
      (doc) => doc.name.toLowerCase().trim() === value.toLowerCase().trim()
    );
    if (isDuplicate) {
      return 'Document already exists!';
    }

    return null;
  }

  async function addDoc() {
    // Client-side checks for instant feedback (the action re-checks these too).
    const nameError = nameValidator(docName);
    if (nameError) {
      setFieldErrors({ name: nameError });
      return;
    }

    if (file === undefined) {
      setFieldErrors({ file: 'Please choose a file to upload.' });
      return;
    }

    // The file never leaves the browser: an object URL points straight at the blob
    // the user just dropped, so the card opens the real document with no upload,
    // no storage, and nothing to clean up — the tab closing reclaims it.
    const link = URL.createObjectURL(file);

    await runAction("Document added", () => createDocument(docName, companyName, activeIcon, link));
  }

  return (
    <FormDialog
      id="add-document-dialog"
      title="Add New Document?"
      isLoading={isLoading}
      onSubmit={addDoc}
    >
      <Field className="flex w-full text-burg">
        <Dropzone
          onDrop={(acceptedFiles) => {
            setFile(acceptedFiles[0]);
            setFieldErrors(({ file: _file, ...rest }) => rest);
            clearServerError();
          }}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={`flex w-full h-30 border-2 border-dashed rounded-xl justify-center items-center text-center text-sm cursor-pointer transition-colors ${
                isDragActive ? 'border-olivine bg-olivine/10' : 'border-muted hover:border-olivine/60'
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive
                ? <p>Drop the file here…</p>
                : file
                  ? <p className="px-4 text-burg">{file.name}</p>
                  : <p className="px-4 text-muted-foreground">Drag &amp; drop a file here, or click to browse</p>}
            </div>
          )}
        </Dropzone>
        {fieldErrors.file && <p className="text-destructive/80 text-xs">{fieldErrors.file}</p>}
        {(serverError && serverErrorField === 'file') && <p className="text-destructive/80 text-xs">{serverError}</p>}

        <FieldLabel htmlFor="document-name">Document Name</FieldLabel>
        <Input
          id="document-name"
          type="text"
          placeholder="Document"
          className={`bg-popover text-burg rounded-sm ${(fieldErrors.name || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setDocName(e.target.value);
            // Typing clears any previous error so the user gets a fresh start.
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ name: _name, ...rest }) => rest);
            }
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = nameValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, name: msg }));
            } else {
              setFieldErrors(({ name: _name, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.name && <p className="text-destructive/80 text-xs">{fieldErrors.name}</p>}
        {(serverError && (serverErrorField === 'name' || serverErrorField === null)) && <p className="text-destructive/80 text-xs">{serverError}</p>}

        <FieldLabel htmlFor="document-company">Company Name</FieldLabel>
        <Input
          id="document-company"
          type="text"
          placeholder="Company"
          className={`bg-popover text-burg rounded-sm ${(fieldErrors.companyName || serverErrorField === 'companyName') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setCompanyName(e.target.value);
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ companyName: _companyName, ...rest }) => rest);
            }
            clearServerError();
          }}
        />
        {fieldErrors.companyName && <p className="text-destructive/80 text-xs">{fieldErrors.companyName}</p>}
        {(serverError && serverErrorField === 'companyName') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>
      <div className="flex flex-col w-full items-start gap-2 mt-2 text-burg">
        <p className="text-sm font-medium">Icon</p>
        <IconPicker icons={ICON_LIBRARY} value={activeIcon} onChange={setActiveIcon} />
      </div>
    </FormDialog>
  );
}
