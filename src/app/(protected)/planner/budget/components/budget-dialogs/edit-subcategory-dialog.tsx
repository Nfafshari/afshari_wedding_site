"use client";

import { useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/confirm-dialog";
import FormDialog from "@/components/form-dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

import { updateBudgetSubcategory, deleteBudgetSubcategory, type ErrorField, type BudgetSubcategoryInput } from "../../action";
import type { BudgetSubcategory } from "../../page";
import { BudgetStatus } from "@/generated/prisma/enums";
import { useDialogSubmit } from "@/hooks/use-dialog-submit";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BudgetStatusBadge from "@/components/budget-status-badge";
import { parseMoneyString, toAmount } from "@/lib/utils";

interface EditSubcategoryDialogProps {
  /** The subcategory being edited. */
  subcategoryToUpdate: BudgetSubcategory;
  /** Called after a successful rename/delete so the parent can close the dialog. */
  onSuccess: () => void;
}

// badge variants for select input
const BADGE_VARIANT = Object.values(BudgetStatus);

export default function EditSubcategoryDialog({ subcategoryToUpdate, onSuccess }: EditSubcategoryDialogProps) {
  const [newName, setNewName] = useState(subcategoryToUpdate.name);
  const [newEstimatedCost, setNewEstimatedCost] = useState(toAmount(subcategoryToUpdate.estimatedCost));
  const [newPaidAmount, setNewPaidAmount] = useState(toAmount(subcategoryToUpdate.paidAmount));
  const [newStatus, setNewStatus] = useState<BudgetStatus>(subcategoryToUpdate.status)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  const [isDeleteSubcategoryActive, setIsDeleteSubcategoryActive] = useState(false);   // Opens the delete confirmation on top of the edit form.

  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  // FormDialog has already called preventDefault, so this just runs our logic.
  async function editSubcategory() {
    // Validate every field into one local object, then gate on it
    const errors: Partial<Record<ErrorField, string>> = {};

    const nameError = nameValidator(newName);
    if (nameError) {
      errors.name = nameError;
    }

    const estimatedCostError = estimatedCostValidator(newEstimatedCost);
    if (estimatedCostError) {
      errors.estimatedCost = estimatedCostError;
    }

    const paidAmountError = paidAmountValidator(newPaidAmount);
    if (paidAmountError) {
      errors.paidAmount = paidAmountError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Validation passed, so both money strings parse. Re-parse for the diff
    const parsedEstimatedCost = parseMoneyString(newEstimatedCost);
    const parsedPaidAmount = parseMoneyString(newPaidAmount);
    if (parsedEstimatedCost === null || parsedPaidAmount === null) return;

    // Build the payload with only the fields that actually changed; unchanged
    //    fields stay undefined so the server (and Prisma) leave those columns alone.
    //    Money is compared in cents so "100" and "100.00" don't count as a change.
    const trimmedName = newName.trim();
    const payload: BudgetSubcategoryInput = {
      name: trimmedName !== subcategoryToUpdate.name ? trimmedName : undefined,
      estimatedCost:
        Math.round(parsedEstimatedCost * 100) !== Math.round(subcategoryToUpdate.estimatedCost * 100)
          ? parsedEstimatedCost
          : undefined,
      paidAmount:
        Math.round(parsedPaidAmount * 100) !== Math.round(subcategoryToUpdate.paidAmount * 100)
          ? parsedPaidAmount
          : undefined,
      status: newStatus !== subcategoryToUpdate.status ? newStatus : undefined,
    };

    // Nothing changed, close the dialog without a pointless write.
    if (Object.values(payload).every((value) => value === undefined)) {
      onSuccess();
      return;
    }

    // Send it. Server-side field errors surface via serverError / serverErrorField.
    await runAction("Subcategory saved", () => updateBudgetSubcategory(subcategoryToUpdate.id, payload));
  }

  /**
   * Validates the subcategory name by checking if it is empty
   * @param value - string value of the name
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function nameValidator (value: string): string | null {
    if (value.trim() === '') {
      return 'Subcategory name cannot be empty.';
    }

    // return null if validation succeeded
    return null;
  }

  /**
   * Validated estimated cost by checking if it is empty or does not match currency format
   * @param value - string value of estimated cost
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function estimatedCostValidator (value: string): string | null {
    const trimmedValue = value.trim();
    if (trimmedValue === '') {
      // return a message if validation fails
      return "Estimated cost cannot be empty.";
    } 
    
    const parsedEstimatedCost = parseMoneyString(trimmedValue);
    if (parsedEstimatedCost === null) {
      return 'Estimated cost must include only numbers and at most 2 decimal places. (i.e. "1,000", "1.0", or "1.25")';
    }

    // return null if validation succeeded
    return null;
  }

  /** 
   * Validated paid amount by checking if it is empty or does not match currency format
   * @param value - string value of paid amount
   * @returns a **string** message if it fails, otherwise **null** to clear errors
   */
  function paidAmountValidator (value: string): string | null {
    const trimmedValue = value.trim();
    if (trimmedValue === '') {
      // return a message if validation fails
      return "Amount paid cannot be empty.";
    } 
    
    const parsedPaidAmount = parseMoneyString(trimmedValue);
    if (parsedPaidAmount === null) {
      return 'Amount paid must include only numbers and at most 2 decimal places. (i.e. "1,000", "1.0", or "5.25")';
    }

    // return null if validation succeeded
    return null;
  }

  async function removeSubcategory() {
    await runAction("Subcategory deleted", () => deleteBudgetSubcategory(subcategoryToUpdate.id));
  }

  return (
    <>
      <FormDialog
        id="edit-subcategory-dialog"
        title={`Edit ${subcategoryToUpdate.name}`}
        submitLabel="Save changes"
        isLoading={isLoading && !isDeleteSubcategoryActive}
        error={!isDeleteSubcategoryActive && serverError && !serverErrorField ? serverError : undefined}
        onSubmit={editSubcategory}
      >
          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="edit-subcategory-name">New Subcategory Name</FieldLabel>
            <Input
              id="edit-subcategory-name"
              type="text"
              value={newName}
              aria-invalid={Boolean(fieldErrors.name || serverErrorField === 'name')}
              onChange={(e) => {
                setNewName(e.target.value);
                // Typing clears any previous error so the user gets a fresh start.
                if (e.target.value.trim() !== '') {
                  setFieldErrors(({ name, ...rest}) => rest)
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
            <FieldLabel htmlFor="subcategory-estimate">Estimated Cost</FieldLabel>
            <InputGroup>
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput
            aria-invalid={Boolean(fieldErrors.estimatedCost || serverErrorField === 'estimatedCost')}
                id="subcategory-estimate"
                type="text"
                inputMode="decimal"
                value={newEstimatedCost}
                onChange={(e) => {
                  setNewEstimatedCost(e.target.value);
                  // Typing clears any previous error so the user gets a fresh start.
                  if (e.target.value.trim() !== '') {
                    setFieldErrors(({ estimatedCost, ...rest}) => rest);
                  }
                  clearServerError();
                }}
                onBlur={(e) => {
                  const msg = estimatedCostValidator(e.target.value);
                  if (msg) {
                    setFieldErrors(prev => ({ ...prev, estimatedCost: msg }));
                  } else {
                    setFieldErrors(({ estimatedCost, ...rest }) => rest);

                    // Known-good, so snap the field to canonical formatting ("1000" -> "1,000.00").
                    const parsedEstimatedCost = parseMoneyString(e.target.value);
                    if (parsedEstimatedCost !== null) {
                      setNewEstimatedCost(toAmount(parsedEstimatedCost));
                    }
                  }
                }}
              />
            </InputGroup>
            {fieldErrors.estimatedCost && <p className="text-destructive text-xs">{fieldErrors.estimatedCost}</p>}
            {(serverError && serverErrorField === 'estimatedCost') && <p className="text-destructive text-xs">{serverError}</p>}
          </Field>

          <Field className="flex w-full text-burg mt-2">
            <FieldLabel htmlFor="subcategory-paid">Amount Paid</FieldLabel>
            <InputGroup>
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput
            aria-invalid={Boolean(fieldErrors.paidAmount || serverErrorField === 'paidAmount')}
                id="subcategory-paid"
                type="text"
                inputMode="decimal"
                value={newPaidAmount}
                onChange={(e) => {
                  setNewPaidAmount(e.target.value);
                  // Typing clears any previous error so the user gets a fresh start.
                  if (e.target.value.trim() !== '') {
                    setFieldErrors(({ paidAmount, ...rest}) => rest);
                  }
                  clearServerError();
                }}
                onBlur={(e) => {
                  const msg = paidAmountValidator(e.target.value);
                  if (msg) {
                    setFieldErrors(prev => ({ ...prev, paidAmount: msg }));
                  } else {
                    setFieldErrors(({ paidAmount, ...rest }) => rest);

                    // Known-good, so snap the field to canonical formatting ("1000" -> "1,000.00").
                    const parsedPaidAmount = parseMoneyString(e.target.value);
                    if (parsedPaidAmount !== null) {
                      setNewPaidAmount(toAmount(parsedPaidAmount));
                    }
                  }
                }}
              />
            </InputGroup>
            {fieldErrors.paidAmount && <p className="text-destructive text-xs">{fieldErrors.paidAmount}</p>}
            {(serverError && serverErrorField === 'paidAmount') && <p className="text-destructive text-xs">{serverError}</p>}
          </Field>

          <Field className="flex w-full text-burg mt-2">
            <FieldLabel htmlFor="subcategory-status">Status</FieldLabel>
            <Select
              value={newStatus}
              onValueChange={(val: BudgetStatus) => {
                setNewStatus(val)
              }}
            >
              <SelectTrigger id={"subcategory-status"}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {BADGE_VARIANT.map((badge, idx) => (
                    <SelectItem 
                      key={`badge-${badge}-${idx}`} value={badge} 
                      className="focus:bg-muted/20"
                    >
                      <BudgetStatusBadge status={badge} />
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Button
            type="button"
            variant={'ghost-destructive'}
            className="w-full"
            onClick={() => {
              clearServerError();
              setIsDeleteSubcategoryActive(true)
            }}
          >
            Delete {subcategoryToUpdate.name}
          </Button>
      </FormDialog>
      <ConfirmDialog
        open={isDeleteSubcategoryActive}
        onOpenChange={setIsDeleteSubcategoryActive}
        title={`Delete ${subcategoryToUpdate.name}?`}
        description="You can't undo this."
        isLoading={isLoading}
        error={serverError || undefined}
        onConfirm={removeSubcategory}
      />
    </>
  );
}