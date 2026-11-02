"use client";

import { useState } from "react";
import Dropzone, { type FileRejection } from "react-dropzone";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { checkRequired, checkUniqueName } from "@/lib/validate";

import { createDocument, updateDocument, type ErrorField } from "../action";
import { ACCEPTED_DOC_TYPES, MAX_DOC_SIZE_BYTES, type ArchivedDoc } from "../data";
import DeleteDocDialog from "./delete-doc-dialog";
import IconPicker, { ICON_LIBRARY } from "./icon-picker";

interface DocDialogProps {
  /** Existing documents, used for the client-side duplicate-name check. */
  docs: ArchivedDoc[];
  /** The document to edit. Leave out to add a new one. */
  doc?: ArchivedDoc;
  /** Called after a save or delete so the parent can close the dialog. */
  onSuccess: () => void;
}

/**
 * Turns react-dropzone's rejection codes into a message for the file field.
 *
 * @param rejections - the files the dropzone refused, with why
 * @returns a user-facing message
 */
function rejectionMessage(rejections: FileRejection[]): string {
  const code = rejections[0]?.errors[0]?.code;
  if (code === 'file-too-large') {
    return 'File is too large (4 MB max).';
  }
  if (code === 'file-invalid-type') {
    return 'Only PDF, PNG and JPG files are allowed.';
  }
  if (code === 'too-many-files') {
    return 'Please choose a single file.';
  }
  return 'That file could not be added.';
}

/**
 * Adds a document (file drop, empty form, Add) or edits one (filled with its name,
 * company and icon, Save changes, Delete). The file itself can't be swapped on edit.
 */
export default function DocDialog({ docs, doc, onSuccess }: DocDialogProps) {
  const [name, setName] = useState(doc?.name ?? '');
  const [companyName, setCompanyName] = useState(doc?.companyName ?? '');
  const [icon, setIcon] = useState(doc?.icon ?? 'FileChartColumn');
  const [file, setFile] = useState<File | undefined>(undefined);
  // Opens the delete confirmation on top of the edit form.
  const [isDeleteActive, setIsDeleteActive] = useState(false);
  const { errors: fieldErrors, check, clear, checkAll } = useFieldErrors<ErrorField>();
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  const takenNames = docs.filter((other) => other.id !== doc?.id).map((other) => other.name);

  // The messages come from lib/validate.ts, so they match what the server would say.
  const checks = {
    name: () => checkRequired(name, 'Document name') ?? checkUniqueName(name, takenNames, 'document'),
    companyName: () => checkRequired(companyName, 'Company name'),
    file: () => (doc === undefined && file === undefined ? 'Please choose a file to upload.' : null),
  };

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function save () {
    if (!checkAll({ name: checks.name(), companyName: checks.companyName(), file: checks.file() })) return;

    if (doc !== undefined) {
      await runAction("Document saved", () => updateDocument(doc.id, { name, companyName, icon }));
      return;
    }

    if (file === undefined) return;

    // A File can only reach a server action inside FormData, so the text fields ride
    // along in the same body.
    const formData = new FormData();
    formData.append('name', name);
    formData.append('companyName', companyName);
    formData.append('icon', icon);
    formData.append('file', file);

    await runAction("Document added", () => createDocument(formData));
  }

  return (
    <>
      <FormDialog
        id="document-dialog"
        title={doc ? `Edit ${doc.name}` : "Add Document"}
        submitLabel={doc ? "Save changes" : "Add"}
        isLoading={isLoading}
        error={serverError && serverErrorField === null ? serverError : undefined}
        onSubmit={save}
      >
        {doc === undefined && (
          <Field className="flex w-full text-burg">
            <Dropzone
              accept={ACCEPTED_DOC_TYPES}
              maxSize={MAX_DOC_SIZE_BYTES}
              maxFiles={1}
              multiple={false}
              onDropAccepted={(acceptedFiles) => {
                setFile(acceptedFiles[0]);
                clear('file');
                clearServerError();
              }}
              onDropRejected={(rejections) => {
                // Without this a too-big or wrong-type file is silently ignored.
                setFile(undefined);
                check('file', rejectionMessage(rejections));
              }}
            >
              {({ getRootProps, getInputProps, isDragActive }) => (
                <div
                  {...getRootProps()}
                  className={`flex w-full h-30 border-2 border-dashed rounded-xl justify-center items-center text-center text-sm cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-olivine bg-olivine/10'
                      : (fieldErrors.file || serverErrorField === 'file')
                        ? 'border-destructive'
                        : 'border-muted hover:border-olivine/60'
                  }`}
                >
                  <input {...getInputProps()} />
                  {isDragActive
                    ? <p>Drop the file here…</p>
                    : file
                      ? <p className="px-4 text-burg">{file.name}</p>
                      : <p className="px-4 text-muted-foreground">Drag &amp; drop a PDF or image here, or click to browse</p>}
                </div>
              )}
            </Dropzone>
            {fieldErrors.file && <p className="text-destructive text-xs">{fieldErrors.file}</p>}
            {(serverError && serverErrorField === 'file') && <p className="text-destructive text-xs">{serverError}</p>}
          </Field>
        )}

        <Field className="flex w-full text-burg">
          <FieldLabel htmlFor="document-name">Document Name</FieldLabel>
          <Input
            id="document-name"
            type="text"
            placeholder="Venue contract"
            value={name}
            aria-invalid={Boolean(fieldErrors.name || serverErrorField === 'name')}
            onChange={(e) => {
              setName(e.target.value);
              clear('name');
              clearServerError();
            }}
            onBlur={() => check('name', checks.name())}
          />
          {fieldErrors.name && <p className="text-destructive text-xs">{fieldErrors.name}</p>}
          {(serverError && serverErrorField === 'name') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>

        <Field className="flex w-full text-burg">
          <FieldLabel htmlFor="document-company">Company Name</FieldLabel>
          <Input
            id="document-company"
            type="text"
            placeholder="The Barn at Willow Creek"
            value={companyName}
            aria-invalid={Boolean(fieldErrors.companyName || serverErrorField === 'companyName')}
            onChange={(e) => {
              setCompanyName(e.target.value);
              clear('companyName');
              clearServerError();
            }}
            onBlur={() => check('companyName', checks.companyName())}
          />
          {fieldErrors.companyName && <p className="text-destructive text-xs">{fieldErrors.companyName}</p>}
          {(serverError && serverErrorField === 'companyName') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>

        <div className="flex flex-col w-full items-start gap-2 mt-2 text-burg">
          <p className="text-sm font-medium">Icon</p>
          <IconPicker icons={ICON_LIBRARY} value={icon} onChange={setIcon} />
        </div>

        {doc && (
          <Button
            type="button"
            variant={'ghost-destructive'}
            className="w-full"
            onClick={() => {
              clearServerError();
              setIsDeleteActive(true);
            }}
          >
            Delete {doc.name}
          </Button>
        )}
      </FormDialog>
      {doc && isDeleteActive && (
        <DeleteDocDialog
          docToDelete={doc}
          onSuccess={onSuccess}
          onCancel={() => setIsDeleteActive(false)}
        />
      )}
    </>
  );
}
