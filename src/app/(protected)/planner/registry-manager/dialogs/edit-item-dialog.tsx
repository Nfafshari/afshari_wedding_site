"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/confirm-dialog";
import FormDialog from "@/components/form-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { updateRegistryItem, deleteRegistryItem, type ErrorField } from "../action";
import type { RegistryItem } from "../page";
import { parseHttpUrl, parseQuantityString } from "@/lib/utils";

/** The placeholder the DB falls back to, reused for the preview when a URL 404s. */
const FALLBACK_IMAGE = '/window.svg';

interface EditItemDialogProps {
  /** Existing items, used for the client-side duplicate-name check. */
  items: RegistryItem[];
  /** The item being edited. */
  itemToUpdate: RegistryItem | undefined;
  /** Called after a successful edit/delete so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function EditItemDialog({ items, itemToUpdate, onSuccess }: EditItemDialogProps) {
  const [name, setName] = useState(itemToUpdate?.name ?? '');
  const [link, setLink] = useState(itemToUpdate?.link ?? '');
  const [quantityWanted, setQuantityWanted] = useState(String(itemToUpdate?.quantityWanted ?? 1));
  const [image, setImage] = useState(itemToUpdate?.image ?? '');
  const [isImagePreviewBroken, setIsImagePreviewBroken] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  // Flips this dialog between the "edit" view and the "confirm delete" view.
  const [isDeleteItemActive, setIsDeleteItemActive] = useState(false);
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  const claimedTotal = itemToUpdate?.claimed.reduce((sum, claim) => sum + claim.quantity, 0) ?? 0;
  // Deleting is blocked while anyone has claimed this — a claim is a real person
  // buying a real gift, so it is not ours to quietly delete along with the item.
  const hasClaims = claimedTotal > 0;

  const previewImage = (image.trim() === '' || isImagePreviewBroken || parseHttpUrl(image) === null)
    ? FALLBACK_IMAGE
    : image.trim();

  /**
   * Validates the item name by checking if it is empty or already taken.
   * @param value - string value of the name
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function nameValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Item name cannot be empty.';
    }

    // Reject a name already used by *another* item (skip the one being edited).
    const isDuplicate = items.some(
      (item) =>
        item.id !== itemToUpdate?.id &&
        item.name.toLowerCase().trim() === value.toLowerCase().trim()
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
   * Validates the quantity wanted. It must be a whole number of at least 1, and it
   * cannot drop below what guests have already claimed.
   * @param value - string value of the quantity
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function quantityWantedValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Quantity cannot be empty.';
    }

    const parsedQuantityWanted = parseQuantityString(value);
    if (parsedQuantityWanted === null) {
      return 'Quantity must be a whole number of 1 or more.';
    }

    // Asking for fewer than are already claimed would un-promise a gift someone is
    // already out buying. The server re-checks this — it is the real guard.
    if (parsedQuantityWanted < claimedTotal) {
      return `${claimedTotal} ${claimedTotal === 1 ? 'is' : 'are'} already claimed, so you cannot ask for fewer than ${claimedTotal}.`;
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validates the image link. Blank is allowed — it reverts to the placeholder.
   * @param value - string value of the image link
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function imageValidator (value: string): string | null {
    if (value.trim() === '') {
      // blank reverts to the placeholder image, so it's valid
      return null;
    }

    if (parseHttpUrl(value) === null) {
      return 'Image link must start with http:// or https://';
    }

    // return null if validation succeeded
    return null;
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function editItem () {
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

    await runAction("Item saved", () => updateRegistryItem(itemToUpdate?.id, {
      name,
      link,
      quantityWanted: parsedQuantityWanted,
      image,
    }));
  }

  async function removeItem () {
    await runAction("Item deleted", () => deleteRegistryItem(itemToUpdate?.id));
  }

  const claimCount = itemToUpdate?.claimed.length ?? 0;

  return (
    <>
      <FormDialog
        id="edit-item-dialog"
        title={`Edit ${itemToUpdate?.name ?? "Item"}`}
        submitLabel="Save changes"
        isLoading={isLoading && !isDeleteItemActive}
        error={!isDeleteItemActive && serverError && !serverErrorField ? serverError : undefined}
        onSubmit={editItem}
      >

          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="edit-item-name">Item Name</FieldLabel>
            <Input
              id="edit-item-name"
              type="text"
              value={name}
              aria-invalid={Boolean(fieldErrors.name || serverErrorField === 'name')}
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
            {fieldErrors.name && <p className="text-destructive text-xs">{fieldErrors.name}</p>}
            {(serverError && serverErrorField === 'name') && <p className="text-destructive text-xs">{serverError}</p>}
          </Field>

          <Field className="flex w-full text-burg mt-2">
            <FieldLabel htmlFor="edit-item-link">Product Link</FieldLabel>
            <Input
              id="edit-item-link"
              type="url"
              inputMode="url"
              value={link}
              aria-invalid={Boolean(fieldErrors.link || serverErrorField === 'link')}
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
            {fieldErrors.link && <p className="text-destructive text-xs">{fieldErrors.link}</p>}
            {(serverError && serverErrorField === 'link') && <p className="text-destructive text-xs">{serverError}</p>}
          </Field>

          <Field className="flex w-full text-burg mt-2">
            <FieldLabel htmlFor="edit-item-quantity">How Many Do You Want?</FieldLabel>
            <Input
              id="edit-item-quantity"
              type="text"
              inputMode="numeric"
              value={quantityWanted}
              aria-invalid={Boolean(fieldErrors.quantityWanted || serverErrorField === 'quantityWanted')}
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
            {hasClaims && !fieldErrors.quantityWanted && (
              <p className="text-muted-foreground text-xs">{claimedTotal} already claimed.</p>
            )}
            {fieldErrors.quantityWanted && <p className="text-destructive text-xs">{fieldErrors.quantityWanted}</p>}
            {(serverError && serverErrorField === 'quantityWanted') && <p className="text-destructive text-xs">{serverError}</p>}
          </Field>

          <Field className="flex w-full text-burg mt-2">
            <FieldLabel htmlFor="edit-item-image">Image Link <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
            <div className="flex w-full items-center gap-2">
              {/*
                Preview so a mistyped URL is obvious before saving — paste-a-URL is
                unforgiving otherwise. Plain <img> for the same reason as the row:
                arbitrary CDNs can't be allowlisted in images.remotePatterns.
              */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setIsImagePreviewBroken(true)}
                className="w-12 h-12 shrink-0 rounded-sm border border-border bg-muted/10 object-contain p-1"
              />
              <Input
                id="edit-item-image"
                type="url"
                inputMode="url"
                value={image}
                aria-invalid={Boolean(fieldErrors.image || serverErrorField === 'image')}
                onChange={(e) => {
                  setImage(e.target.value);
                  // Give the new URL a fresh chance to load rather than staying broken.
                  setIsImagePreviewBroken(false);
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
            </div>
            {fieldErrors.image && <p className="text-destructive text-xs">{fieldErrors.image}</p>}
            {(serverError && serverErrorField === 'image') && <p className="text-destructive text-xs">{serverError}</p>}
          </Field>

          <Button
            type="button"
            variant={'ghost-destructive'}
            className="w-full"
            onClick={() => {
              clearServerError();
              setIsDeleteItemActive(true);
            }}
          >
            Delete {itemToUpdate?.name}
          </Button>
      </FormDialog>
      <ConfirmDialog
        open={isDeleteItemActive}
        onOpenChange={setIsDeleteItemActive}
        title={`Delete ${itemToUpdate?.name}?`}
        description={hasClaims
          ? `${claimCount === 1 ? 'A guest has' : `${claimCount} guests have`} already claimed this item (${itemToUpdate?.claimed.map((claim) => claim.claimedBy).join(', ')}). Remove their ${claimCount === 1 ? 'claim' : 'claims'} first if you really want it gone.`
          : "You can't undo this."}
        isLoading={isLoading}
        // Blocked rather than letting them click into a server error we can already
        // see coming. The action re-checks regardless; this is just courtesy.
        confirmDisabled={hasClaims}
        error={serverError || undefined}
        onConfirm={removeItem}
      />
    </>
  );
}
