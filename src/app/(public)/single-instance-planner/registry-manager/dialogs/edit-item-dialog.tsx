"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { type ErrorField } from "../action";
import { useDemoPlanner } from "../../demo-store";
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
  const { updateRegistryItem, deleteRegistryItem } = useDemoPlanner();
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

  async function editItem (event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

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

    await runAction("Item updated", () => updateRegistryItem(itemToUpdate?.id, {
      name,
      link,
      quantityWanted: parsedQuantityWanted,
      image,
    }));
  }

  async function removeItem (event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    await runAction("Item removed", () => deleteRegistryItem(itemToUpdate?.id));
  }

  if (!isDeleteItemActive) {
    return (
      <AlertDialogContent id="edit-item-dialog" className="bg-popover rounded-sm max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="page-title border-b border-b-burg w-full">
            Edit <span className="font-bold">{itemToUpdate?.name}</span>?
          </AlertDialogTitle>

          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="edit-item-name">Item Name</FieldLabel>
            <Input
              id="edit-item-name"
              type="text"
              value={name}
              className={`bg-popover text-burg rounded-sm placeholder:text-muted-foreground ${(fieldErrors.name || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
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
            <FieldLabel htmlFor="edit-item-link">Product Link</FieldLabel>
            <Input
              id="edit-item-link"
              type="url"
              inputMode="url"
              value={link}
              className={`bg-popover text-burg rounded-sm placeholder:text-muted-foreground ${(fieldErrors.link || serverErrorField === 'link') ? 'border-destructive' : 'border-input'}`}
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
            <FieldLabel htmlFor="edit-item-quantity">How Many Do You Want?</FieldLabel>
            <Input
              id="edit-item-quantity"
              type="text"
              inputMode="numeric"
              value={quantityWanted}
              className={`bg-popover text-burg rounded-sm placeholder:text-muted-foreground ${(fieldErrors.quantityWanted || serverErrorField === 'quantityWanted') ? 'border-destructive' : 'border-input'}`}
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
              <p className="text-muted text-xs">{claimedTotal} already claimed.</p>
            )}
            {fieldErrors.quantityWanted && <p className="text-destructive/80 text-xs">{fieldErrors.quantityWanted}</p>}
            {(serverError && serverErrorField === 'quantityWanted') && <p className="text-destructive/80 text-xs">{serverError}</p>}
          </Field>

          <Field className="flex w-full text-burg mt-2">
            <FieldLabel htmlFor="edit-item-image">Image Link <span className="text-muted font-normal">(optional)</span></FieldLabel>
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
                className={`bg-popover text-burg rounded-sm placeholder:text-muted-foreground ${(fieldErrors.image || serverErrorField === 'image') ? 'border-destructive' : 'border-input'}`}
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
            {fieldErrors.image && <p className="text-destructive/80 text-xs">{fieldErrors.image}</p>}
            {(serverError && serverErrorField === 'image') && <p className="text-destructive/80 text-xs">{serverError}</p>}
          </Field>

          <Button
            variant={'destructive'}
            className="w-full mt-4 border border-destructive hover:bg-destructive hover:text-white"
            onClick={() => {
              setIsDeleteItemActive(true);
            }}
          >
            Delete {itemToUpdate?.name}?
          </Button>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-muted/20 rounded-sm rounded-t-none">
          <AlertDialogCancel variant={'secondary'} className="hover:bg-gold/90">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={isLoading ? 'bg-primary/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
            onClick={editItem}
          >
            {isLoading ? <Spinner /> : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  }

  return (
    <AlertDialogContent id="delete-item-dialog" className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full text-destructive">
          Delete <span className="font-bold">{itemToUpdate?.name}</span>?
        </AlertDialogTitle>

        {hasClaims ? (
          <AlertDialogDescription className="text-destructive">
            {itemToUpdate?.claimed.length === 1 ? 'A guest has' : `${itemToUpdate?.claimed.length} guests have`} already
            claimed this item ({itemToUpdate?.claimed.map((claim) => claim.claimedBy).join(', ')}). Remove
            their {itemToUpdate?.claimed.length === 1 ? 'claim' : 'claims'} first if you really want it gone.
          </AlertDialogDescription>
        ) : (
          <AlertDialogDescription className="text-destructive">
            You are about to delete {itemToUpdate?.name}. This cannot be undone. Do you wish to continue?
          </AlertDialogDescription>
        )}
        {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-muted/20 rounded-sm rounded-t-none">
        <AlertDialogCancel
          variant={'secondary'}
          className="hover:bg-gold/90"
          onClick={(e) => {
            // Go back to the edit view instead of closing the whole dialog.
            e.preventDefault();
            setIsDeleteItemActive(false);
          }}
        >
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          // Disabled rather than letting them click into a server error we can already
          // see coming. The action re-checks regardless; this is just courtesy.
          disabled={isLoading || hasClaims}
          className={(isLoading || hasClaims) ? 'bg-destructive/30!' : 'bg-destructive! text-white hover:bg-destructive/80!'}
          onClick={removeItem}
        >
          {isLoading ? <Spinner /> : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
