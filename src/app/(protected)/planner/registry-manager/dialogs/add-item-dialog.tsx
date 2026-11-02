"use client";

import { useState } from "react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useFieldErrors } from "@/hooks/use-field-errors";

import { createRegistryItem, type ErrorField } from "../action";
import type { RegistryItem } from "../page";
import { MAX_REGISTRY_QUANTITY } from "@/lib/registry";
import { checkHttpUrl, checkRequired, checkUniqueName, checkWholeNumber, parseWholeNumber } from "@/lib/validate";

interface AddItemDialogProps {
  /** Existing items, used for the client-side duplicate-name check. */
  items: RegistryItem[];
  /** Called after an item is created so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function AddItemDialog({ items, onSuccess }: AddItemDialogProps) {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [quantityWanted, setQuantityWanted] = useState('1');
  const [image, setImage] = useState('');
  const { errors: fieldErrors, check, clear, checkAll } = useFieldErrors<ErrorField>();
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  // The messages come from lib/validate.ts, so they match what the server would say.
  const checks = {
    name: () => checkRequired(name, 'Item name') ?? checkUniqueName(name, items.map((item) => item.name), 'item'),
    link: () => checkHttpUrl(link, 'Product link'),
    quantityWanted: () => checkWholeNumber(parseWholeNumber(quantityWanted), 'Quantity wanted', MAX_REGISTRY_QUANTITY),
    // Blank is allowed: the DB fills in a placeholder image.
    image: () => (image.trim() === '' ? null : checkHttpUrl(image, 'Image link')),
  };

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function addItem () {
    const ok = checkAll({ name: checks.name(), link: checks.link(), quantityWanted: checks.quantityWanted(), image: checks.image() });
    if (!ok) return;

    await runAction("Item added", () => createRegistryItem(name, link, parseWholeNumber(quantityWanted), image));
  }

  return (
    <FormDialog
      id="add-item-dialog"
      title="Add Item"
      isLoading={isLoading}
      onSubmit={addItem}
    >
      <Field className="flex w-full text-burg">
        <FieldLabel htmlFor="item-name">Item Name</FieldLabel>
        <Input
          id="item-name"
          type="text"
          placeholder="Stand Mixer"
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

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="item-link">Product Link</FieldLabel>
        <Input
          id="item-link"
          type="url"
          inputMode="url"
          placeholder="https://www.example.com/stand-mixer"
          aria-invalid={Boolean(fieldErrors.link || serverErrorField === 'link')}
          onChange={(e) => {
            setLink(e.target.value);
            clear('link');
            clearServerError();
          }}
          onBlur={() => check('link', checks.link())}
        />
        {fieldErrors.link && <p className="text-destructive text-xs">{fieldErrors.link}</p>}
        {(serverError && serverErrorField === 'link') && <p className="text-destructive text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="item-quantity">How Many Do You Want?</FieldLabel>
        <Input
          id="item-quantity"
          type="text"
          inputMode="numeric"
          placeholder="1"
          value={quantityWanted}
          aria-invalid={Boolean(fieldErrors.quantityWanted || serverErrorField === 'quantityWanted')}
          onChange={(e) => {
            setQuantityWanted(e.target.value);
            clear('quantityWanted');
            clearServerError();
          }}
          onBlur={() => check('quantityWanted', checks.quantityWanted())}
        />
        {fieldErrors.quantityWanted && <p className="text-destructive text-xs">{fieldErrors.quantityWanted}</p>}
        {(serverError && serverErrorField === 'quantityWanted') && <p className="text-destructive text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="item-image">Image Link <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
        <Input
          id="item-image"
          type="url"
          inputMode="url"
          placeholder="https://www.example.com/stand-mixer.jpg"
          aria-invalid={Boolean(fieldErrors.image || serverErrorField === 'image')}
          onChange={(e) => {
            setImage(e.target.value);
            clear('image');
            clearServerError();
          }}
          onBlur={() => check('image', checks.image())}
        />
        {fieldErrors.image && <p className="text-destructive text-xs">{fieldErrors.image}</p>}
        {(serverError && serverErrorField === 'image') && <p className="text-destructive text-xs">{serverError}</p>}
      </Field>

      {/* general / no-field errors show at the bottom */}
      {(serverError && (serverErrorField === null || serverErrorField === 'item')) && (
        <p className="text-destructive text-xs">{serverError}</p>
      )}
    </FormDialog>
  );
}
