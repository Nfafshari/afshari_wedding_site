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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

import { updateBudgetSubcategory, deleteBudgetSubcategory, type ErrorField, type BudgetSubcategoryInput } from "../../action";
import type { BudgetSubcategory } from "../../page";
import { BudgetStatus } from "@/generated/prisma/enums";
import { useDialogSubmit } from "@/hooks/dialog-submit";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { parseMoneyString } from "@/lib/utils";

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
  const [newEstimatedCost, setNewEstimatedCost] = useState(`${subcategoryToUpdate.estimatedCost}`);
  const [newPaidAmount, setNewPaidAmount] = useState(`${subcategoryToUpdate.paidAmount}`);
  const [newStatus, setNewStatus] = useState<BudgetStatus>(subcategoryToUpdate.status)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ErrorField, string>>>({});
  const [isDeleteSubcategoryActive, setIsDeleteSubcategoryActive] = useState(false);   // Flips this dialog between the "edit" view and the "confirm delete" view.

  const { isLoading, serverError, serverErrorField, clearServerError, runAction } = useDialogSubmit<ErrorField>(onSuccess);

  async function editSubcategory(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

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
    await runAction(() => updateBudgetSubcategory(subcategoryToUpdate.id, payload));
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

  async function removeSubcategory(event: React.MouseEvent) {
    // Always stop the dialog's built-in auto-close; we close via onSuccess only when it works.
    event.preventDefault();

    await runAction(() => deleteBudgetSubcategory(subcategoryToUpdate.id));
  }

  if (!isDeleteSubcategoryActive) {
    return (
      <AlertDialogContent id="edit-subcategory-dialog" className="bg-popover rounded-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="page-title border-b border-b-burg w-full">Edit <span className="font-bold">{subcategoryToUpdate.name}</span>?</AlertDialogTitle>
          <Field className="flex w-full text-burg">
            <FieldLabel htmlFor="edit-subcategory-name">New Subcategory Name</FieldLabel>
            <Input
              id="edit-subcategory-name"
              type="text"
              value={newName}
              className={`bg-popover text-burg rounded-sm placeholder:text-muted-foreground ${(fieldErrors.name || serverErrorField === 'name') ? 'border-destructive' : 'border-input'}`}
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
            {fieldErrors.name && <p className="text-destructive/80 text-xs">{fieldErrors.name}</p>}
            {(serverError && serverErrorField === 'name') && <p className="text-destructive/80 text-xs">{serverError}</p>}
          </Field>

          <Field className="flex w-full text-burg mt-2">
            <FieldLabel htmlFor="subcategory-estimate">Estimated Cost</FieldLabel>
            <InputGroup className={`bg-popover text-burg ${(fieldErrors.estimatedCost || serverErrorField === 'estimatedCost') ? 'border-destructive' : 'border-input'}`}>
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput
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
                  }
                }}
              />
            </InputGroup>
            {fieldErrors.estimatedCost && <p className="text-destructive/80 text-xs">{fieldErrors.estimatedCost}</p>}
            {(serverError && serverErrorField === 'estimatedCost') && <p className="text-destructive/80 text-xs">{serverError}</p>}
          </Field>

          <Field className="flex w-full text-burg mt-2">
            <FieldLabel htmlFor="subcategory-paid">Amount Paid</FieldLabel>
            <InputGroup className={`bg-popover text-burg ${(fieldErrors.paidAmount || serverErrorField === 'paidAmount') ? 'border-destructive' : 'border-input'}`}>
              <InputGroupAddon>$</InputGroupAddon>
              <InputGroupInput
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
                  }
                }}
              />
            </InputGroup>
            {fieldErrors.paidAmount && <p className="text-destructive/80 text-xs">{fieldErrors.paidAmount}</p>}
            {(serverError && serverErrorField === 'paidAmount') && <p className="text-destructive/80 text-xs">{serverError}</p>}
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
                      <Badge variant={badge}>{badge}</Badge>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Button
            variant={'destructive'}
            className="w-full mt-4 border border-destructive hover:bg-destructive hover:text-white"
            onClick={() => {
              setIsDeleteSubcategoryActive(true)
            }}
          >
            Delete "{subcategoryToUpdate.name}"?
          </Button>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-muted/20 rounded-sm rounded-t-none">
          <AlertDialogCancel variant={'secondary'} className="hover:bg-gold/90">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={isLoading ? 'bg-primary/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
            onClick={editSubcategory}
          >
            {isLoading ? <Spinner /> : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    );
  }

  return (
    <AlertDialogContent id="delete-subcategory-dialog" className="bg-popover rounded-sm">
      <AlertDialogHeader>
        <AlertDialogTitle className="page-title border-b border-b-burg w-full text-destructive">Delete <span className="font-bold">{subcategoryToUpdate.name}</span>?</AlertDialogTitle>
        <AlertDialogDescription className="text-destructive">
          You are about to delete {subcategoryToUpdate.name}. This cannot be undone. Do you wish to continue?
        </AlertDialogDescription>
        {serverError && <p className="text-destructive/80 text-xs">{serverError}</p>}
      </AlertDialogHeader>
      <AlertDialogFooter className="bg-background rounded-sm rounded-t-none">
        <AlertDialogCancel
          variant={'secondary'}
          className="hover:bg-gold/90"
          onClick={(e) => {
            // Go back to the edit view instead of closing the whole dialog.
            e.preventDefault();
            setIsDeleteSubcategoryActive(false);
          }}
        >
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className={isLoading ? 'bg-destructive/30!' : 'bg-destructive! text-white hover:bg-destructive/80!'}
          onClick={removeSubcategory}
        >
          {isLoading ? <Spinner /> : 'Confirm'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}