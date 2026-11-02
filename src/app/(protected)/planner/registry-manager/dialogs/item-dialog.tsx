"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FormDialog from "@/components/form-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { checkWantedNotBelowClaimed, getClaimedQuantity, MAX_REGISTRY_QUANTITY } from "@/lib/registry";
import { parseHttpUrl } from "@/lib/utils";
import { checkHttpUrl, checkRequired, checkUniqueName, checkWholeNumber, parseWholeNumber } from "@/lib/validate";

import { createRegistryItem, updateRegistryItem, type ErrorField } from "../action";
import ItemThumbnail, { PLACEHOLDER_IMAGE } from "../components/item-thumbnail";
import type { RegistryItem } from "../page";
import DeleteItemDialog from "./delete-item-dialog";

interface ItemDialogProps {
  /** Existing items, used for the client-side duplicate-name check. */
  items: RegistryItem[];
  /** The item to edit. Leave out to add a new one. */
  item?: RegistryItem;
  /** Called after a save or delete so the parent can close the dialog. */
  onSuccess: () => void;
}

/** Adds an item (empty form, Add) or edits one (filled form, Save changes, Delete). */
export default function ItemDialog({ items, item, onSuccess }: ItemDialogProps) {
  const [name, setName] = useState(item?.name ?? '');
  const [link, setLink] = useState(item?.link ?? '');
  const [quantityWanted, setQuantityWanted] = useState(String(item?.quantityWanted ?? 1));
  // The placeholder is the DB's stand-in for "no image", not a link to edit, so it starts blank.
  const [image, setImage] = useState(item?.image && item.image !== PLACEHOLDER_IMAGE ? item.image : '');
  // Opens the delete confirmation on top of the edit form.
  const [isDeleteActive, setIsDeleteActive] = useState(false);
  const { errors: fieldErrors, check, clear, checkAll } = useFieldErrors<ErrorField>();
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  const claimedTotal = item ? getClaimedQuantity(item) : 0;
  const takenNames = items.filter((other) => other.id !== item?.id).map((other) => other.name);

  // The messages come from lib/validate.ts and lib/registry.ts, so they match what the server would say.
  const checks = {
    name: () => checkRequired(name, 'Item name') ?? checkUniqueName(name, takenNames, 'item'),
    link: () => checkHttpUrl(link, 'Product link'),
    // Can't drop below what guests have already claimed. The server re-checks; it is the real guard.
    quantityWanted: () => checkWholeNumber(parseWholeNumber(quantityWanted), 'Quantity wanted', MAX_REGISTRY_QUANTITY)
      ?? checkWantedNotBelowClaimed(parseWholeNumber(quantityWanted), claimedTotal),
    // Blank is allowed: the DB fills in the placeholder.
    image: () => (image.trim() === '' ? null : checkHttpUrl(image, 'Image link')),
  };

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function save () {
    const ok = checkAll({ name: checks.name(), link: checks.link(), quantityWanted: checks.quantityWanted(), image: checks.image() });
    if (!ok) return;

    if (item === undefined) {
      await runAction("Item added", () => createRegistryItem(name, link, parseWholeNumber(quantityWanted), image));
      return;
    }

    await runAction("Item saved", () => updateRegistryItem(item.id, {
      name,
      link,
      quantityWanted: parseWholeNumber(quantityWanted),
      image,
    }));
  }

  return (
    <>
      <FormDialog
        id="item-dialog"
        title={item ? `Edit ${item.name}` : "Add Item"}
        submitLabel={item ? "Save changes" : "Add"}
        isLoading={isLoading}
        error={!isDeleteActive && serverError && (serverErrorField === null || serverErrorField === 'item') ? serverError : undefined}
        onSubmit={save}
      >
        <Field className="flex w-full text-burg">
          <FieldLabel htmlFor="item-name">Item Name</FieldLabel>
          <Input
            id="item-name"
            type="text"
            placeholder="Stand Mixer"
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

        <Field className="flex w-full text-burg mt-2">
          <FieldLabel htmlFor="item-link">Product Link</FieldLabel>
          <Input
            id="item-link"
            type="url"
            inputMode="url"
            placeholder="https://www.example.com/stand-mixer"
            value={link}
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
          {claimedTotal > 0 && !fieldErrors.quantityWanted && (
            <p className="text-muted-foreground text-xs">{claimedTotal} already claimed.</p>
          )}
          {fieldErrors.quantityWanted && <p className="text-destructive text-xs">{fieldErrors.quantityWanted}</p>}
          {(serverError && serverErrorField === 'quantityWanted') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>

        <Field className="flex w-full text-burg mt-2">
          <FieldLabel htmlFor="item-image">Image Link <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
          <div className="flex w-full items-center gap-2">
            {/* A preview, so a mistyped link is obvious before saving. The gift icon means no picture. */}
            <ItemThumbnail image={parseHttpUrl(image) === null ? null : image.trim()} className="size-12" />
            <Input
              id="item-image"
              type="url"
              inputMode="url"
              placeholder="https://www.example.com/stand-mixer.jpg"
              value={image}
              aria-invalid={Boolean(fieldErrors.image || serverErrorField === 'image')}
              onChange={(e) => {
                setImage(e.target.value);
                clear('image');
                clearServerError();
              }}
              onBlur={() => check('image', checks.image())}
            />
          </div>
          {fieldErrors.image && <p className="text-destructive text-xs">{fieldErrors.image}</p>}
          {(serverError && serverErrorField === 'image') && <p className="text-destructive text-xs">{serverError}</p>}
        </Field>

        {item && (
          <Button
            type="button"
            variant={'ghost-destructive'}
            className="w-full"
            onClick={() => {
              clearServerError();
              setIsDeleteActive(true);
            }}
          >
            Delete {item.name}
          </Button>
        )}
      </FormDialog>
      {item && isDeleteActive && (
        <DeleteItemDialog
          itemToDelete={item}
          onSuccess={onSuccess}
          onCancel={() => setIsDeleteActive(false)}
        />
      )}
    </>
  );
}
