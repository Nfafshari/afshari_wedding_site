"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/confirm-dialog";
import FormDialog from "@/components/form-dialog";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { useFieldErrors } from "@/hooks/use-field-errors";

import { updateRegistryItem, deleteRegistryItem, type ErrorField } from "../action";
import type { RegistryItem } from "../page";
import { parseHttpUrl } from "@/lib/utils";
import { checkWantedNotBelowClaimed, MAX_REGISTRY_QUANTITY } from "@/lib/registry";
import { checkHttpUrl, checkRequired, checkUniqueName, checkWholeNumber, parseWholeNumber } from "@/lib/validate";

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
  const { errors: fieldErrors, check, clear, checkAll } = useFieldErrors<ErrorField>();
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

  // The messages come from lib/validate.ts and lib/registry.ts, so they match the server's.
  const otherNames = items.filter((item) => item.id !== itemToUpdate?.id).map((item) => item.name);
  const checks = {
    name: () => checkRequired(name, 'Item name') ?? checkUniqueName(name, otherNames, 'item'),
    link: () => checkHttpUrl(link, 'Product link'),
    // Can't drop below what guests have already claimed. The server re-checks; it is the real guard.
    quantityWanted: () => checkWholeNumber(parseWholeNumber(quantityWanted), 'Quantity wanted', MAX_REGISTRY_QUANTITY)
      ?? checkWantedNotBelowClaimed(parseWholeNumber(quantityWanted), claimedTotal),
    // Blank reverts to the placeholder image.
    image: () => (image.trim() === '' ? null : checkHttpUrl(image, 'Image link')),
  };

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function editItem () {
    const ok = checkAll({ name: checks.name(), link: checks.link(), quantityWanted: checks.quantityWanted(), image: checks.image() });
    if (!ok) return;

    await runAction("Item saved", () => updateRegistryItem(itemToUpdate?.id, {
      name,
      link,
      quantityWanted: parseWholeNumber(quantityWanted),
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
                clear('name');
                clearServerError();
              }}
              onBlur={() => check('name', checks.name())}
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
                clear('link');
                clearServerError();
              }}
              onBlur={() => check('link', checks.link())}
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
                clear('quantityWanted');
                clearServerError();
              }}
              onBlur={() => check('quantityWanted', checks.quantityWanted())}
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
                  clear('image');
                  clearServerError();
                }}
                onBlur={() => check('image', checks.image())}
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
