"use client";

import { useState } from "react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { type ErrorField } from "../action";
import { useDemoPlanner } from "../../demo-store";
import type { RegistryItem } from "../page";
import { parseHttpUrl, parseQuantityString } from "@/lib/utils";

interface AddItemDialogProps {
  /** Existing items, used for the client-side duplicate-name check. */
  items: RegistryItem[];
  /** Called after an item is created so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function AddItemDialog({ items, onSuccess }: AddItemDialogProps) {
  const { createRegistryItem } = useDemoPlanner();
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [quantityWanted, setQuantityWanted] = useState('1');
  const [image, setImage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  /**
   * Validates the item name by checking if it is empty or already taken.
   * @param value - string value of the name
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function nameValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Item name cannot be empty.';
    }

    const isDuplicate = items.some(
      (item) => item.name.toLowerCase().trim() === value.toLowerCase().trim()
    );
    if (isDuplicate) {
      return 'That item is already on the registry!';
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validates the product link by checking it is a real http(s) address.
   * @param value - string value of the link
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function linkValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Product link cannot be empty.';
    }

    if (parseHttpUrl(value) === null) {
      return 'Product link must start with http:// or https://';
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validates the quantity wanted, which must be a whole number of at least 1.
   * @param value - string value of the quantity
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function quantityWantedValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Quantity cannot be empty.';
    }

    if (parseQuantityString(value) === null) {
      return 'Quantity must be a whole number of 1 or more.';
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validates the image link. Blank is allowed — the DB fills in a placeholder.
   * @param value - string value of the image link
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function imageValidator (value: string): string | null {
    if (value.trim() === '') {
      // blank falls back to the placeholder image, so it's valid
      return null;
    }

    if (parseHttpUrl(value) === null) {
      return 'Image link must start with http:// or https://';
    }

    // return null if validation succeeded
    return null;
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function addItem () {
    // Validate every field into one local object, then gate on it
    const errors: Partial<Record<ErrorField, string>> = {};

    const nameError = nameValidator(name);
    if (nameError) {
      errors.name = nameError;
    }

    const linkError = linkValidator(link);
    if (linkError) {
      errors.link = linkError;
    }

    const quantityWantedError = quantityWantedValidator(quantityWanted);
    if (quantityWantedError) {
      errors.quantityWanted = quantityWantedError;
    }

    const imageError = imageValidator(image);
    if (imageError) {
      errors.image = imageError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Validation passed, so the quantity parses.
    const parsedQuantityWanted = parseQuantityString(quantityWanted);
    if (parsedQuantityWanted === null) return;

    await runAction("Item added", () => createRegistryItem(name, link, parsedQuantityWanted, image));
  }

  return (
    <FormDialog
      id="add-item-dialog"
      title="Add New Item?"
      isLoading={isLoading}
      onSubmit={addItem}
    >
      <Field className="flex w-full text-burg">
        <FieldLabel htmlFor="item-name">Item Name</FieldLabel>
        <Input
          id="item-name"
          type="text"
          placeholder="Stand Mixer"
          className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(fieldErrors.name || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setName(e.target.value);
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

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="item-link">Product Link</FieldLabel>
        <Input
          id="item-link"
          type="url"
          inputMode="url"
          placeholder="https://www.example.com/stand-mixer"
          className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(fieldErrors.link || serverErrorField === 'link') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setLink(e.target.value);
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ link, ...rest }) => rest);
            }
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = linkValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, link: msg }));
            } else {
              setFieldErrors(({ link, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.link && <p className="text-destructive/80 text-xs">{fieldErrors.link}</p>}
        {(serverError && serverErrorField === 'link') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="item-quantity">How Many Do You Want?</FieldLabel>
        <Input
          id="item-quantity"
          type="text"
          inputMode="numeric"
          placeholder="1"
          value={quantityWanted}
          className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(fieldErrors.quantityWanted || serverErrorField === 'quantityWanted') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setQuantityWanted(e.target.value);
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ quantityWanted, ...rest }) => rest);
            }
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = quantityWantedValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, quantityWanted: msg }));
            } else {
              setFieldErrors(({ quantityWanted, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.quantityWanted && <p className="text-destructive/80 text-xs">{fieldErrors.quantityWanted}</p>}
        {(serverError && serverErrorField === 'quantityWanted') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="item-image">Image Link <span className="text-muted font-normal">(optional)</span></FieldLabel>
        <Input
          id="item-image"
          type="url"
          inputMode="url"
          placeholder="https://www.example.com/stand-mixer.jpg"
          className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(fieldErrors.image || serverErrorField === 'image') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setImage(e.target.value);
            setFieldErrors(({ image, ...rest }) => rest);
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = imageValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, image: msg }));
            } else {
              setFieldErrors(({ image, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.image && <p className="text-destructive/80 text-xs">{fieldErrors.image}</p>}
        {(serverError && serverErrorField === 'image') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      {/* general / no-field errors show at the bottom */}
      {(serverError && (serverErrorField === null || serverErrorField === 'item')) && (
        <p className="text-destructive/80 text-xs">{serverError}</p>
      )}
    </FormDialog>
  );
}
