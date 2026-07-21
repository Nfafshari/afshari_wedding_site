"use client";

import { useState } from "react";
import Dropzone from "react-dropzone";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import IconPicker, { ICON_LIBRARY } from "./icon-picker";

export default function AddDocDialog() {
  const [activeIcon, setActiveIcon] = useState('FileChartColumn');

  return (
    <FormDialog
      id="add-document-dialog"
      title="Add New Document?"
      isLoading={false}
      onSubmit={() => {}}
    >
      <Field className="flex w-full text-burg">
        <Dropzone onDrop={() => {}}>
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
                : <p className="px-4 text-muted-foreground">Drag &amp; drop a file here, or click to browse</p>}
            </div>
          )}
        </Dropzone>
        <FieldLabel htmlFor="document-name">Document Name</FieldLabel>
        <Input
          id="document-name"
          type="text"
          placeholder="Document"
          className="bg-popover text-burg rounded-sm border-input"
          onChange={() => {}}
        />
      </Field>
      <div className="flex flex-col w-full items-start gap-2 mt-2 text-burg">
        <p className="text-sm font-medium">Icon</p>
        <IconPicker icons={ICON_LIBRARY} value={activeIcon} onChange={setActiveIcon} />
      </div>
    </FormDialog>
  );
}
