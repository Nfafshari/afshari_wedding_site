"use client";

import { useState } from "react";

import FormDialog from "@/components/form-dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";

import { type ErrorField } from "../action";
import { useDemoPlanner } from "../../demo-store";
import type { RegistryItem } from "../page";
import { parseQuantityString } from "@/lib/utils";

interface AddClaimDialogProps {
  /** The item being claimed. */
  itemToClaim: RegistryItem | undefined;
  /** Called after a claim is created so the parent can close the dialog. */
  onSuccess: () => void;
}

export default function AddClaimDialog({ itemToClaim, onSuccess }: AddClaimDialogProps) {
  const { createRegistryClaim } = useDemoPlanner();
  const [claimedBy, setClaimedBy] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  const claimedTotal = itemToClaim?.claimed.reduce((sum, claim) => sum + claim.quantity, 0) ?? 0;
  const remaining = (itemToClaim?.quantityWanted ?? 0) - claimedTotal;

  /**
   * Validates who claimed the item by checking it is not empty.
   * @param value - string value of the name
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function claimedByValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Please say who claimed this.';
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validates the claimed quantity: a whole number of at least 1, and no more than
   * are still available.
   * @param value - string value of the quantity
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function quantityValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Quantity cannot be empty.';
    }

    const parsedQuantity = parseQuantityString(value);
    if (parsedQuantity === null) {
      return 'Quantity must be a whole number of 1 or more.';
    }

    // Instant feedback only — the server re-checks this, and it is the real guard.
    if (parsedQuantity > remaining) {
      return remaining === 1
        ? 'Only 1 is left to claim.'
        : `Only ${remaining} are left to claim.`;
    }

    // return null if validation succeeded
    return null;
  }

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function addClaim () {
    // Validate every field into one local object, then gate on it
    const errors: Partial<Record<ErrorField, string>> = {};

    const claimedByError = claimedByValidator(claimedBy);
    if (claimedByError) {
      errors.claimedBy = claimedByError;
    }

    const quantityError = quantityValidator(quantity);
    if (quantityError) {
      errors.quantity = quantityError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Validation passed, so the quantity parses.
    const parsedQuantity = parseQuantityString(quantity);
    if (parsedQuantity === null) return;

    await runAction("Claim added", () => createRegistryClaim(itemToClaim?.id, claimedBy, parsedQuantity));
  }

  return (
    <FormDialog
      id="add-claim-dialog"
      title={`Who Claimed ${itemToClaim?.name}?`}
      isLoading={isLoading}
      onSubmit={addClaim}
    >
      <p className="text-muted text-sm">
        {remaining} of {itemToClaim?.quantityWanted} still available.
      </p>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="claim-claimed-by">Claimed By</FieldLabel>
        <Input
          id="claim-claimed-by"
          type="text"
          placeholder="Aunt Sue"
          className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(fieldErrors.claimedBy || serverErrorField === 'claimedBy') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setClaimedBy(e.target.value);
            // Typing clears any previous error so the user gets a fresh start.
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ claimedBy, ...rest }) => rest);
            }
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = claimedByValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, claimedBy: msg }));
            } else {
              setFieldErrors(({ claimedBy, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.claimedBy && <p className="text-destructive/80 text-xs">{fieldErrors.claimedBy}</p>}
        {(serverError && serverErrorField === 'claimedBy') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      <Field className="flex w-full text-burg mt-2">
        <FieldLabel htmlFor="claim-quantity">How Many?</FieldLabel>
        <Input
          id="claim-quantity"
          type="text"
          inputMode="numeric"
          placeholder="1"
          value={quantity}
          className={`bg-popover text-burg placeholder:text-muted-foreground rounded-sm ${(fieldErrors.quantity || serverErrorField === 'quantity') ? 'border-destructive' : 'border-input'}`}
          onChange={(e) => {
            setQuantity(e.target.value);
            if (e.target.value.trim() !== '') {
              setFieldErrors(({ quantity, ...rest }) => rest);
            }
            clearServerError();
          }}
          onBlur={(e) => {
            const msg = quantityValidator(e.target.value);
            if (msg) {
              setFieldErrors(prev => ({ ...prev, quantity: msg }));
            } else {
              setFieldErrors(({ quantity, ...rest }) => rest);
            }
          }}
        />
        {fieldErrors.quantity && <p className="text-destructive/80 text-xs">{fieldErrors.quantity}</p>}
        {(serverError && serverErrorField === 'quantity') && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </Field>

      {/* general / no-field errors (e.g. the item vanished) show at the bottom */}
      {(serverError && (serverErrorField === null || serverErrorField === 'item')) && (
        <p className="text-destructive/80 text-xs">{serverError}</p>
      )}
    </FormDialog>
  );
}
